//language=GLSL
export const fragShaderCube = `
    uniform sampler2D texture1;
    in vec4 color;
    varying vec2 vUv;
    varying vec3 vCenter;
    uniform float lineWidth; 

    float edgeFactorTri() { 
    vec3 d = fwidth( vCenter.xyz ); 
    vec3 a3 = smoothstep( vec3( 0.0 ), d * lineWidth, vCenter.xyz ); 
    return min( min( a3.x, a3.y ), a3.z );
} 

    void main() {
        gl_FragColor = color;
        //gl_FragColor = vec4(vUv, 0.0, 1.0   );
    }
`;
