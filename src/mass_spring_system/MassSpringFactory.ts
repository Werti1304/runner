import { Graphics } from "pixi.js";
import { Game } from "../game.js";
import { MassSpringSystem } from "./MassSpringSystem.js";
import { MassSpringControls } from "./MassSpringControls.js";

const NODE_RADIUS = 9;
const SPRING_WIDTH = 2;
const COLOR_PINNED = 0xff0000;
const COLOR_FREE = 0x00ff00;
const COLOR_DRAGGING = 0x0000ff;
const COLOR_SPRING = 0xffffff;

export class MassSpringFactory {
  private gfx!: Graphics;
  private sim!: MassSpringSystem;
  private controls!: MassSpringControls;
  private visible = false;

  public show(): void {
    this.visible = true;
    this.project();
  }
  public hide(): void {
    this.visible = false;
    this.removeGraphics();
  }
  public reproject(): void {
    if (this.visible) this.project();
  }

  private project(): void {
    this.removeGraphics();

    this.sim = new MassSpringSystem();
    this.sim.initialize();

    this.gfx = new Graphics();
    this.gfx.zIndex = 200;
    Game.ins.app.stage.addChild(this.gfx);

    this.controls = new MassSpringControls();
    this.controls.sim = this.sim;
    this.controls.attach();

    this.draw();
  }

  public step(dt: number): void {
    if (!this.visible) return;
    this.sim.step(dt);
    this.draw();
  }

  private removeGraphics(): void {
    this.controls?.detach();
    if (this.gfx) {
      Game.ins.app.stage.removeChild(this.gfx);
      this.gfx.destroy(true);
    }
  }

  private draw(): void {
    const g = this.gfx,
      sim = this.sim;
    g.clear();

    const dragIndex = this.controls?.dragIndex ?? -1;

    for (const { massA, massB, restLength } of sim.springs) {
      const mA = sim.masses[massA],
        mB = sim.masses[massB];
      const len = Math.hypot(mB.position.x - mA.position.x, mB.position.y - mA.position.y);
      const t = Math.min(Math.abs(len - restLength) / (restLength * 0.4), 1);
      // this is only like 70% cursed
      const color = !Game.ins.debug_show_color_coded_edges
        ? COLOR_SPRING
        : len > restLength
          ? Math.round(0xff * t) << 16 // red
          : Math.round(0xff * t); // blue
      g.setStrokeStyle({ color, width: SPRING_WIDTH });

      g.beginPath();
      g.moveTo(mA.position.x, mA.position.y);
      g.lineTo(mB.position.x, mB.position.y);
      g.stroke();
    }

    for (let i = 0; i < sim.masses.length; i++) {
      const m = sim.masses[i],
        isDragging = i === dragIndex;
      const col = isDragging ? COLOR_DRAGGING : m.pinned ? COLOR_PINNED : COLOR_FREE;
      const { x: px, y: py } = m.position;

      g.setStrokeStyle({ color: col, width: isDragging ? 2 : 1.5, alpha: isDragging ? 0.5 : 0.25 });
      g.beginPath();
      g.circle(px, py, NODE_RADIUS + (isDragging ? 9 : 6));
      g.stroke();

      g.setFillStyle({ color: col, alpha: m.pinned && !isDragging ? 0.85 : 1.0 });
      g.beginPath();
      g.circle(px, py, NODE_RADIUS);
      g.fill();

      if (m.pinned && !isDragging) {
        g.setStrokeStyle({ color: 0xffffff, width: 1.5, alpha: 0.6 });
        for (const [dx, dy] of [
          [-5, -5],
          [5, 5],
        ] as const) {
          g.beginPath();
          g.moveTo(px + dx, py + dy);
          g.lineTo(px - dx, py - dy);
          g.stroke();
        }
      }

      // Directions for debugging
      // if (!m.pinned && !isDragging) {
      //   const speed = Math.hypot(m.velocity.x, m.velocity.y);
      //   if (speed > 0.5) {
      //     const tx = px + m.velocity.x * 4,
      //       ty = py + m.velocity.y * 4;
      //     g.setStrokeStyle({ color: 0xffee99, width: 1.5, alpha: 0.65 });
      //     g.beginPath();
      //     g.moveTo(px, py);
      //     g.lineTo(tx, ty);
      //     g.stroke();
      //     g.setFillStyle({ color: 0xffee99, alpha: 0.65 });
      //     g.beginPath();
      //     g.circle(tx, ty, 2.5);
      //     g.fill();
      //   }
      // }
    }
  }
}
