import { Application, Graphics } from "pixi.js";
import { Player } from "./player";
import { onWindowResize } from "./windows_events";
import { SegmentCamera } from "./platforms/segment_camera";
import { ground_y, screen_height, wall_x_left, wall_x_right } from "./physics";
import { Segment } from "./platforms/segment";

export class Game {
  static #instance: Game;

  app: Application = new Application();
  player: Player = new Player();
  collision_visualization: Graphics = new Graphics();
  segment_camera: SegmentCamera = new SegmentCamera();

  pressed_keys: Record<string, boolean> = {};

  debug_show_distance_fields: boolean = false;
  debug_show_seed_points: boolean = false;
  debug_show_noise_overlay: boolean = false;

  // Every tick, gets set to false
  // In the same tick, segments are set to true if they're in range
  segment_collisions: (Segment | null)[] = [null, null, null];

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
    // const platformY = this.app.screen.height * 0.8;

    // this.collision_visualization.clear();

    // this.collision_visualization
    //   .rect(0, platformY, this.app.screen.width, 4)
    //   .fill(0x00ff00);

    const g = Game.ins.collision_visualization;
    g.clear();

    const segment_width = (wall_x_right - wall_x_left) / 3;

    // Draw ground segments
    for (let s = 0; s <= 2; s++) {
      const seg_start = wall_x_left + s * segment_width;
      const active = Game.ins.segment_collisions[s];

      g.rect(seg_start, ground_y, segment_width, 4).fill(active ? 0x00ff00 : 0xff0000);
    }

    // Draw player collision box
    const player = Game.ins.player;
    const px = player.sprite.x - player.sprite.width / 2;
    const py = player.sprite.y - player.sprite.height / 2;

    g.rect(px, py, player.sprite.width, player.sprite.height).stroke({ color: 0xffff00, width: 2 });

    // Draw wall bounds
    g.rect(wall_x_left - 2, 0, 4, screen_height).fill(0xff8800);
    g.rect(wall_x_right - 2, 0, 4, screen_height).fill(0xff8800);
  }
}
