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

      const targetRender = Game.ins.scheduler.getTargetRenderFps();
      const targetPhysics = Game.ins.scheduler.getTargetPhysicsFps();

      const distFields = Game.ins.debug_show_distance_fields ? "ON" : "OFF";
      const seedPoints = Game.ins.debug_show_seed_points ? "ON" : "OFF";
      const noiseOverlay = Game.ins.debug_show_noise_overlay ? "ON" : "OFF";
      const noise = Game.ins.debug_voronoi_noise_enabled ? "ON" : "OFF";
      const colorCodedEdges = Game.ins.debug_show_color_coded_edges ? "ON" : "OFF";

      this.label.text = [
        `FPS: ${fps.toFixed(1)} (target: ${targetRender})[1/2]`,
        `Physics: ${pps.toFixed(1)} (target: ${targetPhysics})[3/4]`,
        `Distance fields to cell boundary[N]: ${distFields}`,
        `Voronoi Seed Points[M]: ${seedPoints}`,
        `Noise-Overlay on[B]: ${noiseOverlay}`,
        `Noise on[V]: ${noise}`,
        `MSS Color coded edges[X]: ${colorCodedEdges}`,
      ].join("\n");

      this.frameCount = 0;
      this.physicsCount = 0;
      this.lastTime = now;
    }
  }
}
