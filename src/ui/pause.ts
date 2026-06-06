import * as PIXI from "pixi.js";
import { Game } from "../game.js";
import { VoronoiDebug } from "../voronoi/VoronoiDebug.js";
import { MassSpringFactory } from "../mass_spring_system/MassSpringFactory.js";

let pause_container: PIXI.Container | null = null;
export let voronoiDebug: VoronoiDebug | null = null;
export let massSpringDebug: MassSpringFactory | null = null;

export function toggle_pause(): void {
  if (Game.ins.paused) {
    unpause();
  } else {
    pause();
  }
}

function pause(): void {
  if (Game.ins.paused) return;

  Game.ins.paused = true;
  Game.ins.player.sprite!.stop();

  pause_container = new PIXI.Container();

  voronoiDebug = new VoronoiDebug();
  voronoiDebug.show();

  massSpringDebug = new MassSpringFactory();
  massSpringDebug.show();

  // Semi-transparent rect to make the game look darker
  const overlay = new PIXI.Graphics();
  overlay.rect(0, 0, Game.ins.app.screen.width, Game.ins.app.screen.height);
  overlay.fill({ color: 0x000000, alpha: 0.55 });
  pause_container.addChild(overlay);

  const label = new PIXI.Text({
    text: "PAUSED",
    style: {
      fontFamily: "Lucida Console",
      fontSize: 64,
      fontWeight: "bold",
      fill: 0xffffff,
    },
  });

  label.zIndex = 9999;
  label.anchor.set(0.5);
  label.x = Game.ins.app.screen.width / 2;
  label.y = Game.ins.app.screen.height / 4;
  pause_container.addChild(label);

  // Hint text
  const hint = new PIXI.Text({
    text: "Press ESC to continue c:",
    style: {
      fontFamily: "Lucida Console",
      fontSize: 32,
      fill: 0xffffff,
    },
  });

  hint.anchor.set(0.5);
  hint.x = Game.ins.app.screen.width / 2;
  hint.y = Game.ins.app.screen.height / 4 + 60;
  hint.zIndex = 9999;
  pause_container.addChild(hint);

  Game.ins.app.stage.addChild(pause_container);
}

function unpause(): void {
  if (!Game.ins.paused) return;

  Game.ins.paused = false;
  Game.ins.player.sprite!.play();

  if (pause_container) {
    Game.ins.app.stage.removeChild(pause_container);
    pause_container.destroy({ children: true });
    pause_container = null;

    voronoiDebug?.hide();
    voronoiDebug = null;

    massSpringDebug?.hide();
    massSpringDebug = null;
  }
}
