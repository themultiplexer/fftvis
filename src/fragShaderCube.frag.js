//language=GLSL
export const fragShaderCube = `
    uniform sampler2D texture1;
    in vec4 color;
    varying vec2 vUv;

    void main() {
        gl_FragColor = color;
        //gl_FragColor = vec4(vUv, 0.0, 1.0   );
    }
`;
