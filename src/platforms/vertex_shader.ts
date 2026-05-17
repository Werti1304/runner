export const vertex = /* glsl */ `
#version 300 es
precision mediump float;

in vec3 aPosition;
in vec2 aUV;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec3 vPosition;
out vec2 vUv;

void main() {
    vPosition = aPosition;
    vUv = aUV;

    gl_Position =
        uProjection *
        uView *
        uModel *
        vec4(aPosition, 1.0);
}
`;
