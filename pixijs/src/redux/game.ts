import * as PIXI from 'pixi.js'
import {TextureManager} from "./../utils";
import {titleStyle} from "./../style";
import {Controller, Key, KeyboadRemoteProxy, RemoteKey} from "./../inputs";
import {Direction, Player, PlayerSide, PlayerState} from "./player";
import LifeContainer from './life-container'
import {
    dispatch,
    playerInit,
    playerMove,
    playerRun,
    getState,
    playerIdle,
    selectors,
    playerAttack,
    playerDie, playerRemoveLife
} from './state';

function loadResources() {
    return new Promise((resolve, reject) => {
        PIXI.loader
            .add('bg1', 'assets/bg-1.png')
            .add('assets/1_KNIGHT/knight1-idle.json')
            .add('assets/1_KNIGHT/knight1-attack.json')
            .add('assets/1_KNIGHT/knight1-die.json')
            .add('assets/1_KNIGHT/knight1-run.json')
            .load(() => {
                resolve();
            })
    })
}

class Game {
    app: any;
    client: any;
    textureManager: TextureManager;
    players: {left: Player, right: Player};
    boundaries: {x: number, y: number};
    scenes: object;
    constructor() {
        this.app = new PIXI.Application({width: 1200});
        this.textureManager = new TextureManager();

        this.boundaries = {x: this.app.screen.width, y: this.app.screen.height};

        document.getElementById("app").appendChild(this.app.view)

        this.scenes = {
            fight: {}
        }

        this.init();
    }
    init() {
        loadResources()
            .then(() => {
                this.textureManager.load('IDLE', 6);
                this.textureManager.load('ATTACK', 8);
                this.textureManager.load('DIE', 7);
                this.textureManager.load('RUN', 7);

                this.players = {
                    left: new Player(this.app, this.textureManager, PlayerSide.LEFT),
                    right: new Player(this.app, this.textureManager, PlayerSide.RIGHT)
                }

                this.initBackground();
                this.initScenes();
                this.fightScreen();
            })
    }
    initScenes() {
        for (let scene in this.scenes) {
            this.scenes[scene] = new PIXI.Container();
            this.scenes[scene].alpha = 0;
            this.app.stage.addChild(this.scenes[scene]);
        }
    }
    initBackground() {
        const backgrounds = [
            {src: 'assets/bg-1.png', y: 375},
            {src: 'assets/bg-2.png', y: 375},
            {src: 'assets/bg-3.png', y: 375},
            {src: 'assets/bg-4.png', y: 375}
        ]

        const idx = Math.floor(Math.random() * backgrounds.length);
        const {src, y: bgY} = backgrounds[idx];
        const texture = PIXI.Texture.fromImage(src);
        const background = new PIXI.Sprite(texture);
        background.x = 0;
        background.y = 0;
        background.width = this.app.screen.width;
        background.height = this.app.screen.height;

        this.app.stage.addChild(background)
    }
    setActiveScene(sceneName) {
        for (let scene in this.scenes) {
            this.scenes[scene].visible = false;
            if (scene === sceneName) {
                this.scenes[scene].visible = true;
            }
        }
    }
    distanceBetweenPlayers() {
        const leftHitBox = this.players.left.getHitBox();
        const rightHitBox = this.players.right.getHitBox();

        return Math.max(0, rightHitBox.left - (leftHitBox.left + leftHitBox.width));
    }
    fightScreen() {
        this.setActiveScene('fight');

        new LifeContainer(this.app, 'left', 50, 30, 3);
        new LifeContainer(this.app, 'right',1200 - 84 - 50, 30, 3);

        ['left', 'right'].forEach((side) => {
            const player: Player = this.players[side];
            const {width} = player.getRect();

            const x = side === 'left' ? 0 : this.boundaries.x - width;
            dispatch(playerInit(side, x, 350));

            this.scenes.fight.addChild(player.sprite);

            const oppositeSide = side === 'left' ? 'right' : 'left';
            const opponent = this.players[oppositeSide];
            //
            const controller = new Controller({
                up: new Key(side === 'left' ? 'ArrowUp' : 'w'),
                right: new Key(side === 'left' ? 'ArrowRight' : 'd'),
                left: new Key(side === 'left' ? 'ArrowLeft' : 'a')
            });

            controller.on('right:press', () => {
                if(!getState().gameState[side].dead) {
                    dispatch(playerRun(side, 'right'));
                }
            });


            controller.on('right:release', () => {
                if(!getState().gameState[side].dead) {
                    const {animationName, direction} = getState().gameState[side];

                    if (animationName === 'RUN' && direction === 'right') {
                        dispatch(playerIdle(side));
                    }
                }
            })

            controller.on('left:press', () => {
                if(!getState().gameState[side].dead) {
                    dispatch(playerRun(side, 'left'));
                }
            })

            controller.on('left:release', () => {
                if(!getState().gameState[side].dead) {
                    const {animationName, direction} = getState().gameState[side];

                    if (animationName === 'RUN' && direction === 'left') {
                        dispatch(playerIdle(side));
                    }
                }
            })

            controller.on('up:press', () => {
                if(!getState().gameState[side].dead) {
                    dispatch(playerAttack(side));
                }
            })

            let playerDead = false;

            this.app.ticker.add((delta) => {
                const state = getState();

                const playerState = state.gameState[side];

                if(playerState.animationName === 'RUN') {
                    const distance = this.distanceBetweenPlayers();

                    let nextX;
                    if(playerState.direction === 'right') {
                        const step = side === 'right' ? 5 : Math.min(5, distance);
                        nextX = Math.min(playerState.x + step, this.boundaries.x);
                    }
                    else {
                        const step = side === 'left' ? 5 : Math.min(5, distance);
                        nextX = Math.max(playerState.x - step, 0)
                    }

                    dispatch(playerMove(side, nextX, playerState.y));
                }

                if(playerState.animationName === 'ATTACK') {
                    const currentFrame = player.currentFrame();

                    const distance = this.distanceBetweenPlayers();
                    const weaponDistance = player.getAttackDistance(currentFrame);
                    if(weaponDistance >= distance) {
                        dispatch(playerDie(oppositeSide))
                    }

                    // TODO should wait before another transition
                    if(currentFrame === player.getNbFrame() - 1) {
                        dispatch(playerIdle(side));
                    }
                }

                if(playerState.animationName === 'DIE') {
                    if(player.currentFrame() < player.getNbFrame() - 1) {
                        dispatch(playerMove(side, playerState.x, playerState.y + 4));
                    }
                    else if(player.currentFrame() === player.getNbFrame() - 1) {
                        if(!playerDead) {
                            dispatch(playerRemoveLife(side))
                        }
                        playerDead = true;
                    }
                }
            })
        })

        this.scenes.fight.alpha = 1;
    }
}

export default Game;