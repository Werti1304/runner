import { AnimatedSprite, Assets, Graphics, TextureStyle } from "pixi.js";
import { Game } from "./game.js";
import { ground_y } from "./physics.js";

export class Player {
  public sprite: AnimatedSprite | undefined;
  public shadow: Graphics | undefined;
  velocity_y: number = 0;
  is_grounded: boolean = false;

  constructor() {}

  public drawPlayerSprite() {
    this.sprite!.position.set(Game.ins.app.screen.width / 2, Game.ins.app.screen.height / 2);
    this.sprite!.scale = Game.ins.app.screen.height / 384;
    this.drawShadow();
  }

  public drawShadow() {
    const shadow = this.shadow!;
    const sprite = this.sprite!;

    const distToGround = Math.max(0, ground_y - sprite.y + sprite.height / 2);
    const maxDist = Game.ins.app.screen.height * 0.4;

    const t = 1 - Math.min(distToGround / maxDist, 1);
    const shadowWidth = sprite.width * 0.5 * (0.4 + 0.6 * t);
    shadow.clear();
    shadow.moveTo(-shadowWidth, 0);
    shadow.lineTo(shadowWidth, 0);
    shadow.lineTo(0, -sprite.height * 0.15);
    shadow.closePath();
    shadow.fill({ color: 0x000000, alpha: 0.15 + 0.35 * t });

    shadow.x = sprite.x;
    shadow.y = ground_y + 5;
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

    this.shadow = new Graphics();
    this.shadow.zIndex = 3;
    Game.ins.app.stage.addChild(this.shadow);
  }
}
