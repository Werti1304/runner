import { Texture } from "pixi.js";
import { Game } from "../game.js";
import { Voronoi } from "../voronoi/VoronoiFracture.js";
import { Segment } from "./segment.js";
import { SIDES } from "./segment_side.js";
import { BreakableSegment } from "./breakable_segment.js";

const SEGMENT_SPEED_MULTIPLIER = 1.0;
const SPEED_INCREASE_PER_SECOND = 1 / 1 / 60;
const BREAKY_SEGMENTS = 0.03;

export class SegmentManager {
  private segments: Segment[] = [];

  public static speedMultiplier = SEGMENT_SPEED_MULTIPLIER;
  private elapsed = 0;

  private readonly laneOffsets = [-2, 0, 2];
  private readonly segmentCount = 1000;
  private readonly segmentDepth = 2;

  private OctagonTexture: Texture;

  constructor() {
    this.OctagonTexture = Voronoi.getOctagonTexture();
    this.createSegments();
  }

  private createSegments() {
    for (let i = 0; i < this.segmentCount; i++) {
      const z = -i * this.segmentDepth;
      const difficulty = 0.3 + (i / (this.segmentCount - 1)) * 0.65; // from 0.3 to 0.95

      for (const side of SIDES) {
        for (const lane of this.laneOffsets) {
          if (Math.random() > difficulty) {
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
    this.elapsed += delta;
    SegmentManager.speedMultiplier = SEGMENT_SPEED_MULTIPLIER + this.elapsed * SPEED_INCREASE_PER_SECOND;

    Game.ins.segment_collisions = [null, null, null];
    this.updateViewMatrix();

    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];

      if (!seg.valid) {
        this.segments.splice(i, 1);
      } else {
        seg.update(delta * SegmentManager.speedMultiplier);
      }
      // const c = Game.ins.segment_collisions;
      // console.log(`segments: [${c.map((v) => (v ? "█" : "░")).join(" ")}] [${Segment.CurrentSide}]`);
    }
  }
}
