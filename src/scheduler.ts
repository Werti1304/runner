import { Game } from "./game.js";

export type Fn = (delta: number) => void;
export type RenderFn = (alpha: number) => void;

export class Scheduler {
  private targetRenderFps: number;
  private targetPhysicsFps: number;
  private targetMassSpringFps: number;
  private physicsDt: number;

  private massSpringInterval: number | null = null;

  private intervalId: ReturnType<typeof setInterval> | null = null;

  private processCallback: Fn | null = null;
  private physicsCallback: Fn | null = null;
  private massSpringCallback: Fn | null = null;
  private renderCallback: RenderFn | null = null;

  private lastPhysicsTime: number = 0;

  constructor(physicsFps: number = 60, renderFps: number = 60, massSpringFps: number = 60) {
    this.targetPhysicsFps = physicsFps;
    this.targetRenderFps = renderFps;
    this.targetMassSpringFps = massSpringFps;
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

  public adjustMassSpringFps(delta: number): void {
    this.targetMassSpringFps = Math.max(1, this.targetMassSpringFps + delta);
    if (this.massSpringCallback !== null) {
      this.startMassSpring(this.massSpringCallback);
    }
  }

  public getTargetMassSpringFps(): number {
    return this.targetMassSpringFps;
  }

  public getTargetPhysicsFps(): number {
    return this.targetPhysicsFps;
  }

  public getTargetRenderFps(): number {
    return this.targetRenderFps;
  }

  start(process: Fn, process_physics: Fn, process_mass_spring: Fn, render?: RenderFn) {
    if (this.intervalId !== null) return;

    this.processCallback = process;
    this.physicsCallback = process_physics;
    this.massSpringCallback = process_mass_spring;
    this.renderCallback = render ?? null;

    this.startRenderLoop();
    this.startPhysicsLoop();
    this.startMassSpring(process_mass_spring);
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

  private startMassSpring(fn: (dt: number) => void): void {
    if (this.massSpringInterval !== null) clearInterval(this.massSpringInterval);
    const interval = 1000 / this.targetMassSpringFps;
    let last = performance.now();
    this.massSpringInterval = setInterval(() => {
      const now = performance.now();
      if (!Game.ins.paused) return; // if game isn't paused, dont simulate mass spring system
      fn((now - last) / 1000);
      last = now;
    }, interval);
  }

  private resetPhysicsLoop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
