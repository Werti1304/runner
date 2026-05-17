import { Assets, Sprite } from "pixi.js";
import { Game } from "./game";

export class Player {
  public sprite: Sprite = new Sprite();
  velocity_y: number = 0;
  is_grounded: boolean = false;

  constructor() {}

  public drawPlayerSprite() {
    this.sprite.position.set(Game.ins.app.screen.width / 2, Game.ins.app.screen.height / 2);
    this.sprite.scale = Game.ins.app.screen.height / 1024;
  }

  public async init() {
    const texture = await Assets.load("/res/runner.png");
    this.sprite = new Sprite(texture);
  }
}
