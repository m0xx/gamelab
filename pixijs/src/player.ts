import * as PIXI from 'pixi.js'
import {EventEmitter} from "eventemitter3";
import {TextureManager} from "./utils";
import {Controller} from "./inputs";

export enum PlayerSide {
    LEFT,
    RIGHT
}

export enum PlayerState {
    IDLE
}

export enum Direction {
    LEFT,
    RIGHT
}

export class Player extends EventEmitter {
    app: any;
    textureManager: TextureManager;
    playerSide: PlayerSide;
    state: PlayerState;
    direction: Direction;
    sprite: any;
    boundaries: {x: number, y: number};
    isDead: boolean;
    controller: Controller;
    constructor(app, textureManager: TextureManager, playerSide: PlayerSide, controller: Controller) {
        super();

        this.app = app;
        this.textureManager = textureManager;
        this.playerSide = playerSide;
        this.state = PlayerState.IDLE;
        this.boundaries = {x: app.screen.width, y: app.screen.height}
        this.isDead = false;

        this.sprite = new PIXI.extras.AnimatedSprite(textureManager.getTextures('IDLE'));
        this.sprite.animationSpeed = 0.2;
        this.sprite.play();
        this.sprite.y = 350
        this.direction = 1;

        if(playerSide === PlayerSide.RIGHT) {
            this.sprite.scale.x = -0.2;
            this.sprite.scale.y = 0.2;
            this.sprite.x = this.boundaries.x
        }
        else {
            this.sprite.scale.set(0.2);
            this.sprite.x = 0;
        }

    }
    setX(x: number) {
        this.sprite.x = x;
    }
}
