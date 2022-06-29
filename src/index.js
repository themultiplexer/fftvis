/*
 ********************************
 ********** Basic Setup *********
 ********************************
 */
import * as THREE from "three";

import { vertShaderCube } from "./vertShaderCube.vert.js";
import { fragShaderCube } from "./fragShaderCube.frag.js";

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
  var geometry = new THREE.PlaneGeometry( 2, 2 );

  uniforms = {
      //u_time: { type: "f", value: 1.0 },
      u_resolution: { type: "v2", value: new THREE.Vector2() },
      //u_mouse: { type: "v2", value: new THREE.Vector2() },
      iGlobalTime: { type: "f", value: 1.0 },
      iResolution: { type: "v3", value: new THREE.Vector3() },
      zoom: { value: 2 },
      rotation: { value: 0 },
      //focus : {type: "v3", value: new THREE.Vector3(-1.48, 0.0)}
      //focus : {type: "v3", value: new THREE.Vector3(-1.9, 0.0)}
      focus : {type: "v3", value: new THREE.Vector3(-1.99999999999, 0.0)}
  };

  var material = new THREE.ShaderMaterial( {
      uniforms: uniforms,
      vertexShader: vertShaderCube,
      fragmentShader: fragShaderCube,
  } );

  var mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );

  renderer.setPixelRatio( window.devicePixelRatio );
  onWindowResize();
  window.addEventListener( 'resize', onWindowResize, false );
  document.onmousemove = function(e){
      //uniforms.u_mouse.value.x = e.pageX
      //uniforms.u_mouse.value.y = e.pageY
  }
}


function onWindowResize( event ) {
  renderer.setSize( window.innerWidth, window.innerHeight );
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}
/*
 ********************************
 *** Animation and Rendering ****
 ********************************
 */

let zoom = 0

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
