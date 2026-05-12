import { Application } from "pixi.js";
import { Player } from "./player";

export class Game {
  static #instance: Game;

  app: Application = new Application();
  player: Player = new Player();
  pressed_keys: Record<string, boolean> = {};

  private constructor() {}

  public async init() {
    await this.app.init({
      background: "#1099bb",
      resizeTo: window,
      antialias: true,
    });
    document.getElementById("pixi-container")!.appendChild(this.app.canvas);

    await this.player.init();
  }

  public static get ins(): Game {
    if (!Game.#instance) {
      Game.#instance = new Game();
    }
    return Game.#instance;
  }
}
