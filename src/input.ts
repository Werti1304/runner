import { Game } from "./game";

export function start_input_listeners() {
    window.addEventListener('keydown', (e) => {
    Game.ins.pressed_keys[e.code] = true;
    console.log("Pressed: ", e.code)
    });

    window.addEventListener('keyup', (e) => {
    Game.ins.pressed_keys[e.code] = false;
    });
}