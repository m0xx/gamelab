import * as PIXI from 'pixi.js'
import Animation from './animation'

function createAnimation(name) {
    const textures = []
    for(let i=0; i <= 6; i++) {
        textures.push(PIXI.Texture.fromFrame(`_${name}_00${i}.png`));
    }

    const anim = new PIXI.extras.AnimatedSprite(textures);
    anim.scale.set(0.4);
    anim.animationSpeed = 0.4;

    return anim;
}

function keyboard(value) {
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        console.log('Down', event.key)
        if (event.key === key.value) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };

    //The `upHandler`
    key.upHandler = event => {
        if (event.key === key.value) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
            event.preventDefault();
        }
    };

    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);

    window.addEventListener(
        "keydown", downListener, false
    );
    window.addEventListener(
        "keyup", upListener, false
    );

    // Detach event listeners
    key.unsubscribe = () => {
        window.removeEventListener("keydown", downListener);
        window.removeEventListener("keyup", upListener);
    };

    return key;
}

class Fighter {
    constructor(app, textureManager, playerSide) {
        this.app = app;

        this.boundaries = {x: app.screen.width, y: app.screen.height}
        this.textureManager = textureManager;
        this.state = 'IDLE';
        this.sprite = new PIXI.extras.AnimatedSprite(textureManager.getTextures('IDLE'));
        this.sprite.animationSpeed = 0.2;
        this.sprite.play();
        this.direction = 1;
        this.sprite.y = 200;

        const isRightPlayer = playerSide === 'right';

        if(isRightPlayer) {
            this.sprite.scale.x = -0.2;
            this.sprite.scale.y = 0.2;
            this.sprite.x = this.boundaries.x;
        }
        else {
            this.sprite.scale.set(0.2);
            this.sprite.x = 0;
        }

        app.ticker.add((delta) => {
            if(this.state === 'ATTACK') {
                if(this.sprite.currentFrame === 7) {
                    this.idle();
                }
            }
            if(this.state === 'DIE') {
                if(this.sprite.currentFrame === 6) {
                    this.dead();
                }

                this.sprite.y += 5
            }
            if(this.state === 'RUN') {
                console.log(this.boundaries, this.sprite.x)

                if(this.direction === 1) {
                    const boundX = isRightPlayer ? this.boundaries.x : this.boundaries.x - this.sprite.width;
                    this.sprite.x = Math.min(this.sprite.x + 5, boundX);
                }
                if(this.direction === -1) {
                    if(playerSide === 'right') {
                        this.sprite.x = Math.max(this.sprite.x - 5, this.sprite.width);
                    }
                    else {
                        this.sprite.x = Math.max(this.sprite.x - 5, 0);
                    }
                }
            }
        })

        app.stage.addChild(this.sprite);

        let up = keyboard(isRightPlayer ? 'ArrowUp' : 'e');
        let right = keyboard(isRightPlayer ? 'ArrowRight' : 'f');
        let down = keyboard(isRightPlayer ? 'ArrowDown' : 'd');
        let left = keyboard(isRightPlayer ? 'ArrowLeft' : 's');

        up.press = () => {
            if(this.state !== 'ATTACK') {
                this.attack();
            }
        };
        right.press = () => {
            this.direction = 1;
            this.run();
        };
        right.release = () => {
            if(this.state === 'RUN') {
                this.idle();
            }
        };
        down.press = () => {
            this.die();
        };
        left.press = () => {
            this.direction = -1;
            this.run();
        };
        left.release = () => {
            if(this.state === 'RUN') {
                this.idle();
            }
        };
    }
    idle() {
        this.state = 'IDLE';
        this.sprite.textures = this.textureManager.getTextures('IDLE')
        this.sprite.gotoAndPlay(0);
    }
    attack() {
        this.state = 'ATTACK';
        this.sprite.textures = this.textureManager.getTextures('ATTACK')
        this.sprite.gotoAndPlay(0);
    }
    run() {
        this.state = 'RUN';
        this.sprite.textures = this.textureManager.getTextures('RUN')
        this.sprite.gotoAndPlay(0);
    }
    die() {
        this.state = 'DIE';
        this.sprite.textures = this.textureManager.getTextures('DIE')
        this.sprite.animationSpeed = 0.4;
        this.sprite.gotoAndPlay(0);
    }
    dead() {
        this.state = 'DEAD';
        this.sprite.textures = this.textureManager.getTextures('DIE')
        this.sprite.gotoAndStop(6);
    }
}


class TextureManager {
    constructor() {
        this.lookup = {};
    }
    getTextures(name) {
        return this.lookup[name] || [];
    }
    load(name, nb) {
        const textures = []
        for(let i=0; i < nb; i++) {
            textures.push(PIXI.Texture.fromFrame(`_${name}_00${i}.png`));
        }

        this.lookup[name] = textures;

        return textures;
    }
}

export default function() {

    // The application will create a renderer using WebGL, if possible,
    // with a fallback to a canvas render. It will also setup the ticker
    // and the root stage PIXI.Container
    const app = new PIXI.Application({width: 1200});

    // load the texture we need
    PIXI.loader
        .add('assets/1_KNIGHT/knight1-idle.json')
        .add('assets/1_KNIGHT/knight1-attack.json')
        .add('assets/1_KNIGHT/knight1-die.json')
        .add('assets/1_KNIGHT/knight1-run.json')
        .load((loader, resources) => {
        // This creates a texture from a 'bunny.png' image
        // const idleTextures = []
        // for(let i=0; i <= 6; i++) {
        //     idleTextures.push(PIXI.Texture.fromFrame(`_IDLE_00${i}.png`));
        // }
        //
        // const idle = new PIXI.extras.AnimatedSprite(idleTextures);
        // idle.scale.set(0.4);
        // idle.play();
        // idle.animationSpeed = 0.4;

        // app.stage.addChild(idle);

            const textureManager = new TextureManager();
            textureManager.load('IDLE', 6);
            textureManager.load('ATTACK', 8);
            textureManager.load('DIE', 7);
            textureManager.load('RUN', 7);

        // const sprite = new PIXI.Sprite(null);
        // sprite.scale.set(0.4)
        //
        // const animation = new Animation(app, sprite);
        // animation.register('IDLE', 7, 0.05);
        // animation.setAnimation('IDLE');
        //
        // app.stage.addChild(sprite);
        new Fighter(app, textureManager, 'left')
        new Fighter(app, textureManager, 'right')
    });

    return app;
}