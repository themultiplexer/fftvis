/*
 ********************************
 ********** Basic Setup *********
 ********************************
 */
import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
//const { XRRigidTransform } = window;

const FFT = require('fft.js');
const getUserMedia = require('get-user-media-promise');
const MicrophoneStream = require('microphone-stream').default;

import { vertShaderCube } from "./vert.js";
import { fragShaderCube } from "./frag.js";

let rectSidelengthX = 60;
let rectSidelengthY = 60;
let terrainWidth = 3.0;

// defining the variables
let camera, scene, renderer, cameraGroup, directionalLight, ambientLight;
var uniforms, texture, texdata;
var cam_controller;

let initialCameraPosition = new THREE.Vector3(0, -2, 1.25)

const sample_size = 1024

const width = 30;
const height = 30;

var flicker = false
var zoom = false
var lines = true

document.getElementById("PAW").addEventListener("click", togglePause, false);

function togglePause() {
  const micStream = new MicrophoneStream({
    bufferSize: sample_size
  });

  getUserMedia({ video: false, audio: true })
    .then(function (stream) {
      micStream.setStream(stream);
    }).catch(function (error) {
      console.log(error);
    });

  micStream.on('data', function (chunk) {
    const input = MicrophoneStream.toRaw(chunk)

    const f = new FFT(sample_size);
    const out = f.createComplexArray();
    const data = f.toComplexArray(input);
    f.transform(out, data);

    var freqs = []
    for (let i = 0; i < width; i++) {
      const re = out[2 * i];
      const im = out[2 * i + 1];
      freqs[i] = Math.sqrt(re * re + im * im);
    }


    if (freqs[2] > 30.0) {
      if (flicker) {
        scene.background = new THREE.Color('#222222')
      }
      if (zoom) {
        if (cameraGroup.position.y < -1.9) {
          cameraGroup.position.y += 0.02
        }
      }
    } else {
      if (flicker) {
        scene.background = new THREE.Color('#111111')
      }
      if (zoom) {
        if (cameraGroup.position.y > -2.2) {
          cameraGroup.position.y -= 0.02
        }
      }
    }

    var line = new Array(width)
    for (let i = 0; i < width; i++) {
      line[i] = freqs[i];
    }
    texdata.push(...line)
    texdata = texdata.splice(width)

    texture = new THREE.DataTexture(new Float32Array(texdata), width, height, THREE.RedFormat, THREE.FloatType, THREE.UVMapping);
    texture.needsUpdate = true;

    uniforms.texture1.value = texture
  });

  micStream.on('format', function (format) {
    //console.log(format);
  });
}

