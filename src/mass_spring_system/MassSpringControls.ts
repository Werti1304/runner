// TODO: Adjustable controls for Animation update rate / step size h
// Move the steps into physics_process

import { Button, Slider } from "@pixi/ui";
import { Container, Graphics, Text, TextStyle, Ticker } from "pixi.js";
import { Game } from "../game.js";
import { MassSpringSystem } from "./MassSpringSystem.js";

const DEFAULT_STIFFNESS = 140;
const DEFAULT_DAMPING = 6;
const DEFAULT_NODE_MASS = 1;
const DRAG_RADIUS = 20;

const PANEL_W = 220;
const PANEL_H = 200;
const PANEL_PAD = 10;
const FONT_SIZE = 14;
const TRACK_W = PANEL_W - PANEL_PAD * 2;
const TRACK_H = 8;
const THUMB_R = 8;

const STYLE = new TextStyle({ fontFamily: "monospace", fontSize: FONT_SIZE, fill: 0xffffff });

const makeTrack = () => new Graphics().rect(0, 0, TRACK_W, TRACK_H).fill(0x555555) as Graphics;
const makeFill = () => new Graphics().rect(0, 0, TRACK_W, TRACK_H).fill(0xffffff) as Graphics;
const makeThumb = () => new Graphics().circle(0, 0, THUMB_R).fill(0xffffff) as Graphics;

interface DragState {
  massIndex: number;
  wasOriginallyPinned: boolean;
}

export interface SimParams {
  stiffness: number;
  damping: number;
  nodeMass: number;
}
export type ParamChangeCallback = (p: SimParams) => void;

export class MassSpringControls {
  public sim!: MassSpringSystem;
  public params: SimParams = { stiffness: DEFAULT_STIFFNESS, damping: DEFAULT_DAMPING, nodeMass: DEFAULT_NODE_MASS };

  private _createMode = false;
  get createMode() {
    return this._createMode;
  }

  private drag: DragState | null = null;
  get dragIndex(): number {
    return this.drag?.massIndex ?? -1;
  }

  private cursorPos = { x: 0, y: 0 };

  private panel!: Container;
  private modeText!: Text;

  public onParamChange: ParamChangeCallback | null = null;
  public onClear: (() => void) | null = null;

  public attach(): void {
    this.buildPanel();
    const stage = Game.ins.app.stage;
    stage.eventMode = "static";
    stage.hitArea = Game.ins.app.screen;
    stage.on("pointerdown", this.onPointerDown);
    stage.on("pointermove", this.onPointerMove);
    stage.on("pointerup", this.onPointerUp);
    stage.on("pointerupoutside", this.onPointerUp);
    Game.ins.app.canvas.addEventListener("contextmenu", this.onContextMenu);
    window.addEventListener("keydown", this.onKeyDown);
    Game.ins.app.ticker.add(this.onTick);
  }

  public detach(): void {
    const stage = Game.ins.app.stage;
    stage.off("pointerdown", this.onPointerDown);
    stage.off("pointermove", this.onPointerMove);
    stage.off("pointerup", this.onPointerUp);
    stage.off("pointerupoutside", this.onPointerUp);
    Game.ins.app.canvas.removeEventListener("contextmenu", this.onContextMenu);
    window.removeEventListener("keydown", this.onKeyDown);
    Game.ins.app.ticker.remove(this.onTick);
    this.cancelDrag();
    this.destroyPanel();
  }

