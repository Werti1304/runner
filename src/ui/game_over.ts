import * as PIXI from "pixi.js";
import { Button } from "@pixi/ui";
import { Game } from "../game.js";
import { SegmentManager } from "../platforms/segment_manager.js";

let gameover_container: PIXI.Container | null = null;

export function show_gameover(): void {
  console.log("Game over!");
  Game.ins.paused = true;

  gameover_container = new PIXI.Container();

  const overlay = new PIXI.Graphics();
  overlay.rect(0, 0, Game.ins.app.screen.width, Game.ins.app.screen.height);
  overlay.fill({ color: 0x000000, alpha: 0.7 });
  gameover_container.addChild(overlay);

  const label = new PIXI.Text({
    text: "Game Over",
    style: { fontFamily: "Lucida Console", fontSize: 64, fontWeight: "bold", fill: 0xffffff },
  });
  label.anchor.set(0.5);
  label.position.set(Game.ins.app.screen.width / 2, Game.ins.app.screen.height / 3);
  gameover_container.addChild(label);

  const score = Math.floor(SegmentManager.speedMultiplier * 1000);

  const scoreText = new PIXI.Text({
    text: `Score: ${score}`,
    style: { fontFamily: "Lucida Console", fontSize: 36, fill: 0xffffff },
  });
  scoreText.anchor.set(0.5);
  scoreText.position.set(Game.ins.app.screen.width / 2, Game.ins.app.screen.height / 3 + 90);
  gameover_container.addChild(scoreText);

  const buttonText = new PIXI.Text({
    text: "Restart",
    style: { fontFamily: "Lucida Console", fontSize: 32, fill: 0xaaaaaa },
  });

  const button = new Button(buttonText);
  button.onPress.connect(() => window.location.reload());

  buttonText.anchor.set(0.5);
  buttonText.position.set(Game.ins.app.screen.width / 2, Game.ins.app.screen.height / 3 + 150);
  gameover_container.addChild(buttonText);

  Game.ins.app.stage.addChild(gameover_container);
}
