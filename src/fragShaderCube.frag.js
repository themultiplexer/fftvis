//language=GLSL
export const fragShaderCube = `
    precision mediump float;

    uniform vec2 u_resolution;

    float circleShape(vec2 position, float radius){
        return step(radius, length(position));
    }

    void main(){
        vec2 position = gl_FragCoord.xy / u_resolution;
        float circle = circleShape(position, 0.3);
        vec3 color = vec3(circle);
        gl_FragColor = vec4(color, 1.0);
    } 
`;
