import { AnimatedSprite, Assets, TextureStyle } from "pixi.js";
import { Game } from "./game.js";

export class Player {
  public sprite: AnimatedSprite | undefined;
  velocity_y: number = 0;
  is_grounded: boolean = false;

  constructor() {}

  public drawPlayerSprite() {
    this.sprite!.position.set(Game.ins.app.screen.width / 2, Game.ins.app.screen.height / 2);
    this.sprite!.scale = Game.ins.app.screen.height / 384;
  }

  public async init() {
    TextureStyle.defaultOptions.scaleMode = "nearest"; // Because our sprite is pixel art
    await Assets.load("res/runner_animated.json");
    const spritesheet = Assets.get("res/runner_animated.json");
    console.log(spritesheet);
    const frames = spritesheet.animations["Sprite-0001"];
    console.log(frames);
    this.sprite = new AnimatedSprite(frames);

    this.sprite.animationSpeed = 4 / 60;
    console.log(this.sprite);
    this.sprite.play();
  }
}