function init() {
  // +++ create a WebGLRenderer +++
  // enables antialiasing (nicer geometry: borders without stair effect)
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.xr.enabled = true;
  // get and set window dimension for the renderer
  renderer.setSize(window.innerWidth, window.innerHeight);

  // add dom object(renderer) to the body section of the index.html
  document.body.appendChild(renderer.domElement);
  document.body.appendChild(VRButton.createButton(renderer));



  scene = new THREE.Scene();

  // adding rectSidelength camera PerspectiveCamera( fov, aspect, near, far)
  camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 1000);


  cameraGroup = new THREE.Group();
  cameraGroup.add(camera);
  scene.add(cameraGroup);
  cameraGroup.position.set(0.0, -2.0, 1.25)
  //camera.position.set(0.0, -2.0, 1.25)
  let vertices, uvs, indices, v_bc;
  let geometry = new THREE.BufferGeometry();

  vertices = []
  indices = []
  uvs = []
  v_bc = []

  const x = -(terrainWidth / 2.0)
  const y = -(terrainWidth / 2.0)
  const face_sizex = terrainWidth / rectSidelengthY
  const face_sizey = terrainWidth / rectSidelengthX

  for (let i = 0; i < rectSidelengthX; i++) {
    for (let j = 0; j < rectSidelengthY; j++) {
      vertices.push(x + j * face_sizex, y + i * face_sizey + 0, i * face_sizey);
      uvs.push(j / rectSidelengthY, 1.0 - i / rectSidelengthX)
      if ((i + j) % 3 == 0) {
        v_bc.push(1.0, 0.0, 0.0)
      } else if ((i + j) % 3 == 1) {
        v_bc.push(0.0, 1.0, 0.0)
      } else if ((i + j) % 3 == 2) {
        v_bc.push(0.0, 0.0, 1.0)
      }
    }
  }
  for (let i = 0; i < rectSidelengthX - 1; i++) {
    for (let j = 0; j < rectSidelengthY - 1; j++) {
      let l1 = i * rectSidelengthX + j
      let l2 = (i + 1) * rectSidelengthY + j
      indices.push(l1, l2 + 1, l2);
      indices.push(l1, l1 + 1, l2 + 1);
    }
  }

  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('v_bc', new THREE.Float32BufferAttribute(v_bc, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  scene.background = new THREE.Color('#111111')

  const gui = new GUI({ width: 400 });

  //let axes = new THREE.AxesHelper(5.0);
  //scene.add(axes)

  // generate menu items
  let scene_params = {
    "flicker": flicker,
    "zoom": zoom,
    "cam": "Default Camera",
    "lines": lines
  };

  cam_controller = gui.add(scene_params, "cam", { "Top Down": 0, "Front": 1, "Underside": 2, "Custom": 3 }).onChange(function (value) {

    if (value == 3) {
      return
    }

    let original = initialCameraPosition
    let target = new THREE.Vector3(0, 0, 0)

    switch (value) {
      case 0:
        target = new THREE.Vector3(0, 0, 2.5)
        break;
      case 1:
        target = initialCameraPosition
        break;
      case 2:
        target = new THREE.Vector3(0, 0, -2)
      default:
        break;
    }

    controls.removeEventListener('change', cameraChanged);
    gsap.to({}, {
      duration: 1,
      onUpdate: function () {
        cameraGroup.position.x = (1.0 - this.progress()) * original.x + this.progress() * target.x
        cameraGroup.position.y = (1.0 - this.progress()) * original.y + this.progress() * target.y
        cameraGroup.position.z = (1.0 - this.progress()) * original.z + this.progress() * target.z
        cameraGroup.lookAt(0, 0, 0);
        controls.update();
      },
      onComplete: function () {
        controls.addEventListener('change', cameraChanged);
      }
    });
  })

  const size = width * height;
  texdata = new Array(size);
  texdata.fill(0)

  texture = new THREE.DataTexture(new Float32Array(texdata), width, height, THREE.RedFormat, THREE.FloatType, THREE.UVMapping);
  texture.needsUpdate = true;

  uniforms = {
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    texture1: { type: "t", value: texture },
    lineWidth: { value: 0.05 },
    lines: { value: lines },
  };

  var material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertShaderCube,
    fragmentShader: fragShaderCube,
  });
  material.transparent = true;
  material.side = THREE.DoubleSide;
  material.extensions.derivatives = true;

  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);


  gui.add(scene_params, "flicker").onChange(function (bool_val) {
    flicker = bool_val
  })
  gui.add(scene_params, "lines").onChange(function (bool_val) {
    uniforms.lines.value = bool_val
  })
  gui.add(scene_params, "zoom").onChange(function (bool_val) {
    zoom = bool_val
  })

  let wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0xaaaaaa,
    wireframe: true,
    opacity: 0.15,
    transparent: true,
    //map: new THREE.TextureLoader().load('assets/heightmapFlat.png')
  });
  let wireframe = new THREE.Mesh(geometry, wireframeMaterial);

  //scene.add(wireframe);

  // add controls to the scene
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', cameraChanged);
  controls.update();

  renderer.setPixelRatio(window.devicePixelRatio);
  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);



  renderer.xr.addEventListener('sessionstart', () => {

    //renderer.xr.getCamera().position.copy(camera.position);
    //renderer.xr.getCamera().lookAt(0, 0, 0);
    //controls.update()

    //let offsetTransform = new XRRigidTransform({ x: 2, y: 0, z: 13 }, { x: 0, y: 1, z: 0, w: 1 })
    //const baseReferenceSpace = renderer.xr.getReferenceSpace()
    //renderer.xr.setOffsetReferenceSpace(baseReferenceSpace.getOffsetReferenceSpace(offsetTransform))
    //cameraGroup.position.copy(renderer.xr.getCamera().position);
    let vrpos = renderer.xr.getCamera().position
    let vrrot = renderer.xr.getCamera().rotation
    cameraGroup.position.set((cameraGroup.position.x - vrpos.x), (cameraGroup.position.y - vrpos.y), (cameraGroup.position.z - vrpos.z));
    let rotMat = new THREE.Matrix4().makeRotationFromEuler(vrrot);
    let invRotMat = new THREE.Matrix4();
    invRotMat.copy(rotMat).invert()
    //cameraGroup.setRotationFromMatrix(invRotMat)
    cameraGroup.lookAt(0, 0, 0);

  });


  document.getElementById("PAW").click()
}

function cameraChanged(event) {
  cam_controller.setValue(3)
}

function onWindowResize(event) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}

init();
// animation function calling the renderer
renderer.setAnimationLoop(function () {
  renderer.render(scene, camera);
});
