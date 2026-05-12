import { Mesh, Geometry, Shader } from "pixi.js";
import { vertex } from "./vertex_shader";
import { fragment } from "./fragment_shader";
import { compose, IDENTITY, perspective, rotateZ, scaleMat, SHARED_GEOMETRY, translate } from "./matrix_math";
import { Game } from "../game";
import { Side, SIDE_CONFIG } from "./segment_side";

const VIEW = translate(0, 0, -8);
var PROJECTION = perspective(Math.PI / 3, window.innerWidth / window.innerHeight, 0.1, 200);

export function recalculateProjectionMatrix() {
  PROJECTION = perspective(Math.PI / 3, window.innerWidth / window.innerHeight, 0.1, 200);
}

export class Segment {
  mesh: Mesh<Geometry, Shader>;

  z: number;
  x: number;
  y: number;
  rotation: number;

  valid: boolean;

  constructor(z: number, side: Side, lane: number) {
    this.z = z;

    const cfg = SIDE_CONFIG[side];

    this.rotation = cfg.rotation;

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
            value: IDENTITY,
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
        },
      },
    });

    this.mesh = new Mesh<Geometry, Shader>({
      geometry: SHARED_GEOMETRY,
      shader,
    });

    Game.ins.app.stage.addChild(this.mesh);

    this.valid = true;
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

    const model = compose(
      translate(this.x, this.y, this.z),

      rotateZ(this.rotation),

      // thinner wall strips
      scaleMat(1.0, 0, 3),
    );

    const u = this.mesh?.shader?.resources.uniforms.uniforms;
    u.uModel = model;
    u.uView = VIEW;
    u.uProjection = PROJECTION;
  }

  remove() {
    this.valid = false;
    Game.ins.app.stage.removeChild(this.mesh);
    this.mesh.destroy();
  }
}
