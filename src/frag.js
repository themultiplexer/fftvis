//language=GLSL
export const fragShaderCube = `
    uniform sampler2D texture1;
    in vec4 color;
    in float height;
    varying vec2 vUv;
    uniform bool lines; 
    varying vec3 v_barycentric;
    uniform float lineWidth;
    
    void main()
    {
        float f_closest_edge = min(v_barycentric.x, min(v_barycentric.y, v_barycentric.z)); // see to which edge this pixel is the closest
        float f_width = fwidth(f_closest_edge); // calculate derivative (divide lineWidth by this to have the line width constant in screen-space)
        float f_alpha = smoothstep(lineWidth, lineWidth + f_width, f_closest_edge); // calculate alpha
        if(lines){
            //gl_FragColor = vec4(vec3(1.0), 1.0 - f_alpha);
            //gl_FragColor = vec4(color.rgb, 1.0 - f_alpha);
            gl_FragColor = vec4(vec3(0.9), 1.0) * (1.0 - f_alpha) * height  * color.a + color;
        } else {
            gl_FragColor = color;
        }
    }
`;
