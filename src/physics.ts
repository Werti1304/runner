import { Game } from "./game";

const GRAVITY = 1000.0;
const JUMP_FORCE = -400;
const JUMP_HOLD_FORCE = -500;
const JUMP_HOLD_MAX_TIME = 0.3;
const MOVE_SPEED = 200;
var ground_y: number;
var wall_x_left: number;
var wall_x_right: number;

// If space is held slightly longer, the jump is higher
let jump_hold_timer = 0;

export function process_physics(delta: number) {
  let game = Game.ins;
  let player = game.player;

  game.player.sprite.rotation += 1 * delta;

  if (game.pressed_keys["KeyA"]) {
    player.sprite.x -= MOVE_SPEED * delta;
  }

  if (game.pressed_keys["KeyD"]) {
    player.sprite.x += MOVE_SPEED * delta;
  }

  if (game.pressed_keys["Space"] && player.is_grounded) {
    player.velocity_y = JUMP_FORCE;
    jump_hold_timer = JUMP_HOLD_MAX_TIME;
    player.is_grounded = false;
  }

  if (game.pressed_keys["Space"] && !player.is_grounded && jump_hold_timer > 0) {
    player.velocity_y += JUMP_HOLD_FORCE * delta;
    jump_hold_timer -= delta;
  }

  player.velocity_y += GRAVITY * delta;

  // actual movement
  player.sprite.y += player.velocity_y * delta;


  const feetPos = player.sprite.y + player.sprite.height / 2;
  if (feetPos >= ground_y) {
    console.log("Test");
    player.sprite.y = ground_y - player.sprite.height / 2;
    player.velocity_y = 0;
    player.is_grounded = true;
  }


}

export function updateCollisionBounds() {
  ground_y = window.innerHeight * 0.8;
  wall_x_left = window.innerWidth * 0.8;
  wall_x_right = window.innerWidth * 0.2;
}