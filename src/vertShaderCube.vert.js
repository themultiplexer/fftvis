//language=GLSL
export const vertShaderCube = `
varying vec2 vUv;
uniform sampler2D texture1;
out vec4 color;

void main() {
    vUv = uv;
    vec3 posTmp = position;
    float height = min(texture2D(texture1, uv).r  * 0.05 * (uv.x * 0.5 + 0.5), 1.0);

    if(uv.y == 1.0) {
        height = 0.0;
    }

    vec3 pre_color = vec3(1.0 - uv.x, uv.x, 1.0 - uv.y) * uv.y;

    vec3 gradient = height * pre_color + (1.0 - height) * vec3(0.0, 0.0, 0.0);

    color = vec4(gradient, 1.0);
    posTmp.z = height;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(posTmp, 1.0);
}`;
