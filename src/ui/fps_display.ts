import { Game } from "../game";
import { Text } from "pixi.js";

export class FpsDisplay {
    private label: Text;
    private tickCount = 0;
    private accumulator = 0;

    constructor() {
        this.label = new Text({ text: "FPS: --", style: { fill: 0x00ff00, fontFamily: "monospace", fontSize: 14 } });
        this.label.anchor.set(1, 0);
        this.label.zIndex = 9999;

        const screen = Game.ins.app.screen;
        this.label.x = screen.width - 12;
        this.label.y = 12;

        Game.ins.app.stage.addChild(this.label);
    }

    public updateRender(delta: number) {
        this.accumulator += delta;
        if (this.accumulator >= 1.0) {
            // this syntax is weird
            this.label.text = `render: ${this.renderCount} | physics: ${this.tickCount}`; 
            this.tickCount = 0;
            this.renderCount = 0;
            this.accumulator -= 1.0;
        }
        this.renderCount++;
    }

    public updatePhysics() {
        this.tickCount++;
    }

    private renderCount = 0;
}