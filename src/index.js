/*
 ********************************
 ********** Basic Setup *********
 ********************************
 */
import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const FFT = require('fft.js');
const getUserMedia = require('get-user-media-promise');
const MicrophoneStream = require('microphone-stream').default;

import { vertShaderCube } from "./vert.js";
import { fragShaderCube } from "./frag.js";
import { Vector3 } from "three";

let rectSidelengthX = 50;
let rectSidelengthY = 50;
let terrainWidth = 3;


// defining the variables
let camera, scene, renderer, directionalLight, ambientLight;
var uniforms, texture, texdata;
const sample_size = 1024

const width = 20;
const height = 20;

function init() {
  // +++ create a WebGLRenderer +++
  // enables antialiasing (nicer geometry: borders without stair effect)
  renderer = new THREE.WebGLRenderer({ antialias: true });

  // get and set window dimension for the renderer
  renderer.setSize(window.innerWidth, window.innerHeight);

  // add dom object(renderer) to the body section of the index.html
  document.body.appendChild(renderer.domElement);

  // adding rectSidelength camera PerspectiveCamera( fov, aspect, near, far)
  camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.01, 100);
  camera.position.z = 1.25;
  camera.position.y = -2;
  scene = new THREE.Scene();

  let vertices, uvs;
  let geometry = new THREE.BufferGeometry();
  let indices;

  vertices = []
  indices = []
  uvs = []

  const x = -(terrainWidth / 2.0)
  const z = -(terrainWidth / 2.0)
  const face_sizex = terrainWidth / rectSidelengthY
  const face_sizey = terrainWidth / rectSidelengthX

  for (let i = 0; i < rectSidelengthX; i++) {
    for (let j = 0; j < rectSidelengthY; j++) {
      vertices.push(x + j * face_sizex, z + i * face_sizey + 0, 0);
      uvs.push(j / rectSidelengthY, 1.0 - i / rectSidelengthX)
    }
  }
  for (let i = 0; i < rectSidelengthX - 1; i++) {
    for (let j = 0; j < rectSidelengthY - 1; j++) {
      let l1 = i * rectSidelengthY + j
      let l2 = (i + 1) * rectSidelengthY + j
      indices.push(l1, l2 + 1, l2);
      indices.push(l1, l1 + 1, l2 + 1);
    }
  }

  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();


  const targetOrientation = new THREE.Quaternion().set(1.0, 1.0, 0.0, 1).normalize();
  gsap.to({}, {
    duration: 1,
    onUpdate: function () {
      //camera.position.y = this.progress()
      //camera.setRotationFromAxisAngle(new Vector3(0,0,1,0), this.progress())
      //camera.quaternion.slerp(targetOrientation, this.progress());
      //camera.lookAt(0, 0, 0);
      //THREE.Quaternion.slerp(camera.quaternion, targetOrientation, qm, 0.07);
    }
  });

  //

  const size = width * height;
  texdata = new Array(size);
  texdata.fill(0)

  texture = new THREE.DataTexture(new Float32Array(texdata), width, height, THREE.RedFormat, THREE.FloatType, THREE.UVMapping);
  texture.needsUpdate = true;

  uniforms = {
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    texture1: { type: "t", value: texture }
  };

  var material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertShaderCube,
    fragmentShader: fragShaderCube,
  });

  material.side = THREE.DoubleSide;

  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

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
  controls.update();

  renderer.setPixelRatio(window.devicePixelRatio);
  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);

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
      scene.background = new THREE.Color('#222222')
      if (camera.position.y < -1.9) {
        camera.position.y += 0.01
      }
    } else {
      scene.background = new THREE.Color('#111111')
      if (camera.position.y > -2.2) {
        camera.position.y -= 0.01
      }

    }


    var line = new Array(width)
    for (let i = 0; i < width; i++) {
      var mag = freqs[i]
      line[i] = mag;
    }
    texdata.push(...line)
    texdata = texdata.splice(width)

    texture = new THREE.DataTexture(new Float32Array(texdata), width, height, THREE.RedFormat, THREE.FloatType, THREE.UVMapping);
    texture.needsUpdate = true;

    uniforms.texture1.value = texture
  });

  // It also emits a format event with various details (frequency, channels, etc)
  micStream.on('format', function (format) {
    console.log(format);
  });
}

function onWindowResize(event) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}

// extendable render wrapper
function render() {
  renderer.render(scene, camera);
}

// animation function calling the renderer
function animate() {
  requestAnimationFrame(animate);
  render();
}

init();
animate();
