//language=GLSL
export const vertShaderCube = `
varying vec2 vUv;
uniform sampler2D texture1;
out vec4 color;

void main() {
    vUv = uv;
    vec3 posTmp = position;
    float height = texture2D(texture1, uv).r;

    vec3 gradient = height * vec3(uv.x, 1.0 - uv.x, 1.0);

    color = vec4(gradient, 1.0);
    posTmp.z = height  * 0.4;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(posTmp, 1.0);
}`;
