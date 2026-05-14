import { Game } from "./game";

const GRAVITY = 0.8;
const JUMP_FORCE = -0.5;
const JUMP_HOLD_FORCE = -0.6;
const JUMP_HOLD_MAX_TIME = 0.3;
const MOVE_SPEED = 0.3;

let screen_width  = window.innerWidth;
let screen_height = window.innerHeight;
let ground_y:     number;
let wall_x_left:  number;
let wall_x_right: number;
let offset_x:     number;

// If space is held slightly longer, the jump is higher
let jump_hold_timer = 0;

export function updateCollisionBounds() {
  screen_width  = window.innerWidth;
  screen_height = window.innerHeight;
  offset_x      = (screen_width - screen_height) / 2;
  ground_y      = screen_height * 0.8;
  wall_x_left   = screen_height * 0.2 + offset_x;
  wall_x_right  = screen_height * 0.8 + offset_x;
}

// Call once on load
updateCollisionBounds();
window.addEventListener("resize", updateCollisionBounds);

export function process_physics(delta: number) {
  let game = Game.ins;
  let player = game.player;

  game.player.sprite.rotation += 1 * delta;

  if (game.pressed_keys["KeyA"]) {
    player.sprite.x -= MOVE_SPEED * screen_height * delta;
  }

  if (game.pressed_keys["KeyD"]) {
    player.sprite.x += MOVE_SPEED * screen_height * delta;
  }

  if (game.pressed_keys["Space"] && player.is_grounded) {
    player.velocity_y = JUMP_FORCE * screen_height;
    jump_hold_timer = JUMP_HOLD_MAX_TIME;
    player.is_grounded = false;
  }

  if (game.pressed_keys["Space"] && !player.is_grounded && jump_hold_timer > 0) {
    player.velocity_y += JUMP_HOLD_FORCE * screen_height * delta;
    jump_hold_timer -= delta;
  }

  player.velocity_y += GRAVITY * screen_height * delta;

  // actual movement
  player.sprite.y += player.velocity_y * delta;

  // Check ground collision
  const feetPos = player.sprite.y + player.sprite.height / 2;
  if (feetPos >= ground_y) {
    player.sprite.y = ground_y - player.sprite.height / 2;
    player.velocity_y = 0;
    player.is_grounded = true;
  }

  // Check wall collision (we ignore whether or not there's a segment there)
  if (player.sprite.x < wall_x_left) {
    wall_collide_handler(true);
  } else if (player.sprite.x > wall_x_right) {
    wall_collide_handler(false);
  }
}

function wall_collide_handler(left: boolean) {
  let player = Game.ins.player;

  const normalizedY = player.sprite.y / screen_height;

  if (left) {
    // Left wall becomes ground: player slides right-to-left
    player.sprite.x = normalizedY * screen_height + offset_x;
    Game.ins.segment_camera.target_roll -= Math.PI / 2;
  } else {
    // Right wall becomes ground: player slides left-to-right (mirrored)
    player.sprite.x = (1 - normalizedY) * screen_height + offset_x;
    Game.ins.segment_camera.target_roll += Math.PI / 2;
  }

  // Clamp inside walls so we don't immediately re-trigger
  player.sprite.x = Math.max(wall_x_left, Math.min(wall_x_right, player.sprite.x));

  player.sprite.y = 1.01 * ground_y;
  player.velocity_y = 0;
  player.is_grounded = true;
}