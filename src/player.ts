import { Assets, Sprite } from "pixi.js";

export class Player {
    public sprite: Sprite = new Sprite();

    constructor() { }

    public async init() {
        const texture = await Assets.load("/assets/bunny.png");
        this.sprite = new Sprite(texture)
    }
}

