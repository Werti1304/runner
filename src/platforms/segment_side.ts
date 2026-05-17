// JS enum? idk
export type Side = "top" | "bottom" | "left" | "right";

export const SIDES: Side[] = ["top", "bottom", "left", "right"];

// I want to hereby apologize to whoever may lay his eyes on this
const SIDE_ORDERED: Side[] = ["top", "right", "bottom", "left"];
export function rotateSide(side: Side, clockwise: boolean): Side {
  const i = SIDE_ORDERED.indexOf(side);
  const offset = clockwise ? 1 : -1;
  return SIDE_ORDERED[(i + offset + 4) % 4];
}

export type SideConfig = {
  x: number;
  y: number;
  rotation: number;
  rotateX: number; // face-orientation rotation around X axis
  rotateY: number; // face-orientation rotation around Y axis
  horizontal: boolean;
  color: [number, number, number];
};

export const SIDE_CONFIG: Record<Side, SideConfig> = {
  top: {
    x: 0,
    y: 3,
    rotation: 0,
    rotateX: Math.PI / 2, // quad faces downward into the tunnel
    rotateY: 0,
    horizontal: true,
    color: [245 / 255, 73 / 255, 39 / 255],
  },
  bottom: {
    x: 0,
    y: -3,
    rotation: 0,
    rotateX: -Math.PI / 2, // quad faces upward into the tunnel
    rotateY: 0,
    horizontal: true,
    color: [131 / 255, 187 / 255, 68 / 255],
  },
  left: {
    x: -3,
    y: 0,
    rotation: 0,
    rotateX: 0,
    rotateY: Math.PI / 2, // quad faces rightward into the tunnel
    horizontal: false,
    color: [68 / 255, 187 / 255, 184 / 255],
  },
  right: {
    x: 3,
    y: 0,
    rotation: 0,
    rotateX: 0,
    rotateY: -Math.PI / 2, // quad faces leftward into the tunnel
    horizontal: false,
    color: [124 / 255, 68 / 255, 187 / 255],
  },
};
