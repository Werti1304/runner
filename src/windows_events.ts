import { Game } from "./game";

export function start_window_handlers() {
    let game = Game.ins;
    // Ensures everything stays where it should be relative to the screen
    game.app.renderer.on("resize", () => {
        game.player.sprite.position.set(
            game.app.screen.width / 2,
            game.app.screen.height / 2
        );
    });
}