import { compose, Mat4, rotateX, rotateY, rotateZ, translate } from "./matrix_math.js";

const CAMERA_ROLL_SPEED = 20;

export class SegmentCamera {
  public yaw = 0;
  public pitch = 0;
  public roll = 0;

  public target_roll = 0;

  setRotation(yaw: number, pitch: number, roll: number) {
    this.yaw = yaw;
    this.pitch = pitch;
    this.roll = roll;
  }

  tick(delta: number) {
    // Simple lerp to target roll
    this.roll += (this.target_roll - this.roll) * Math.min(delta * CAMERA_ROLL_SPEED, 1);
  }

  buildViewMatrix(): Mat4 {
    return compose(translate(0, 0, -8), rotateX(-this.pitch), rotateY(-this.yaw), rotateZ(-this.roll));
  }
}
