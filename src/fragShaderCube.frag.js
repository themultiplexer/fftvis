//language=GLSL
export const fragShaderCube = `
    uniform sampler2D texture1;
    in vec4 color;
    varying vec2 vUv;

    void main() {
        vec4 data = texture2D( texture1, vUv );
        gl_FragColor = color;
    }
`;