  private readonly onTick = (_t: Ticker): void => {
    const s = Game.ins.app.screen;
    this.panel.x = s.width - PANEL_W - PANEL_PAD;
    this.panel.y = 200 + PANEL_PAD;
    if (this.drag) {
      const m = this.sim.masses[this.drag.massIndex];
      m.position.x = this.cursorPos.x;
      m.position.y = this.cursorPos.y;
      m.velocity.x = 0;
      m.velocity.y = 0;
    }
  };

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== "KeyC") return;
    this._createMode = !this._createMode;
    this.cancelDrag();
    this.modeText.text = this._createMode ? "Mode: CREATE [C]" : "Mode: SELECT [C]";
  };

  private readonly onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private readonly onPointerDown = (e: any): void => {
    const { x, y } = e.global as { x: number; y: number };
    if (this.inPanel(x, y)) return;
    const btn = e.button as number;
    if (this._createMode) {
      if (btn === 0) this.placeMass(x, y, false);
      if (btn === 2) this.placeMass(x, y, true);
    } else {
      if (btn === 0) {
        const hit = this.pickMass(x, y);
        if (hit === -1) return;
        const m = this.sim.masses[hit];
        this.drag = { massIndex: hit, wasOriginallyPinned: m.pinned };
        m.pinned = false;
        m.velocity.x = 0;
        m.velocity.y = 0;
      }
      if (btn === 2) {
        const hit = this.pickMass(x, y);
        if (hit !== -1) this.deleteMass(hit);
      }
    }
  };

  private readonly onPointerMove = (e: any): void => {
    const { x, y } = e.global as { x: number; y: number };
    this.cursorPos.x = x;
    this.cursorPos.y = y;
  };

  private readonly onPointerUp = (_e: any): void => {
    if (!this.drag) return;
    this.sim.masses[this.drag.massIndex].pinned = this.drag.wasOriginallyPinned;
    this.drag = null;
  };

  private placeMass(x: number, y: number, pinned: boolean): void {
    const n = this.sim.masses.length;
    const idx = this.sim.buildMass(x, y, this.params.nodeMass, pinned);
    for (let i = 0; i < n; i++) {
      const o = this.sim.masses[i];
      const d = Math.max(Math.hypot(o.position.x - x, o.position.y - y), 1);
      this.sim.buildSpring(idx, i, this.params.stiffness, this.params.damping, d);
    }
    this.sim.initialize();
  }

  private deleteMass(idx: number): void {
    if (this.drag?.massIndex === idx) this.drag = null;
    this.sim.springs = this.sim.springs.filter((s) => s.massA !== idx && s.massB !== idx);
    for (const s of this.sim.springs) {
      if (s.massA > idx) s.massA--;
      if (s.massB > idx) s.massB--;
    }
    if (this.drag && this.drag.massIndex > idx) this.drag.massIndex--;
    this.sim.masses.splice(idx, 1);
    this.sim.initialize();
  }

  private cancelDrag(): void {
    if (!this.drag) return;
    this.sim.masses[this.drag.massIndex].pinned = this.drag.wasOriginallyPinned;
    this.drag = null;
  }

  private pickMass(x: number, y: number): number {
    let best = -1,
      bestD = DRAG_RADIUS;
    for (let i = 0; i < this.sim.masses.length; i++) {
      const m = this.sim.masses[i];
      const d = Math.hypot(m.position.x - x, m.position.y - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  private inPanel(x: number, y: number): boolean {
    return x >= this.panel.x && x <= this.panel.x + PANEL_W && y >= this.panel.y && y <= this.panel.y + PANEL_H;
  }

  private notify() {
    this.onParamChange?.(this.params);
  }

  private buildPanel(): void {
    this.panel = new Container();
    this.panel.zIndex = 300;
    Game.ins.app.stage.addChild(this.panel);
    this.panel.addChild(new Graphics().rect(0, 0, PANEL_W, PANEL_H).fill({ color: 0x000000, alpha: 0.6 }) as Graphics);

    let y = PANEL_PAD;

    this.modeText = new Text({ text: "Mode: SELECT [C]", style: STYLE });
    this.modeText.x = PANEL_PAD;
    this.modeText.y = y;
    this.panel.addChild(this.modeText);
    y += FONT_SIZE + 6;

    const sliders: [string, number, number, number, number, (v: number) => void][] = [
      [
        "Stiffness",
        1,
        500,
        DEFAULT_STIFFNESS,
        1,
        (v) => {
          this.params.stiffness = v;
          this.notify();
        },
      ],
      [
        "Damping",
        0,
        30,
        DEFAULT_DAMPING,
        0.1,
        (v) => {
          this.params.damping = v;
          this.notify();
        },
      ],
      [
        "Node Mass",
        0.1,
        10,
        DEFAULT_NODE_MASS,
        0.1,
        (v) => {
          this.params.nodeMass = v;
          this.notify();
        },
      ],
    ];
    for (const [label, min, max, value, step, onChange] of sliders) {
      y = this.addSlider(label, min, max, value, step, y, onChange);
    }

    y += 4;
    const clearBtn = new Button(
      (() => {
        const g = new Graphics().rect(0, 0, TRACK_W, FONT_SIZE + 8).fill(0x333333) as Graphics;
        const t = new Text({ text: "CLEAR ALL", style: STYLE });
        t.x = (TRACK_W - t.width) / 2;
        t.y = 4;
        g.addChild(t);
        return g;
      })(),
    );
    clearBtn.view!.x = PANEL_PAD;
    clearBtn.view!.y = y;
    clearBtn.onPress.connect(() => {
      this.cancelDrag();
      this.sim.masses = [];
      this.sim.springs = [];
      this.onClear?.();
    });
    this.panel.addChild(clearBtn.view!);
  }

  private addSlider(
    label: string,
    min: number,
    max: number,
    value: number,
    step: number,
    y: number,
    onChange: (v: number) => void,
  ): number {
    const dec = step < 1 ? 1 : 0;

    const labelText = new Text({ text: label, style: STYLE });
    labelText.x = PANEL_PAD;
    labelText.y = y;
    this.panel.addChild(labelText);

    const valText = new Text({ text: value.toFixed(dec), style: STYLE });
    valText.x = PANEL_W - PANEL_PAD - valText.width;
    valText.y = y;
    this.panel.addChild(valText);

    y += FONT_SIZE + 4;

    const slider = new Slider({ bg: makeTrack(), fill: makeFill(), slider: makeThumb(), min, max, value, step });
    slider.width = TRACK_W;
    slider.x = PANEL_PAD;
    slider.y = y;
    slider.onUpdate.connect((v: number) => {
      valText.text = v.toFixed(dec);
      valText.x = PANEL_W - PANEL_PAD - valText.width;
      onChange(v);
    });
    this.panel.addChild(slider);

    return y + THUMB_R * 2 + 8;
  }

  private destroyPanel(): void {
    Game.ins.app.stage.removeChild(this.panel);
    this.panel.destroy({ children: true });
  }
}
