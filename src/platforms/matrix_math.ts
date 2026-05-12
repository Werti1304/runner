// prettier-ignore

import { Buffer, BufferUsage, Geometry } from "pixi.js";

// Matrix calc stuff, inspired by https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
export type Mat4 = number[];

export const IDENTITY = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
]);

export function perspective(
    fov: number,
    aspect: number,
    near: number,
    far: number,
): Mat4 {
    const f = 1 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, (2 * far * near) * nf, 0,
    ];
}

export function translate(x: number, y: number, z: number): Mat4 {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1,
    ];
}

export function rotateZ(a: number): Mat4 {
    const c = Math.cos(a);
    const s = Math.sin(a);

    return [
         c, s, 0, 0,
        -s, c, 0, 0,
         0, 0, 1, 0,
         0, 0, 0, 1,
    ];
}

export function scaleMat(x: number, y: number, z: number): Mat4 {
    return [
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1,
    ];
}

export function multiplyMatrices(a: Mat4, b: Mat4): Mat4 {
    const out = new Array(16).fill(0);
    for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 4; row++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                sum += a[row + k * 4] * b[k + col * 4];
            }
            out[row + col * 4] = sum;
        }
    }
    return out;
}

export function compose(...matrices: Mat4[]): Mat4 {
    return matrices.reduce(multiplyMatrices);
}

export const positions = new Float32Array([
    // front
    -1, -1,  1,
     1, -1,  1,
     1,  1,  1,
    -1,  1,  1,

    // back
    -1, -1, -1,
     1, -1, -1,
     1,  1, -1,
    -1,  1, -1,
]);

export const indices = new Uint16Array([
    0, 1, 2,  0, 2, 3,
    5, 4, 7,  5, 7, 6,
    3, 2, 6,  3, 6, 7,
    4, 5, 1,  4, 1, 0,
    1, 5, 6,  1, 6, 2,
    4, 0, 3,  4, 3, 7,
]);

export const SHARED_GEOMETRY = new Geometry({
    attributes: {
        aPosition: {
            buffer: new Buffer({
                data: positions,
                usage: BufferUsage.VERTEX,
            }),

            format: "float32x3",
            stride: 12,
            offset: 0,
        },
    },

    indexBuffer: new Buffer({
        data: indices,
        usage: BufferUsage.INDEX,
    }),
});