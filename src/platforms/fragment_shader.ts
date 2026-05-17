export const fragment = /* glsl */ `
#version 300 es
precision mediump float;

uniform vec3 uColor;
uniform sampler2D uTexture;

in vec2 vUv;
out vec4 outColor;

void main() {
    outColor = texture(uTexture, vUv) * vec4(uColor, 1.0);
}
`;
