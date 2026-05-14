import { Scheduler } from "./scheduler";
import { process } from "./process";
import { process_physics } from "./physics";
import { Game } from "./game";
import { start_input_listeners } from "./input";
import { startWindowHandlers } from "./windows_events";
import { FpsDisplay } from "./ui/fps_display";
import { SegmentManager } from "./platforms/segment_manager";

(async () => {
  const game = Game.ins;
  await game.init();

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
