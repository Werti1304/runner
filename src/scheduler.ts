import { Game } from "./game.js";

export type ProcessFn = (delta: number) => void;
export type PhysicsFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

export class Scheduler {
  private fixedDt: number;
  private maxSteps: number;

  private accumulator = 0;
  private lastTime = 0;
  private running = false;

  constructor(fps: number = 30, maxSteps: number = 5) {
    this.fixedDt = 1 / fps;
    this.maxSteps = maxSteps;
  }

  start(process: ProcessFn, process_physics: PhysicsFn, render?: RenderFn) {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();

    const loop = (currentTime: number) => {
      if (!this.running) return;

      let deltaSeconds = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      if (!Game.ins.paused) {
        // avoid huge jumps (tab switch, lag spike)
        deltaSeconds = Math.min(deltaSeconds, 0.25);

        // run variable update
        process(deltaSeconds);

        // accumulate time for fixed updates
        this.accumulator += deltaSeconds;

        let steps = 0;

        while (this.accumulator >= this.fixedDt && steps < this.maxSteps) {
          process_physics(this.fixedDt);
          this.accumulator -= this.fixedDt;
          steps++;
        }

        // interpolation factor
        const alpha = this.accumulator / this.fixedDt;

        if (render) {
          render(alpha);
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }
}
