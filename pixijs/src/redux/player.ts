import * as PIXI from 'pixi.js'
import {EventEmitter} from "eventemitter3";
import {TextureManager} from "./../utils";
import {subscribeTo} from "./state";

export enum PlayerSide {
    LEFT,
    RIGHT
}

export enum PlayerState {
    IDLE,
    ATTACK,
    RUN,
    DIE,
    DEAD
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
    constructor(app, textureManager: TextureManager, playerSide: PlayerSide) {
        super();

        this.app = app;
        this.textureManager = textureManager;
        this.playerSide = playerSide;
        this.state = PlayerState.IDLE;

        this.sprite = new PIXI.extras.AnimatedSprite(textureManager.getTextures('IDLE'));
        this.sprite.anchor.set(0.5);
        this.sprite.animationSpeed = 0.2;
        this.sprite.play();
        this.direction = Direction.RIGHT;

        if(playerSide === PlayerSide.RIGHT) {
            this.sprite.scale.x = -0.2;
            this.sprite.scale.y = 0.2;
        }
        else {
            this.sprite.scale.set(0.2);
        }

        const side = playerSide === PlayerSide.LEFT ? 'left' : 'right' ;
        let currentAnimation = null;
        subscribeTo(`gameState.${side}`, (state) => {
            const {loop, animationSpeed, animationName, visible, x, y} = state.gameState[side];

            if(currentAnimation !== animationName) {
                this.sprite.textures = this.textureManager.getTextures(animationName);
                this.sprite.gotoAndPlay(0);

                currentAnimation = animationName;
            }


            this.sprite.visible = visible;
            this.sprite.loop = loop;
            this.sprite.x = x + this.sprite.width / 2;
            this.sprite.y = y + this.sprite.height / 2;
            this.sprite.animationSpeed = animationSpeed;

            window[side] = this
        })
    }
    getNbFrame() {
        return this.sprite.textures.length;
    }
    currentFrame() {
        return this.sprite.currentFrame;
    }
    getAttackDistance(frame) {
        if(frame < 6) {
            return -1;
        }

        return 140;
    }
    getHitBox(): {left: number, top: number, width: number, height: number} {
        const {left, top, width: outerWidth} = this.getRect();

        const offsetLeft = 27;
        const width = 120;
        const height = this.sprite.height;

        let innerLeft;
        if(this.playerSide === PlayerSide.LEFT) {
            innerLeft = left + offsetLeft;
        }
        else {
            innerLeft = left + outerWidth - offsetLeft - width
        }

        return {
            left: innerLeft,
            top,
            width,
            height
        }
    }
    getRect(): {top: number, left: number, width: number, height: number} {
        const {width, height} = this.sprite;

        return {
            top: this.sprite.y - this.sprite.height / 2,
            left: this.sprite.x - this.sprite.width / 2,
            width,
            height
        }
    }
}
