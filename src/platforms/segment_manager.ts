import { Game } from "../game";
import { Segment } from "./segment";
import { SIDES } from "./segment_side";

const SEGMENT_SPEED_MULTIPLIER = 2;
const LEVEL_DIFFICULTY = 0.8; // 0 - 1

export class SegmentManager {
  private segments: Segment[] = [];

  private readonly laneOffsets = [-2, 0, 2];
  private readonly segmentCount = 100;
  private readonly segmentDepth = 2;

  constructor() {
    this.createSegments();
  }

  private createSegments() {
    for (let i = 0; i < this.segmentCount; i++) {
      const z = -i * this.segmentDepth;

      for (const side of SIDES) {
        for (const lane of this.laneOffsets) {
          if (Math.random() > LEVEL_DIFFICULTY) {
            this.segments.push(new Segment(z, side, lane));
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
    Game.ins.segment_collisions = [ false, false, false ];
    this.updateViewMatrix();

    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];

      if (!seg.valid) {
        this.segments.splice(i, 1);
      } else {
        seg.update(delta * SEGMENT_SPEED_MULTIPLIER);
      }
    }
    const c = Game.ins.segment_collisions;
    console.log(`segments: [${c.map(v => v ? "█" : "░").join(" ")}] [${Segment.CurrentSide}]`);
  }
}
