import { compose, Mat4, rotateX, rotateY, rotateZ, translate } from "./matrix_math";

export class SegmentCamera {
  public yaw   = 0;
  public pitch = 0;
  public roll  = 0;

  setRotation(yaw: number, pitch: number, roll: number) {
    this.yaw   = yaw;
    this.pitch = pitch;
    this.roll  = roll;
  }

  buildViewMatrix(): Mat4 {
    return compose(
      translate(0, 0, -8),
      rotateX(-this.pitch),
      rotateY(-this.yaw),
      rotateZ(-this.roll),
    );
  }
}