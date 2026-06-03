import { Game } from "./game.js";

export type ProcessFn = (delta: number) => void;
export type PhysicsFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

export class Scheduler {
  private targetRenderFps: number;
  private targetPhysicsFps: number;
  private physicsDt: number;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  private processCallback: ProcessFn | null = null;
  private physicsCallback: PhysicsFn | null = null;
  private renderCallback: RenderFn | null = null;

  private lastPhysicsTime: number = 0;

  constructor(physicsFps: number = 60, renderFps: number = 60) {
    this.targetPhysicsFps = physicsFps;
    this.targetRenderFps = renderFps;
    this.physicsDt = 1 / physicsFps;
  }

  public setPhysicsFps(fps: number) {
    this.targetPhysicsFps = Math.max(5, fps);
    this.physicsDt = 1 / this.targetPhysicsFps;

    if (this.intervalId !== null) {
      this.resetPhysicsLoop();
      this.startPhysicsLoop();
    }
  }

  public setRenderFps(fps: number) {
    this.targetRenderFps = Math.max(5, fps);
    Game.ins.app.ticker.maxFPS = this.targetRenderFps;
  }

  public adjustPhysicsFps(delta: number) {
    this.setPhysicsFps(this.targetPhysicsFps + delta);
  }

  public adjustRenderFps(delta: number) {
    this.setRenderFps(this.targetRenderFps + delta);
  }

  public getTargetPhysicsFps(): number {
    return this.targetPhysicsFps;
  }

  public getTargetRenderFps(): number {
    return this.targetRenderFps;
  }

  start(process: ProcessFn, process_physics: PhysicsFn, render?: RenderFn) {
    if (this.intervalId !== null) return;

    this.processCallback = process;
    this.physicsCallback = process_physics;
    this.renderCallback = render ?? null;

    this.startRenderLoop();
    this.startPhysicsLoop();
  }

  private startRenderLoop() {
    Game.ins.app.ticker.maxFPS = this.targetRenderFps;

    Game.ins.app.ticker.add((ticker) => {
      if (Game.ins.paused) return;

      const delta = ticker.deltaMS / 1000;

      this.processCallback?.(delta);

      const timeSinceLastPhysics = (performance.now() - this.lastPhysicsTime) / 1000;
      const alpha = Math.min(timeSinceLastPhysics / this.physicsDt, 1);
      this.renderCallback?.(alpha);
    });
  }

  private startPhysicsLoop() {
    this.lastPhysicsTime = performance.now();
    const intervalMs = this.physicsDt * 1000;

    this.intervalId = setInterval(() => {
      if (Game.ins.paused) return;

      this.physicsCallback?.(this.physicsDt);
      this.lastPhysicsTime = performance.now();
    }, intervalMs);
  }

  private resetPhysicsLoop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
