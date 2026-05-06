import { Scheduler } from "./scheduler";
import { process } from "./process";
import { process_physics } from "./physics";
import { Game } from "./game";
import { start_input_listeners } from "./input";
import { start_window_handlers } from "./windows_events";

(async () => {
  const game = Game.ins;
  await game.init();
  game.player.sprite.anchor.set(0.5)
  game.player.sprite.position.set(game.app.screen.width / 2, game.app.screen.height / 2);
  game.app.stage.addChild(game.player.sprite);

  const scheduler = new Scheduler(30, 5)
  scheduler.start(process, process_physics);

  start_window_handlers();
  start_input_listeners();
})();