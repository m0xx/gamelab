import * as PIXI from 'pixi.js'
import {EventEmitter} from "eventemitter3";
import {TextureManager} from "./utils";

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

        app.ticker.add((delta) => {
            if(this.state === PlayerState.ATTACK) {
                if(this.sprite.currentFrame >= 6) {
                    this.emit('attack')
                    // onAttack(playerSide, this.sprite)
                }
                if(this.sprite.currentFrame === 7) {
                    this.idle();
                }
            }
            if(this.state === PlayerState.DIE) {
                if(this.sprite.currentFrame === 6) {
                    this.state = PlayerState.DEAD;
                    this.sprite.gotoAndStop(6);
                }

                this.sprite.y += 8
            }

            // controller.on('up:press', () => {
            //     if(this.state !== PlayerState.ATTACK) {
            //         this.attack();
            //     }
            // })
            //
            // controller.on('right:press', () => {
            //     this.direction = 1;
            //     this.run();
            // })
            // controller.on('right:release', () => {
            //     if(this.state === PlayerState.RUN && this.direction === Direction.RIGHT) {
            //         this.idle();
            //     }
            // })
            //
            // controller.on('left:press', () => {
            //     this.direction = -1;
            //     this.run();
            // })
            //
            // controller.on('left:release', () => {
            //     if(this.state === PlayerState.RUN && this.direction === Direction.LEFT) {
            //         this.idle();
            //     }
            // })
        })
    }
    idle() {
        if(this.isDead()) return;
        this.state = PlayerState.IDLE;
        this.sprite.textures = this.textureManager.getTextures('IDLE')
        this.sprite.gotoAndPlay(0);
    }
    attack() {
        if(this.isDead()) return;
        this.state = PlayerState.ATTACK;
        this.sprite.textures = this.textureManager.getTextures('ATTACK')
        this.sprite.gotoAndPlay(0);
    }
    run() {
        if(this.isDead()) return;
        this.state = PlayerState.RUN;
        this.sprite.animationSpeed = 0.4;
        this.sprite.textures = this.textureManager.getTextures('RUN')
        this.sprite.gotoAndPlay(0);
    }
    kill() {
        this.state = PlayerState.DIE;
        this.sprite.textures = this.textureManager.getTextures('DIE')
        this.sprite.animationSpeed = 0.4;
        this.sprite.gotoAndPlay(0);
    }
    getWeaponReachX(): number {
        return 260;
    }
    getHitOffsetX(): number {
        return 125;
    }
    isDead() {
        return this.state === PlayerState.DIE || this.state === PlayerState.DEAD;
    }
    setY(y: number) {
        this.sprite.y = y;
    }
    setX(x: number) {
        this.sprite.x = x;
    }
    getX(): number {
        return this.sprite.x;
    }
    getPosition(): {left: number, right: number} {
        const {left, width} = this.getRect();

        return this.playerSide === PlayerSide.LEFT
         ? {left, right: left + width}
         : {left: left - width, right: left}
    }
    getHitBox(): {left: number, right: number} {
        const hitbox = {x: 27, width: 132};
        const {left, right} = this.getPosition();

        return this.playerSide === PlayerSide.LEFT
            ? {left: left + hitbox.x, right: left + hitbox.x + hitbox.width}
            : {left: right - hitbox.x - hitbox.width, right: right - hitbox.x}
    }
    getRect(): {top: number, left: number, width: number, height: number} {
        const {width, height} = this.sprite;

        return {
            top: this.sprite.y,
            left: this.sprite.x,
            width,
            height
        }
    }
    getRectangle() {
        return this.sprite.getBounds(true);
    }
}
