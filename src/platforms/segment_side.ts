// JS enum? idk
export type Side = "top" | "bottom" | "left" | "right";

export const SIDES: Side[] = ["top", "bottom", "left", "right"];

export type SideConfig = {
  x: number;
  y: number;
  rotation: number;
  horizontal: boolean;
  color: [number, number, number];
};

// Properties of the different sides
export const SIDE_CONFIG: Record<Side, SideConfig> = {
  top: {
    x: 0,
    y: 3,
    rotation: 0,
    horizontal: true,
    color: [245 / 255, 73 / 255, 39 / 255],
  },
  bottom: {
    x: 0,
    y: -3,
    rotation: 0,
    horizontal: true,
    color: [131 / 255, 187 / 255, 68 / 255],
  },
  left: {
    x: -3,
    y: 0,
    rotation: Math.PI / 2,
    horizontal: false,
    color: [68 / 255, 187 / 255, 184 / 255],
  },
  right: {
    x: 3,
    y: 0,
    rotation: Math.PI / 2,
    horizontal: false,
    color: [124 / 255, 68 / 255, 187 / 255],
  },
};
