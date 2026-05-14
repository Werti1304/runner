import { Application, Graphics } from "pixi.js";
import { Player } from "./player";
import { onWindowResize } from "./windows_events";
import { SegmentCamera } from "./platforms/segment_camera";

export class Game {
  static #instance: Game;

  app: Application = new Application();
  player: Player = new Player();
  collision_visualization: Graphics = new Graphics();
  segment_camera: SegmentCamera = new SegmentCamera();
  
  pressed_keys: Record<string, boolean> = {};

  // Every tick, gets set to false
  // In the same tick, segments are set to true if they're in range
  segment_collisions: boolean[] = [false, false, false];  

  private constructor() {}

  public async init() {
    await this.app.init({
      background: "#1099bb",
      resizeTo: window,
      antialias: true,
    });
    document.getElementById("pixi-container")!.appendChild(this.app.canvas);

    await this.player.init();

    // Initializes all screen space dependent vars
    onWindowResize();
  }

  public static get ins(): Game {
    if (!Game.#instance) {
      Game.#instance = new Game();
    }
    return Game.#instance;
  }

  public drawCollisionVisualization() {
    const platformY = this.app.screen.height * 0.8;

    this.collision_visualization.clear();

    this.collision_visualization
      .rect(0, platformY, this.app.screen.width, 4)
      .fill(0x00ff00);
  }
}
