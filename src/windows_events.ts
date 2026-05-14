import { Game } from "./game";
import { updateGroundY } from "./physics";
import { recalculateProjectionMatrix } from "./platforms/segment";

export function startWindowHandlers() {
  // Ensures everything stays where it should be relative to the screen
  Game.ins.app.renderer.on("resize", onWindowResize);
}

export function onWindowResize() {
  let game = Game.ins;
  game.player.sprite.position.set(game.app.screen.width / 2, game.app.screen.height / 2);
  recalculateProjectionMatrix();
  game.drawCollisionVisualization();
  game.player.drawPlayerSprite();
  updateGroundY();
}