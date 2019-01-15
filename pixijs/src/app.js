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

const HEART_X = 125;
const LANCE_X = 260;
class Fighter {
    constructor(app, textureManager, playerSide, onAttack, bgY) {
        this.app = app;

        this.isDead = false;
        this.boundaries = {x: app.screen.width, y: app.screen.height}
        this.textureManager = textureManager;
        this.state = 'IDLE';
        this.sprite = new PIXI.extras.AnimatedSprite(textureManager.getTextures('IDLE'));
        this.sprite.animationSpeed = 0.2;
        this.sprite.play();
        this.direction = 1;
        this.sprite.y = bgY;

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
                if(this.sprite.currentFrame >= 6) {
                    onAttack(playerSide, this.sprite)
                }
                if(this.sprite.currentFrame === 7) {
                    this.idle();
                }
            }
            if(this.state === 'DIE') {
                if(this.sprite.currentFrame === 6) {
                    this.dead();
                }

                this.sprite.y += 8
            }
            if(this.state === 'RUN') {
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
        if(this.isDead) return;
        this.state = 'IDLE';
        this.sprite.textures = this.textureManager.getTextures('IDLE')
        this.sprite.gotoAndPlay(0);
    }
    attack() {
        if(this.isDead) return;
        this.state = 'ATTACK';
        this.sprite.textures = this.textureManager.getTextures('ATTACK')
        this.sprite.gotoAndPlay(0);
    }
    run() {
        if(this.isDead) return;
        this.state = 'RUN';
        this.sprite.textures = this.textureManager.getTextures('RUN')
        this.sprite.gotoAndPlay(0);
    }
    die() {
        this.isDead = true;
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

const backgrounds = [
    {src: 'assets/bg-1.png', y: 375},
    {src: 'assets/bg-2.png', y: 375},
    {src: 'assets/bg-3.png', y: 375},
    {src: 'assets/bg-4.png', y: 375}
]

function randomBackground() {
    const idx = Math.floor(Math.random() * backgrounds.length);
    return backgrounds[idx];
}

const titleStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: 48,
    fontWeight: 'bold',
    fill: ['#ffffff', '#00ff99'], // gradient
    stroke: '#4a1850',
    strokeThickness: 5,
    dropShadow: true,
    dropShadowColor: '#000000',
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
    wordWrap: true,
    wordWrapWidth: 440
});

export default function() {

    // The application will create a renderer using WebGL, if possible,
    // with a fallback to a canvas render. It will also setup the ticker
    // and the root stage PIXI.Container
    const app = new PIXI.Application({width: 1200});

    function playerWin(playerNo) {
        var text = new PIXI.Text(`Player #${playerNo} wins!`, titleStyle);
        text.x = app.screen.width / 2 - text.width / 2;
        text.y = 50;

        app.stage.addChild(text);
    }
    // load the texture we need
    PIXI.loader
        .add('bg1', 'assets/bg-1.png')
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


            const {src, y: bgY} = randomBackground();
            var texture = PIXI.Texture.fromImage(src);
            var background = new PIXI.Sprite(texture);
            background.x = 0;
            background.y = 0;
            background.width = app.screen.width;
            background.height = app.screen.height;
            app.stage.addChild(background)


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

        let gameOver = false;
        const p1 = new Fighter(app, textureManager, 'left', (p) => {
            if(gameOver) {
                return;
            }
            const reachX = p1.sprite.x + LANCE_X;
            const heartX = p2.sprite.x - HEART_X;
            console.log(p1.sprite.x, reachX, heartX)
            if(reachX >= heartX) {
                p2.die();
                gameOver = true;
                playerWin(1)
            }

        }, bgY)
        const p2 = new Fighter(app, textureManager, 'right', (p) => {
            if(gameOver) {
                return;
            }
            const reachX = p2.sprite.x - LANCE_X;
            const heartX = p1.sprite.x + HEART_X;

            console.log(p2.sprite.x, reachX, heartX)
            if(reachX <= heartX) {
                p1.die();
                gameOver = true;
                playerWin(2)
            }
        }, bgY)

    });

    return app;
}