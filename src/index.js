/*
 ********************************
 ********** Basic Setup *********
 ********************************
 */
import * as THREE from "three";
const FFT = require('fft.js');
const getUserMedia = require('get-user-media-promise');
const MicrophoneStream = require('microphone-stream').default;

import { vertShaderCube } from "./vertShaderCube.vert.js";
import { fragShaderCube } from "./fragShaderCube.frag.js";
import { Texture } from "three";

// defining the variables
let camera, scene, renderer, directionalLight, ambientLight;
var uniforms;

function init() {
  // +++ create a WebGLRenderer +++
  // enables antialiasing (nicer geometry: borders without stair effect)
  renderer = new THREE.WebGLRenderer({ antialias: true });

  // get and set window dimension for the renderer
  renderer.setSize(window.innerWidth, window.innerHeight);

  // add dom object(renderer) to the body section of the index.html
  document.body.appendChild(renderer.domElement);

  camera = new THREE.Camera();
  camera.position.z = 1;
  scene = new THREE.Scene();
  var geometry = new THREE.PlaneGeometry(2, 2);

  
  const width = 4096;
  const height = 1;
  
  const size = width * height;
  const texdata = new Float32Array( 4 * size );
  const color = new THREE.Color( 0xffeeff );
  
  for ( let i = 0; i < size; i ++ ) {
    const stride = i * 4;
    texdata[ stride ] = color.r * (i/size);
    texdata[ stride + 1 ] = color.g * (i/size);
    texdata[ stride + 2 ] = color.b * (i/size);
    texdata[ stride + 3 ] = 1.0;
  }
  var texture = new THREE.DataTexture( texdata, width, height, THREE.RGBAFormat, THREE.FloatType, THREE.UVMapping);
  texture.needsUpdate = true;

  /*
  const textureSize = 16
  const dataSize = 10;
  const data = new Uint8Array(dataSize);

  for (let i = 0; i < dataSize; i++) {
    data[i] = Math.round(Math.random() * 255); // pass anything from 0 to 255
  }

  var texture = new THREE.DataTexture(data, textureSize, textureSize, THREE.LuminanceFormat, THREE.UnsignedByteType, THREE.UVMapping);
  //texture = new Texture(texture)
  texture.needsUpdate = true;
  */


  //texture.generateMipmaps = true;
  //texture = new THREE.TextureLoader().load('texture.jpg');

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

  renderer.setPixelRatio(window.devicePixelRatio);
  onWindowResize();
  window.addEventListener('resize', onWindowResize, false);


  const micStream = new MicrophoneStream();

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

    const f = new FFT(4096);
    //const input = new Array(4096);
    //input.fill(0);
    const out = f.createComplexArray();
    const data = f.toComplexArray(input);
    f.transform(out, data);

    //console.log(out)


    //uniforms.texture1.value = texture

    // note: if you set options.objectMode=true, the `data` event will output AudioBuffers instead of Buffers
  });

  // or pipe it to another stream
  //micStream.pipe(/*...*/);

  // Access the internal audioInput for connecting to another nodes
  //micStream.audioInput.connect(/*...*/));

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
