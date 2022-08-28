//language=GLSL
export const vertShaderCube = `
varying vec2 vUv;
uniform sampler2D texture1;
out vec4 color;
out float height;
varying vec3 vCenter;
uniform float lineWidth; 

in vec3 v_bc;
out vec3 v_barycentric;

void main()
{
    vUv = uv;
    vec3 posTmp = position;
    height = min(texture2D(texture1, uv).r  * 0.05 * (uv.x * 0.5 + 0.5), 1.0);

    if(uv.y == 1.0 || uv.x == 1.0) {
        height = 0.0;
    }

    vec4 pre_color = vec4(1.0 - uv.x, uv.x, 1.0 - uv.y, uv.y);

    color = height * pre_color + (1.0 - height) * vec4(0.01, 0.01, 0.01, uv.y);
    //color = vec4(1.0) * uv.y;

    posTmp.z = height;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(posTmp, 1.0);
    v_barycentric = v_bc; // just pass it on
}`;
