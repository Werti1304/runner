import { Game } from "./game.js";

export function process(delta: number) {
  Game.ins.segment_camera.tick(delta);
  // Game.ins.segment_camera.pitch += delta;
  // Game.ins.segment_camera.roll += delta;
  // Game.ins.segment_camera.yaw += delta;
}
