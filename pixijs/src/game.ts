import * as PIXI from 'pixi.js'
import shortid from 'shortid';
import Client from "./client";
import {TextureManager} from "./utils";
import {Player, PlayerSide} from "./player";
import {titleStyle} from "./style";
import {Controller, Key, KeyboadRemoteProxy, RemoteKey} from "./inputs";

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
    constructor(wsUrl) {
        this.app = new PIXI.Application({width: 1200});
        this.client = new Client(wsUrl);
        this.textureManager = new TextureManager();

        document.getElementById("app").appendChild(this.app.view)

        this.scenes = {
            setup: {},
            choose: {}
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

            const up = new Key('ArrowUp');
            const right = new Key('ArrowRight');
            const left = new Key('ArrowLeft');

            new KeyboadRemoteProxy(this.gameId, this.playerId, this.client, {
                up,
                right,
                left
            })

            const p1Controller = new Controller({
                up: this.isHost ? up : new RemoteKey(this.gameId, this.playerId, 'up', this.client),
                right: this.isHost ? right : new RemoteKey(this.gameId, this.playerId, 'right', this.client),
                left: this.isHost ? left : new RemoteKey(this.gameId, this.playerId, 'left', this.client)
            });

            const p2Controller = new Controller({
                up: !this.isHost ? up : new RemoteKey(this.gameId, this.playerId, 'up', this.client),
                right: !this.isHost ? right : new RemoteKey(this.gameId, this.playerId, 'right', this.client),
                left: !this.isHost ? left : new RemoteKey(this.gameId, this.playerId, 'left', this.client)
            });

            this.p1 = new Player(this.app, this.textureManager, PlayerSide.LEFT, p1Controller)
            this.p2 = new Player(this.app, this.textureManager, PlayerSide.RIGHT, p2Controller)

            this.initBackground();
            this.initScenes();
            this.setupScreen();
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

        this.setActiveScene('setup')

        if(this.isHost) {
            createShareLink(this.gameId);

            const waitingText = createText(this.app, "Waiting player...", titleStyle)
            this.scenes.setup.addChild(waitingText)

            this.client.once('game:created', ({gameId, player1Id}) => {
                this.scenes.setup.addChild(this.p1.sprite)
            })

            this.client.once('player:joined', ({gameId, player1Id, player2Id}) => {
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

            this.client.once('player:joined', ({gameId, player1Id, player2Id}) => {
                console.log('player joined')

                this.chooseScreen();
            })

            this.client.send('cmd:player:join', {gameId: this.gameId, playerId: this.gameId})
        }

        this.scenes.setup.alpha = 1;
    }

    chooseScreen() {
        this.setActiveScene('choose')

        const readyText = createText(this.app, "Press enter...", titleStyle)
        this.scenes.choose.addChild(readyText)

        const enter = new Key('Enter');
        enter.once('press', () => {
            readyText.destroy();
        })
        this.scenes.choose.addChild(this.p1.sprite)
        this.scenes.choose.addChild(this.p2.sprite)

        this.scenes.choose.alpha = 1;
    }

    fightScreen() {


    }
    update() {

    }

}

export default Game;