import { Game } from "./game.js";
import { massSpringFactory, toggle_pause, voronoiDebug } from "./ui/pause.js";

export function start_input_listeners() {
  window.addEventListener("keydown", (e) => {
    Game.ins.pressed_keys[e.code] = true;
    console.log("Pressed: ", e.code);

    if (e.code == "KeyN") {
      Game.ins.debug_show_distance_fields = !Game.ins.debug_show_distance_fields;
      Game.ins.fps_display.updateLabel();
    } else if (e.code == "KeyM") {
      Game.ins.debug_show_seed_points = !Game.ins.debug_show_seed_points;
      Game.ins.fps_display.updateLabel();
    } else if (e.code == "KeyB") {
      Game.ins.debug_show_noise_overlay = !Game.ins.debug_show_noise_overlay;
      Game.ins.fps_display.updateLabel();
    } else if (e.code === "KeyV") {
      Game.ins.debug_voronoi_noise_enabled = !Game.ins.debug_voronoi_noise_enabled;
      Game.ins.fps_display.updateLabel();
    } else if (e.code === "KeyX") {
      Game.ins.debug_show_color_coded_edges = !Game.ins.debug_show_color_coded_edges;
      Game.ins.fps_display.updateLabel();
    } else if (e.code === "Escape") {
      toggle_pause();
    } else if (e.code === "Digit1") {
      Game.ins.scheduler.adjustRenderFps(-5);
      Game.ins.fps_display.updateLabel();
    } else if (e.code === "Digit2") {
      Game.ins.scheduler.adjustRenderFps(+5);
      Game.ins.fps_display.updateLabel();
    } else if (e.code === "Digit3") {
      Game.ins.scheduler.adjustPhysicsFps(-5);
      Game.ins.fps_display.updateLabel();
    } else if (e.code === "Digit4") {
      Game.ins.scheduler.adjustPhysicsFps(+5);
      Game.ins.fps_display.updateLabel();
    } else if (e.code === "Digit5") {
      Game.ins.scheduler.adjustMassSpringFps(-5);
      Game.ins.fps_display.updateLabel();
    } else if (e.code === "Digit6") {
      Game.ins.scheduler.adjustMassSpringFps(+5);
      Game.ins.fps_display.updateLabel();
    } else if (e.code === "KeyF") {
      if (Game.ins.paused) {
        voronoiDebug?.reproject();
      }
    } else if (e.code === "KeyG") {
      massSpringFactory?.show();
    }
  });

  window.addEventListener("keyup", (e) => {
    Game.ins.pressed_keys[e.code] = false;
  });
}
