import { Scheduler } from "./scheduler.js";
import { process } from "./process.js";
import { process_physics } from "./physics.js";
import { Game } from "./game.js";
import { start_input_listeners } from "./input.js";
import { startWindowHandlers } from "./windows_events.js";
import { FpsDisplay } from "./ui/fps_display.js";
import { SegmentManager } from "./platforms/segment_manager.js";

(async () => {
  const game = Game.ins;
  await game.init();

  // const voronoi = new Voronoi();
  // voronoi.draw(30, { x: 0.5, y: 0.5, force: 0.5 }, "noised-distance");

  // Player
  game.player.sprite.anchor.set(0.5);
  game.player.sprite.zIndex = 2;
  game.app.stage.addChild(game.player.sprite);

  // Prototype platform
  game.collision_visualization.zIndex = 5;
  game.app.stage.addChild(game.collision_visualization);

  const fpsDisplay = new FpsDisplay();
  const segment_manager = new SegmentManager();
  const scheduler = new Scheduler(60, 5);
  scheduler.start(
    (delta) => {
      fpsDisplay.updateRender();
      process(delta);
    },
    (dt) => {
      fpsDisplay.updatePhysics();
      fpsDisplay.tick();
      segment_manager.tick(dt);
      process_physics(dt);
    },
  );

  startWindowHandlers();
  start_input_listeners();
})();
