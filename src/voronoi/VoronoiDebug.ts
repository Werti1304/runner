import { Sprite } from "pixi.js";
import { Game } from "../game.js";
import { Voronoi } from "./VoronoiFracture.js";

export class VoronoiDebug {
  private sprite: Sprite | null = null;
  private voronoi: Voronoi;
  private visible = false;

  constructor() {
    this.voronoi = new Voronoi();
  }

  public show() {
    this.visible = true;
    this.project();
  }

  public hide() {
    this.visible = false;
    this.removeSprite();
  }

  public reproject() {
    if (this.visible) {
      this.project();
    }
  }

  private project() {
    this.removeSprite();

    const impact = {
      x: Math.random() * 0.6 + 0.2,
      y: Math.random() * 0.6 + 0.2,
      force: 0.4 + Math.random() * 0.55,
    };

    // const texture = this.voronoi.getTexture(30, impact);
    const texture = this.voronoi.getTexture(Math.random() * 100, 30, impact);

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0, 0.5);
    this.sprite.x = 20;
    this.sprite.y = Game.ins.app.screen.height / 2;
    this.sprite.zIndex = 100;

    Game.ins.app.stage.addChild(this.sprite);
  }

  private removeSprite() {
    if (this.sprite) {
      Game.ins.app.stage.removeChild(this.sprite);
      this.sprite.destroy(true);
      this.sprite = null;
    }
  }
}
