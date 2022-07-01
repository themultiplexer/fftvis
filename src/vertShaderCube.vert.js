//language=GLSL
export const vertShaderCube = `
varying vec2 vUv;
uniform sampler2D texture1;
out vec4 color;

void main() {
    vUv = uv;
    vec3 posTmp = position;
    vec4 height = texture2D(texture1, uv);
    color = (2.0 - uv.x) * height;
    posTmp.z = ((height.x + height.y + height.z) / 3.0) * 0.1;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(posTmp, 1.0);
}`;
