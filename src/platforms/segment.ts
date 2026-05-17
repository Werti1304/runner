import { Mesh, Geometry, Shader, Texture } from "pixi.js";
import { vertex } from "./vertex_shader.js";
import { fragment } from "./fragment_shader.js";
import {
  compose,
  IDENTITY,
  Mat4,
  perspective,
  rotateX,
  rotateY,
  scaleMat,
  SHARED_GEOMETRY,
  translate,
} from "./matrix_math.js";
import { Game } from "../game.js";
import { Side, SIDE_CONFIG, SIDES } from "./segment_side.js";
import { ImpactParams } from "../voronoi/VoronoiFracture.js";

export let PROJECTION = perspective(Math.PI / 3, window.innerWidth / window.innerHeight, 0.1, 200);

export function recalculateProjectionMatrix() {
  PROJECTION = perspective(Math.PI / 3, window.innerWidth / window.innerHeight, 0.1, 200);
}

// At what Z indices we say that the player has collision
export const COLLISION_Z_START = -2;
export const COLLISION_Z_END = 0;

export class Segment {
  protected mesh: Mesh<Geometry, Shader>;

  public z: number;
  protected x: number;
  protected y: number;
  protected lane: number;
  protected side: Side;
  protected faceRotationX: number; // replaces single `rotation` field
  protected faceRotationY: number;

  public valid: boolean;

  static ViewMatrix: Mat4 = IDENTITY;
  static CurrentSide: Side = SIDES[1];

  constructor(z: number, side: Side, lane: number, texture: Texture | null = null) {
    this.z = z;
    this.lane = lane;
    this.side = side;

    const cfg = SIDE_CONFIG[side];

    // Store face orientation from config
    this.faceRotationX = cfg.rotateX;
    this.faceRotationY = cfg.rotateY;

    // Horizontal walls spread across X
    if (cfg.horizontal) {
      this.x = cfg.x + lane;
      this.y = cfg.y;
    }
    // Vertical walls spread across Y
    else {
      this.x = cfg.x;
      this.y = cfg.y + lane;
    }

    // const resources: Record<string, any> = {
    //   uniforms: {
    //     uModel: { value: IDENTITY, type: "mat4x4<f32>" },
    //     uView: { value: Segment.ViewMatrix, type: "mat4x4<f32>" },
    //     uProjection: { value: IDENTITY, type: "mat4x4<f32>" },
    //     uColor: { value: new Float32Array([1.0, 0.0, 0.0, 1.0]), type: "vec4<f32>" },
    //   },
    //   uTexture: texture?.source ?? Texture.WHITE.source,
    // };

    // const shader = Shader.from({ gl: { vertex, fragment }, resources });

    const shader = Shader.from({
      gl: {
        vertex,
        fragment,
      },
      resources: {
        uniforms: {
          // TODO: Remove / make truly constant if not needed later on
          uModel: {
            value: IDENTITY,
            type: "mat4x4<f32>",
          },

          uView: {
            value: Segment.ViewMatrix,
            type: "mat4x4<f32>",
          },

          uProjection: {
            value: IDENTITY,
            type: "mat4x4<f32>",
          },

          uColor: {
            value: new Float32Array(cfg.color),
            type: "vec3<f32>",
          },

          // uColor: {
          //   value: new Float32Array([Math.random(), Math.random(), Math.random()]),
          //   type: "vec3<f32>",
          // },
        },
        uTexture: texture?.source ?? Texture.WHITE.source,
      },
    });

    this.mesh = new Mesh<Geometry, Shader>({
      geometry: SHARED_GEOMETRY,
      shader,
    });

    Game.ins.app.stage.addChild(this.mesh);

    this.valid = true;
  }

  /* eslint-disable */
  public onCollide(_: ImpactParams) {
    return;
  }

  update(delta: number) {
    if (!this.valid) return;

    this.z += delta * 3;

    if (this.z > 10) {
      // make them repeat:
      // this.z -= SEGMENT_COUNT * SEGMENT_DEPTH;
      this.remove();
      return;
    }

    if (Segment.CurrentSide == this.side && this.z >= COLLISION_Z_START && this.z - 0.5 <= COLLISION_Z_END) {
      // If left or top the lanes are swapped
      // (This is totally not confusing or anything)
      if (this.side == SIDES[0] || this.side == SIDES[2]) {
        switch (this.lane) {
          case 2:
            Game.ins.segment_collisions[0] = this;
            break;
          case 0:
            Game.ins.segment_collisions[1] = this;
            break;
          case -2:
            Game.ins.segment_collisions[2] = this;
            break;
          default:
            console.error("Invalid lane on segment");
        }
      } else {
        switch (this.lane) {
          case -2:
            Game.ins.segment_collisions[0] = this;
            break;
          case 0:
            Game.ins.segment_collisions[1] = this;
            break;
          case 2:
            Game.ins.segment_collisions[2] = this;
            break;
          default:
            console.error("Invalid lane on segment");
        }
      }
    }

    const model = compose(
      translate(this.x, this.y, this.z),
      rotateX(this.faceRotationX),
      rotateY(this.faceRotationY),
      scaleMat(2.0, 2.0, 1.0),
    );

    const u = this.mesh?.shader?.resources.uniforms.uniforms;
    u.uModel = model;
    u.uView = Segment.ViewMatrix;
    u.uProjection = PROJECTION;
  }

  remove() {
    this.valid = false;
    Game.ins.app.stage.removeChild(this.mesh);
    this.mesh.destroy();
  }
}
