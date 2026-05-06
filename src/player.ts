import { Assets, Sprite } from "pixi.js";

export class Player {
    public sprite: Sprite = new Sprite();
    velocity_y: number = 0;
    is_grounded: boolean = false;

    constructor() { }

    public async init() {
        const texture = await Assets.load("/assets/bunny.png");
        this.sprite = new Sprite(texture)
    }
}

