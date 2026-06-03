import { Game } from "./game.js";
import { toggle_pause } from "./ui/pause.js";

export function start_input_listeners() {
  window.addEventListener("keydown", (e) => {
    Game.ins.pressed_keys[e.code] = true;
    console.log("Pressed: ", e.code);

    if (e.code == "KeyN") {
      Game.ins.debug_show_distance_fields = !Game.ins.debug_show_distance_fields;
    } else if (e.code == "KeyM") {
      Game.ins.debug_show_seed_points = !Game.ins.debug_show_seed_points;
    } else if (e.code == "KeyB") {
      Game.ins.debug_show_noise_overlay = !Game.ins.debug_show_noise_overlay;
    } else if (e.code === "Escape") {
      toggle_pause();
    }
  });

  window.addEventListener("keyup", (e) => {
    Game.ins.pressed_keys[e.code] = false;
  });
}
