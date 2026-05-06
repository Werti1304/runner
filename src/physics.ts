import { Game } from "./game";

export function process_physics(delta: number) {
    let game = Game.ins;

    // Just for fun, let's rotate mr rabbit a little.
    // * Delta is 1 if running at 100% performance *
    // * Creates frame-independent transformation *
    game.player.sprite.rotation += 1 * delta;

    if(game.pressed_keys["Space"]) {
        game.player.sprite.rotation += 1 * delta;
    }
}