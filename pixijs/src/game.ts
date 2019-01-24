import * as PIXI from 'pixi.js'
import shortid from 'shortid';
import Client from "./client";
import {TextureManager} from "./utils";
import {Direction, Player, PlayerSide, PlayerState} from "./player";
import {titleStyle} from "./style";
import {Controller, Key, KeyboadRemoteProxy, RemoteKey} from "./inputs";

const DEBUG = true;
const SINGLEPLAYER = false;

function getGameIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('gameId') || null;
}

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

function createShareLink(gameId) {
    const container = document.createElement("div")
    container.setAttribute('style', 'padding: 8px;')
    const link = document.createElement("a");
    const content = document.createTextNode(`Play!`);
    link.appendChild(content);

    link.setAttribute('target', '_blank')
    link.setAttribute('href', `${window.location}?gameId=${gameId}`)
    container.appendChild(link)

    document.body.prepend(container)
}

function createText(app, text, style) {
    var text = new PIXI.Text(text, new PIXI.TextStyle(style));
    text.x = app.screen.width / 2 - text.width / 2;
    text.y = 50;

    return text;
}

class Game {
    app: any;
    client: any;
    gameId: string;
    playerId: string;
    isHost: boolean;
    scenes: object;
    textureManager: TextureManager;
    p1: Player;
    p2: Player;
    opponentId: string;
    boundaries: {x: number, y: number};
    constructor(wsUrl) {
        this.app = new PIXI.Application({width: 1200});
        this.client = new Client(wsUrl);
        this.textureManager = new TextureManager();

        this.boundaries = {x: this.app.screen.width, y: this.app.screen.height};

        document.getElementById("app").appendChild(this.app.view)

        this.scenes = {
            setup: {},
            choose: {},
            fight: {}
        }

        this.init();
    }
    init() {
        Promise.all([
            this.client.init(),
            loadResources()
        ])
        .then(() => {
            console.log('Connected to ws')

            this.isHost = getGameIdFromUrl() === null;
            this.gameId = this.isHost ? shortid() : getGameIdFromUrl();
            this.playerId = shortid();

            this.textureManager.load('IDLE', 6);
            this.textureManager.load('ATTACK', 8);
            this.textureManager.load('DIE', 7);
            this.textureManager.load('RUN', 7);
            console.log('Game ID: ' + this.gameId);

            this.p1 = new Player(this.app, this.textureManager, PlayerSide.LEFT)
            this.p2 = new Player(this.app, this.textureManager, PlayerSide.RIGHT)

            this.p1.setX(0);
            this.p1.setY(350);

            this.p2.setX(this.boundaries.x);
            this.p2.setY(350);

            this.initBackground();
            this.initScenes();

            if(SINGLEPLAYER) {
                this.fightScreen();
            }
            else {
                this.setupScreen();
            }
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

    setupScreen() {

        this.setActiveScene('fight')

        if(this.isHost) {
            createShareLink(this.gameId);

            const waitingText = createText(this.app, "Waiting player...", titleStyle)
            this.scenes.setup.addChild(waitingText)

            this.client.once('game:created', ({gameId, player1Id}) => {
                this.scenes.setup.addChild(this.p1.sprite)
            })

            this.client.once('player:joined', ({gameId, p1, p2}) => {
                this.opponentId = p2.id;
                waitingText.destroy();
                this.scenes.setup.addChild(this.p2.sprite)


                this.chooseScreen();
            })

            this.client.send('cmd:game:create', {
                playerId: this.playerId,
                gameId: this.gameId
            })
        }
        else {
            this.client.once('game:full', ({gameId, player1Id, player2Id}) => {
                const fullText = createText(this.app, "Sory, game is full...", titleStyle)
                this.scenes.setup.addChild(fullText)
            })

            this.client.once('player:joined', ({gameId, p1, p2}) => {
                this.opponentId = p1.id;
                console.log('player joined')

                this.chooseScreen();
            })

            this.client.send('cmd:player:join', {gameId: this.gameId, playerId: this.playerId})
        }

        this.scenes.setup.alpha = 1;
    }

    chooseScreen() {
        this.setActiveScene('choose')

        this.client.once('game:start', ({gameId, player1Id, player2Id}) => {
            console.log('game start')

            this.fightScreen();
        })

        const readyText = createText(this.app, "Press enter...", titleStyle)
        this.scenes.choose.addChild(readyText)

        const enter = new Key('Enter');
        enter.once('press', () => {
            readyText.destroy();

            this.client.send("cmd:player:ready", {
                playerId: this.playerId,
                gameId: this.gameId
            })
        })
        this.scenes.choose.addChild(this.p1.sprite)
        this.scenes.choose.addChild(this.p2.sprite)


        this.scenes.choose.alpha = 1;
    }

    fightScreen() {
        this.setActiveScene('fight')

        this.scenes.fight.addChild(this.p1.sprite)
        this.scenes.fight.addChild(this.p2.sprite)

        const up = new Key('ArrowUp');
        const right = new Key('ArrowRight');
        const left = new Key('ArrowLeft');

        let remoteController;
        if(SINGLEPLAYER) {
            remoteController = new Controller({
                up: new Key('w'),
                right: new Key('d'),
                left: new Key('a'),
            })
        }
        else {
            new KeyboadRemoteProxy(this.gameId, this.playerId, this.client, {
                up,
                right,
                left
            })

            remoteController = new Controller({
                up: new RemoteKey(this.gameId, this.opponentId, 'up', this.client),
                right: new RemoteKey(this.gameId, this.opponentId, 'right', this.client),
                left: new RemoteKey(this.gameId, this.opponentId, 'left', this.client)
            });
        }


        const localController = new Controller({
            up,
            right,
            left
        });

        // TODO remove window
        const p1 = window.__p1 = this.p1;
        const p2 = window.__p2 = this.p2;

        [p1, p2].forEach((player: Player) => {

            let shadow;
            let shadowInfos;

            if(DEBUG) {
                window.__shadows = [];
                shadow = new PIXI.Graphics();

                shadow.lineStyle(2, 0x0000FF, 0.3);
                shadow.beginFill(0xFF700B, 0.3);

                const {left, right} = player.getHitBox();
                shadow.drawRect(left, 350, right - left, player.sprite.y);


                shadowInfos = new PIXI.Text("0 / 0", new PIXI.TextStyle({}));
                // shadow.addChild(shadowInfos);

                this.scenes.fight.addChild(shadow)
            }

            const opponent = player === p1 ? p2 : p1;
            const controller = this.isHost && player === p1 || !this.isHost && player === p2 ? localController : remoteController;

            console.log('Rect', player.getRect());
            controller.on('up:press', () => {

                if(player.state !== PlayerState.ATTACK) {
                    player.attack();
                }
            })

            controller.on('right:press', () => {
                console.log('right:press')
                player.direction = Direction.RIGHT;
                player.run();
            })

            controller.on('right:release', () => {
                if(player.state === PlayerState.RUN && player.direction === Direction.RIGHT) {
                    player.idle();
                }
            })

            controller.on('left:press', () => {
                player.direction = Direction.LEFT;
                player.run();
            })

            controller.on('left:release', () => {
                if(player.state === PlayerState.RUN && player.direction === Direction.LEFT) {
                    player.idle();
                }
            })

            this.app.ticker.add((delta) => {
                const playerSide: PlayerSide = player.playerSide;

                if(DEBUG) {
                    window.__shadows.push(shadow);

                    shadow.x = player.getHitBox().left
                    // shadowInfos.text = `${player.getPosition().left} / ${player.getRectangle().left}`
                }

                if(player.state === PlayerState.RUN) {
                    const {left, right} = opponent.getHitBox();

                    if(player.direction === Direction.RIGHT) {
                        const boundX = playerSide === PlayerSide.LEFT ? left : this.boundaries.x;

                        player.setX(Math.min(player.getX() + 15, boundX));
                    }
                    else if(player.direction === Direction.LEFT) {
                        const boundX = playerSide === PlayerSide.RIGHT ? right : 0;

                        player.setX(Math.max(player.getX() - 15, boundX));
                    }
                }

                if(player.state === PlayerState.ATTACK) {
                    if(player.sprite.currentFrame >= 6) {
                        if(player.playerSide === PlayerSide.LEFT) {
                            const reachX = player.getPosition().right + player.getWeaponReachX();
                            const opponentHeartX = opponent.getPosition().left + opponent.getHitOffsetX();

                            console.log('Attack', reachX, opponentHeartX)
                            console.log('Pos', player.getPosition(), opponent.getPosition())
                            if(reachX >= opponentHeartX) {
                                opponent.kill();
                            }
                        }
                        else {
                            const reachX = player.getPosition().left - player.getWeaponReachX();
                            const opponentHeartX = opponent.getPosition().left - opponent.getHitOffsetX();

                            if(reachX <= opponentHeartX) {
                                opponent.kill();
                            }
                        }
                    }

                    if(player.sprite.currentFrame === 7 && !opponent.isDead()) {
                        player.idle();
                    }
                }
            })
        })

        this.scenes.fight.alpha = 1;
    }
    update() {

    }

}

export default Game;