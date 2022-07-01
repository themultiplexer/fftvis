/*
 ********************************
 ********** Basic Setup *********
 ********************************
 */
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const FFT = require('fft.js');
const getUserMedia = require('get-user-media-promise');
const MicrophoneStream = require('microphone-stream').default;

import { vertShaderCube } from "./vertShaderCube.vert.js";
import { fragShaderCube } from "./fragShaderCube.frag.js";

let rectSidelength = 1024;
let terrainWidth = 2;


// defining the variables
let camera, scene, renderer, directionalLight, ambientLight;
var uniforms, texture, texdata;
const sample_size = 1024
const freq_range = sample_size / 8.0

function init() {
  // +++ create a WebGLRenderer +++
  // enables antialiasing (nicer geometry: borders without stair effect)
  renderer = new THREE.WebGLRenderer({ antialias: true });

  // get and set window dimension for the renderer
  renderer.setSize(window.innerWidth, window.innerHeight);

  // add dom object(renderer) to the body section of the index.html
  document.body.appendChild(renderer.domElement);

  // adding rectSidelength camera PerspectiveCamera( fov, aspect, near, far)
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100 );
  camera.position.z = 1;
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#878787')


  let vertices, uvs;
  let geometry = new THREE.BufferGeometry();
  let indices;

  vertices = []
  indices = []
  uvs = []

  const x = -(terrainWidth / 2.0)
  const z = -(terrainWidth / 2.0)
  const face_size = terrainWidth / rectSidelength

  for (let i = 0; i < rectSidelength; i++) {
    for (let j = 0; j < rectSidelength; j++) {
      vertices.push(x + j * face_size, z + i * face_size + 0, 0);
      uvs.push(j / rectSidelength, 1.0 - i / rectSidelength)
    }
  }
  for (let i = 0; i < rectSidelength - 1; i++) {
    for (let j = 0; j < rectSidelength - 1; j++) {
      let l1 = i * rectSidelength + j
      let l2 = (i + 1) * rectSidelength + j
      indices.push(l1, l2 + 1, l2);
      indices.push(l1, l1 + 1, l2 + 1);
    }
  }

  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  const width = freq_range;
  const height = 200;

  const size = width * height;
  texdata = new Array(4 * size);
  const color = new THREE.Color(0x440000);

  for (let i = 0; i < size; i++) {
    const stride = i * 4;
    texdata[stride] = color.r;
    texdata[stride + 1] = color.g;
    texdata[stride + 2] = color.b;
    texdata[stride + 3] = 1.0;
  }
  texture = new THREE.DataTexture(new Float32Array(texdata), width, height, THREE.RGBAFormat, THREE.FloatType, THREE.UVMapping);
  texture.needsUpdate = true;

  uniforms = {
    //u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    texture1: { type: "t", value: texture }
  };

  var material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertShaderCube,
    fragmentShader: fragShaderCube,
  });

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

  // get Buffers (Essentially a Uint8Array DataView of the same Float32 values)
  micStream.on('data', function (chunk) {
    // Optionally convert the Buffer back into a Float32Array
    // (This actually just creates a new DataView - the underlying audio data is not copied or modified.)
    const input = MicrophoneStream.toRaw(chunk)

    const f = new FFT(sample_size);
    //const input = new Array(4096);
    //input.fill(0);
    const out = f.createComplexArray();
    const data = f.toComplexArray(input);
    f.transform(out, data);


    var freqs = []
    for (let i = 0; i < freq_range; i++) {
      const re = out[2 * i];
      const im = out[2 * i + 1];
      freqs[i] = Math.sqrt(re * re + im * im);
    }
    var maxpeak = Math.max(...freqs) + 0.000001

    //const c1 = (freqs[1] / maxpeak) > 0.4 ? new THREE.Vector3(0.3, 0.3, 0.3) : new THREE.Vector3(0.0, 0.0, 0.0)
    const c1 = new THREE.Vector3(0.0, 0.0, 0.0)
    const c2 = new THREE.Vector3(1.0, 1.0, 0.0)

    var line = new Array(freq_range * 4)
    for (let i = 0; i < freq_range; i++) {
      var mag = freqs[i] / maxpeak
      //mag = Math.pow(mag, 2.0)

      const color = c1.clone().multiplyScalar((1.0 - mag)).add(c2.clone().multiplyScalar(mag))

      const stride = i * 4;
      line[stride] = color.x;
      line[stride + 1] = color.y;
      line[stride + 2] = color.z;
      line[stride + 3] = 1.0;
    }
    texdata.push(...line)
    texdata = texdata.splice(freq_range * 4)

    texture = new THREE.DataTexture(new Float32Array(texdata), width, height, THREE.RGBAFormat, THREE.FloatType, THREE.UVMapping);
    texture.needsUpdate = true;
    texture.generateMipmaps = true;

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
