//language=GLSL
export const vertShaderCube = `
varying vec2 vUv;


void main() {
    vUv = uv;
    gl_Position = vec4( position.x, position.y, position.z , 1.0 );
}`;
