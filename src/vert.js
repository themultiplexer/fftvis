//language=GLSL
export const vertShaderCube = `
varying vec2 vUv;
uniform sampler2D texture1;
out vec4 color;
attribute vec3 center;
varying vec3 vCenter;
uniform float lineWidth; 

void main() {
    vCenter = center;
    vUv = uv;
    vec3 posTmp = position;
    float height = min(texture2D(texture1, uv).r  * 0.05 * (uv.x * 0.5 + 0.5), 1.0);

    if(uv.y == 1.0) {
        height = 0.0;
    }

    vec4 pre_color = vec4(1.0 - uv.x, uv.x, 1.0 - uv.y, uv.y);

    color = height * pre_color + (1.0 - height) * vec4(0.01, 0.01, 0.01, uv.y);

    posTmp.z = height;// - cos(2.0 * abs(uv.x - 0.5));
    //posTmp.x = 2.0 * (uv.x - 0.5);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(posTmp, 1.0);
}`;
