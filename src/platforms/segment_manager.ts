import { Segment } from "./segment";
import { SIDES } from "./segment_side";

export class SegmentManager {
  private segments: Segment[] = [];

  private readonly laneOffsets = [-2, 0, 2];
  private readonly segmentCount = 40;
  private readonly segmentDepth = 3;

  constructor() {
    this.createSegments();
  }

  private createSegments() {
    for (let i = 0; i < this.segmentCount; i++) {
      const z = -i * this.segmentDepth + 4;

      for (const side of SIDES) {
        for (const lane of this.laneOffsets) {
          if (Math.random() > 0.7) {
            this.segments.push(new Segment(z, side, lane));
          }
        }
      }
    }
  }

  public tick(delta: number) {
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];

      if (!seg.valid) {
        this.segments.splice(i, 1);
      } else {
        seg.update(delta);
      }
    }
  }
}
