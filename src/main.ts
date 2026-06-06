import { Scheduler } from "./scheduler.js";
import { process } from "./process.js";
import { process_physics } from "./physics.js";
import { Game } from "./game.js";
import { start_input_listeners } from "./input.js";
import { startWindowHandlers } from "./windows_events.js";
import { FpsDisplay } from "./ui/debug_ui.js";
import { SegmentManager } from "./platforms/segment_manager.js";

(async () => {
  const game = Game.ins;
  await game.init();

  // Player
  game.player.sprite!.anchor.set(0.5);
  game.player.sprite!.zIndex = 4;
  game.app.stage.addChild(game.player.sprite!);

  // Prototype platform
  game.collision_visualization.zIndex = 5;

  const fpsDisplay = new FpsDisplay();
  const segment_manager = new SegmentManager();
  const scheduler = new Scheduler(60, 60);

  // expose on Game so input.ts and fps_display.ts can reach it
  Game.ins.scheduler = scheduler;

  setInterval(() => fpsDisplay.tick(), 1000);

  scheduler.start(
    (delta) => {
      process(delta);
      fpsDisplay.updateRender();
    },
    (dt) => {
      process_physics(dt);
      fpsDisplay.updatePhysics();
      segment_manager.tick(dt);
    },
  );

  startWindowHandlers();
  start_input_listeners();
})();
