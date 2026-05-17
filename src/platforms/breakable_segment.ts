import { Mesh, Geometry, Shader, Texture, Ticker } from "pixi.js";
import { vertex } from "./vertex_shader";
import { ImpactParams, Voronoi } from "../voronoi/voronoi_diagram";
import { PROJECTION, Segment } from "./segment";
import { compose, rotateX, rotateY, scaleMat, SHARED_GEOMETRY, translate } from "./matrix_math";
import { Game } from "../game";

export const cellFragment = /* glsl */ `
#version 300 es
precision mediump float;

uniform sampler2D uTexture;
uniform float uAlpha;

in vec2 vUv;
out vec4 outColor;

void main() {
    outColor = texture(uTexture, vUv) * vec4(1.0, 1.0, 1.0, uAlpha);
}
`;

const W = 800;
const H = 800;

const BREAK_DELAY = 1000;
const FADE_START = 1300;
const FADE_DURATION = 1500;

// plane is 3x3 world units of the full 800x800 voronoi resolution.. or something? idk it works lol
const CANVAS_TO_WORLD_X = 3.0 / W;
const CANVAS_TO_WORLD_Y = 3.0 / H;

const FRAGMENTS_TIME_MODIFIER = 0.8;

interface CellFragment {
  mesh: Mesh<Geometry, Shader>;
  // origin on face
  originX: number;
  originY: number;
  // accumulated drift from the origin
  driftX: number;
  driftY: number;
  offsetZ: number;
  vx: number;
  vy: number;
  vz: number;
  scaleX: number;
  scaleY: number;
  va: number;
  angle: number;
  age: number;
}

export class BreakableSegment extends Segment {
  private collided = false;
  private elapsed = 0;
  private broken = false;
  private cellFragments: CellFragment[] = [];
  private voronoiTexture: Texture | null = null;

  private snapX = 0;
  private snapY = 0;
  private snapZ = 0;
  private snapFaceRotX = 0;
  private snapFaceRotY = 0;

  private readonly boundTick = (t: Ticker) => this.onTick(t);

  override onCollide(params: ImpactParams): void {
    if (this.collided) return;
    this.collided = true;

    this.snapX = this.x;
    this.snapY = this.y;
    this.snapZ = this.z;
    this.snapFaceRotX = this.faceRotationX;
    this.snapFaceRotY = this.faceRotationY;

    const voronoi = new Voronoi();
    const { texture, cells } = voronoi.drawForMesh(30, params);

    this.voronoiTexture = texture;

    // Show the fracture pattern on the static panel before the break fires
    const resources = this.mesh?.shader?.resources;
    if (resources) resources.uTexture = texture.source;

    this.cellFragments = cells.map((cell) => this.buildCellMesh(cell));
    for (const f of this.cellFragments) f.mesh.visible = false;

    this.elapsed = 0;
    this.broken = false;
    Game.ins.app.ticker.add(this.boundTick);
  }

  private buildCellMesh(cell: {
    cx: number;
    cy: number;
    cw: number;
    ch: number;
    cellTexture: Texture;
    vx: number;
    vy: number;
    va: number;
  }): CellFragment {
    const shader = Shader.from({
      gl: { vertex, fragment: cellFragment },
      resources: {
        uniforms: {
          uModel: { value: new Float32Array(16), type: "mat4x4<f32>" },
          uView: { value: new Float32Array(16), type: "mat4x4<f32>" },
          uProjection: { value: new Float32Array(16), type: "mat4x4<f32>" },
          uAlpha: { value: 1.0, type: "f32" },
        },
        uTexture: cell.cellTexture.source,
      },
    });

    const mesh = new Mesh<Geometry, Shader>({ geometry: SHARED_GEOMETRY, shader });
    Game.ins.app.stage.addChild(mesh);

    return {
      mesh,
      originX: (cell.cx - W / 3) * CANVAS_TO_WORLD_X,
      originY: -(cell.cy - H / 3) * CANVAS_TO_WORLD_Y,
      driftX: 0, // accumulates each frame
      driftY: 0,
      offsetZ: 0,
      vx: cell.vx * CANVAS_TO_WORLD_X,
      vy: -cell.vy * CANVAS_TO_WORLD_Y,
      vz: 0,
      scaleX: (cell.cw / W) * 3.0,
      scaleY: (cell.ch / H) * 3.0,
      va: cell.va,
      angle: 0,
      age: -1,
    };
  }

  private onTick(ticker: Ticker): void {
    const dt = ticker.deltaMS;
    this.elapsed += dt;

    if (!this.broken && this.elapsed >= BREAK_DELAY) {
      this.broken = true;
      this.remove();
      for (const f of this.cellFragments) {
        f.mesh.visible = true;
        f.age = 0;
      }
    }

    if (!this.broken) return;

    let anyAlive = false;

    for (const f of this.cellFragments) {
      if (f.age < 0) continue;
      const dt_adj = dt * FRAGMENTS_TIME_MODIFIER;
      f.age += dt_adj;

      f.driftX += f.vx * dt_adj;
      f.driftY += f.vy * dt_adj;
      f.offsetZ += f.vz * dt_adj;
      // f.angle += f.va * dt_adj;

      const model = compose(
        translate(this.snapX, this.snapY, this.snapZ + f.offsetZ),
        rotateX(this.snapFaceRotX),
        rotateY(this.snapFaceRotY),
        // rotateZ(f.angle),
        translate(f.originX + f.driftX, f.originY + f.driftY, 0),
        scaleMat(f.scaleX, f.scaleY, 1.0),
      );

      let alpha = 1.0;
      if (f.age > FADE_START) {
        alpha = 1 - Math.min((f.age - FADE_START) / FADE_DURATION, 1);
      }

      const u = f.mesh.shader?.resources.uniforms.uniforms;
      u.uModel = model;
      u.uView = Segment.ViewMatrix;
      u.uProjection = PROJECTION;
      u.uAlpha = alpha;

      if (alpha <= 0) {
        f.mesh.destroy();
        f.age = -2;
        continue;
      }

      anyAlive = true;
    }

    if (!anyAlive) {
      Game.ins.app.ticker.remove(this.boundTick);
      for (const f of this.cellFragments) {
        f.mesh.shader?.resources.uTexture?.destroy?.();
      }
      this.voronoiTexture?.destroy();
      this.voronoiTexture = null;
    }
  }
}
