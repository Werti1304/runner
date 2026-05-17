import { Texture } from "pixi.js";
import { Game } from "../game.js";
import { Voronoi } from "../voronoi/voronoi_diagram.js";
import { Segment } from "./segment.js";
import { SIDES } from "./segment_side.js";
import { BreakableSegment } from "./breakable_segment.js";

const SEGMENT_SPEED_MULTIPLIER = 0.1;
const LEVEL_DIFFICULTY = 0.5; // 0 - 1
const BREAKY_SEGMENTS = 0.1;

export class SegmentManager {
  private segments: Segment[] = [];

  private readonly laneOffsets = [-2, 0, 2];
  private readonly segmentCount = 100;
  private readonly segmentDepth = 2;

  private OctagonTexture: Texture;

  constructor() {
    this.OctagonTexture = Voronoi.getOctagonTexture();
    this.createSegments();
  }

  private createSegments() {
    for (let i = 0; i < this.segmentCount; i++) {
      const z = -i * this.segmentDepth;

      for (const side of SIDES) {
        for (const lane of this.laneOffsets) {
          if (Math.random() > LEVEL_DIFFICULTY) {
            if (Math.random() < BREAKY_SEGMENTS) {
              // let texture = new Voronoi().getTexture();
              // console.info(this.OctagonTexture);
              this.segments.push(new BreakableSegment(z, side, lane, this.OctagonTexture));

              // const sprite = new Sprite(this.OctagonTexture);
              // Game.ins.app.stage.addChild(sprite);
            } else {
              this.segments.push(new Segment(z, side, lane));
            }
          }
        }
      }
    }
  }

  // Every tick, update view matrix once (for performance)
  private updateViewMatrix() {
    Segment.ViewMatrix = Game.ins.segment_camera.buildViewMatrix();
  }

  public tick(delta: number) {
    Game.ins.segment_collisions = [null, null, null];
    this.updateViewMatrix();

    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];

      if (!seg.valid) {
        this.segments.splice(i, 1);
      } else {
        seg.update(delta * SEGMENT_SPEED_MULTIPLIER);
      }
    }
    // const c = Game.ins.segment_collisions;
    // console.log(`segments: [${c.map((v) => (v ? "█" : "░")).join(" ")}] [${Segment.CurrentSide}]`);
  }
}
