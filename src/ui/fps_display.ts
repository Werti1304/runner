import { Game } from "../game.js";
import { Text } from "pixi.js";

export class FpsDisplay {
  private label: Text;

  private frameCount = 0;
  private physicsCount = 0;

  private lastTime = performance.now();

  constructor() {
    this.label = new Text({
      text: "FPS: --",
      style: {
        fill: 0x00ff00,
        fontFamily: "monospace",
        fontSize: 14,
      },
    });

    this.label.anchor.set(1, 0);
    this.label.zIndex = 9999;

    const screen = Game.ins.app.screen;
    this.label.x = screen.width - 12;
    this.label.y = 12;

    Game.ins.app.stage.addChild(this.label);
  }

  public updateRender() {
    this.frameCount++;
  }

  public updatePhysics() {
    this.physicsCount++;
  }

  public tick() {
    const now = performance.now();
    const elapsed = (now - this.lastTime) / 1000;

    if (elapsed >= 1.0) {
      const fps = this.frameCount / elapsed;
      const pps = this.physicsCount / elapsed;

      // this.label.text = `FPS: ${fps.toFixed(1)} | Physics: ${pps.toFixed(1)}`;

      const distFields = Game.ins.debug_show_distance_fields ? "ON" : "OFF";
      const seedPoints = Game.ins.debug_show_seed_points ? "ON" : "OFF";
      const noiseOverlay = Game.ins.debug_show_noise_overlay ? "ON" : "OFF";

      this.label.text = `FPS: ${fps.toFixed(1)} | Physics: ${pps.toFixed(1)}\nDistance fields to cell boundary[N]: ${distFields}\nVoronoi Seed Points[M]: ${seedPoints}\ndNoise-Overlay on[B]: ${noiseOverlay}`;

      this.frameCount = 0;
      this.physicsCount = 0;
      this.lastTime = now;
    }
  }
}
