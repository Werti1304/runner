import { Scheduler } from "./scheduler";
import { process } from "./process";
import { process_physics } from "./physics";
import { Game } from "./game";
import { start_input_listeners } from "./input";
import { start_window_handlers } from "./windows_events";
import { Graphics } from "pixi.js";

(async () => {
  const game = Game.ins;
  await game.init();
  game.player.sprite.anchor.set(0.5)
  game.player.sprite.position.set(game.app.screen.width / 2, game.app.screen.height / 2);
  game.app.stage.addChild(game.player.sprite);

  // Prototype platform
  const platformY = game.app.screen.height * 0.7;
  const platform = new Graphics();
  platform.rect(0, platformY, game.app.screen.width, 4).fill(0x00ff00);
  game.app.stage.addChild(platform);

  const scheduler = new Scheduler(60, 5)
  scheduler.start(process, process_physics);

  start_window_handlers();
  start_input_listeners();
})();