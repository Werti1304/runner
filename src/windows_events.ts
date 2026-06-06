import { Game } from "./game.js";
import { updateCollisionBounds } from "./physics.js";
import { recalculateProjectionMatrix } from "./platforms/segment.js";

export function startWindowHandlers() {
  // Ensures everything stays where it should be relative to the screen
  Game.ins.app.renderer.on("resize", onWindowResize);
}

export function onWindowResize() {
  const game = Game.ins;
  console.log(game.player.sprite);
  game.player.sprite!.position.set(game.app.screen.width / 2, game.app.screen.height / 2);
  recalculateProjectionMatrix();
  game.drawCollisionVisualization();
  game.player.drawPlayerSprite();
  updateCollisionBounds();
}
