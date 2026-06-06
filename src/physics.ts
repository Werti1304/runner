import { Game } from "./game.js";
import { COLLISION_Z_END, COLLISION_Z_START, Segment } from "./platforms/segment.js";
import { rotateSide, SIDES } from "./platforms/segment_side.js";
import { Player } from "./player.js";
import { ImpactParams } from "./voronoi/VoronoiFracture.js";

const GRAVITY = 0.8;
const JUMP_FORCE = -0.4;
const JUMP_HOLD_FORCE = -0.4;
const JUMP_HOLD_MAX_TIME = 0.3;
const MOVE_SPEED = 0.3;
const MAX_JUMPS = 2;
let jumps_remaining = 0;

export let screen_width = window.innerWidth;
export let screen_height = window.innerHeight;
export let ground_y: number;
export let wall_x_left: number;
export let wall_x_right: number;
export let offset_x: number;

// If space is held slightly longer, the jump is higher
let jump_hold_timer = 0;
// Once the player let space go while in the air, a double jump can be done
let space_let_go_in_air: boolean = false;

export function updateCollisionBounds() {
  screen_width = window.innerWidth;
  screen_height = window.innerHeight;
  offset_x = (screen_width - screen_height) / 2;
  ground_y = screen_height * 0.8;
  wall_x_left = screen_height * 0.2 + offset_x;
  wall_x_right = screen_height * 0.8 + offset_x;
}

// Call once on load
updateCollisionBounds();
window.addEventListener("resize", updateCollisionBounds);

export function process_physics(delta: number) {
  const game = Game.ins;
  const player = game.player;

  game.drawCollisionVisualization();

  if (game.pressed_keys["KeyA"]) {
    player.sprite!.x -= MOVE_SPEED * screen_height * delta;
  }

  if (game.pressed_keys["KeyD"]) {
    player.sprite!.x += MOVE_SPEED * screen_height * delta;
  }

  if (player.is_grounded) {
    jumps_remaining = MAX_JUMPS;

    if (game.pressed_keys["Space"]) {
      player.velocity_y = JUMP_FORCE * screen_height;
      jump_hold_timer = JUMP_HOLD_MAX_TIME;
      player.is_grounded = false;
      jumps_remaining--;
    }
    space_let_go_in_air = false;
  }

  if (!player.is_grounded && game.pressed_keys["Space"] && space_let_go_in_air && jumps_remaining > 0) {
    player.velocity_y += JUMP_FORCE * screen_height;
    jump_hold_timer = JUMP_HOLD_MAX_TIME;
    jumps_remaining--;
    space_let_go_in_air = false;
  }

  if (!player.is_grounded && !game.pressed_keys["Space"]) {
    space_let_go_in_air = true;
  }

  if (game.pressed_keys["Space"] && !player.is_grounded && jump_hold_timer > 0) {
    player.velocity_y += JUMP_HOLD_FORCE * screen_height * delta;
    jump_hold_timer -= delta;
  }

  player.velocity_y += GRAVITY * screen_height * delta;

  // actual movement
  player.sprite!.y += player.velocity_y * delta;

  // Check ground collision
  if (isPlayerOnGround(player, game.segment_collisions)) {
    player.sprite!.y = ground_y - player.sprite!.height / 2;
    player.velocity_y = 0;
    player.is_grounded = true;
  }

  // Check wall collision (we ignore whether or not there's a segment there)
  if (player.sprite!.x < wall_x_left) {
    wall_collide_handler(true);
  } else if (player.sprite!.x > wall_x_right) {
    wall_collide_handler(false);
  }

  player.drawShadow();
}

function wall_collide_handler(left: boolean) {
  const player = Game.ins.player;

  const normalizedY = player.sprite!.y / screen_height;

  if (left) {
    // Left wall becomes ground: player slides right-to-left
    player.sprite!.x = normalizedY * screen_height + offset_x;
    Game.ins.segment_camera.target_roll -= Math.PI / 2;
    Segment.CurrentSide = rotateSide(Segment.CurrentSide, true);
  } else {
    // Right wall becomes ground: player slides left-to-right (mirrored)
    player.sprite!.x = (1 - normalizedY) * screen_height + offset_x;
    Game.ins.segment_camera.target_roll += Math.PI / 2;
    Segment.CurrentSide = rotateSide(Segment.CurrentSide, false);
  }

  // Clamp inside walls so we don't immediately re-trigger
  player.sprite!.x = Math.max(wall_x_left, Math.min(wall_x_right, player.sprite!.x));

  player.sprite!.y = 1.01 * ground_y;
  player.velocity_y = 0;
  player.is_grounded = true;
}

function isPlayerOnGround(player: Player, segment_collisions: (Segment | null)[]): boolean {
  const feetPos = player.sprite!.y + player.sprite!.height / 2;

  // If in air, no collision possible
  // If under platform for more than half its body, also no collision possible
  if (feetPos < ground_y || feetPos > ground_y + player.sprite!.y / 2) return false;

  const segment_width = (wall_x_right - wall_x_left) / 3;
  const player_left = player.sprite!.x - player.sprite!.width / 2;
  const player_right = player.sprite!.x + player.sprite!.width / 2;

  let on_ground: boolean = false;

  // Check all 3 segments, if player overlaps any active one, has_ground = true
  for (let s = 0; s <= 2; s++) {
    const seg_start = wall_x_left + s * segment_width;
    const seg_end = seg_start + segment_width;

    const overlaps = player_right > seg_start && player_left < seg_end;

    if (overlaps && segment_collisions[s]) {
      on_ground = true;

      const seg_start = wall_x_left + s * segment_width;
      const isFlipped = segment_collisions[s]!.side == SIDES[0] || segment_collisions[s]!.side == SIDES[3];
      // TODO: This didn't work, fix impact point on segment if have time
      const impact_x = isFlipped
        ? 1 - (((player.sprite!.x - seg_start) / segment_width) * 0.8 + 0.1)
        : ((player.sprite!.x - seg_start) / segment_width) * 0.8 + 0.1;
      // Stupid formula to go from current z to a value between 0.1 and 0.9
      const impact_y =
        ((segment_collisions[s]!.z - COLLISION_Z_START) / (COLLISION_Z_END - COLLISION_Z_START)) * 0.8 + 0.1;

      // AHHHH
      const force = Math.max(0.5, Math.min((player.velocity_y / (GRAVITY * screen_height) - 0.4) * 3, 0.9)); // 0.5 to 0.9

      const params: ImpactParams = {
        x: impact_x,
        y: impact_y,
        force,
      };
      console.info(force);

      segment_collisions[s]?.onCollide(params);
    }
  }

  return on_ground;
}
