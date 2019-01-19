import {EventEmitter} from "eventemitter3";

export enum InputAction {
    ATTACK = "ATTACK",
    RUN_RIGHT = "RUN_RIGHT",
    RUN_LEFT = "RUN_LEFT"
}

export interface Input {
    subscribe(onPress: () => void, onRelease: () => void);
    unsubscribe();
}

export class Key extends EventEmitter implements Input {
    keyValue: string;
    downHandler?: (event: any) => void;
    upHandler?: (event: any) => void;

    constructor(keyValue: string) {
        super()
        this.keyValue = keyValue;

        let isDown = false;

        this.downHandler = event => {
            console.log(event.key)
            if (event.key === this.keyValue) {
                if(!isDown) {
                    isDown = true;
                    this.emit('press')
                }
                event.preventDefault();
            }
        };

        this.upHandler = event => {
            if (event.key === this.keyValue) {
                if(isDown) {
                    isDown = false;
                    this.emit('release')
                }
                event.preventDefault();
            }
        };


        window.addEventListener(
            "keydown", this.downHandler, false
        );
        window.addEventListener(
            "keyup", this.upHandler, false
        );
    }

    subscribe(onPress: () => void, onRelease: () => void) {
        this.on('press', onPress)
        this.on('release', onRelease)
    }
    unsubscribe() {
        if(this.downHandler) {
            window.removeEventListener("keydown", this.downHandler);
        }
        if(this.upHandler) {
            window.removeEventListener("keyup", this.upHandler);
        }
    }
}



export class RemoteKey implements Input {
    gameId: string;
    playerId: string;
    socket: any;
    key: string;

    constructor(gameId, playerId, key, socket) {
        this.gameId = gameId;
        this.playerId = playerId;
        this.socket = socket;
        this.key = key;
    }

    subscribe(onPress: () => void, onRelease: () => void) {
        const keyValue = this.key;
        console.log('subscribe', this)
        const that = this;
        this.socket.onMessage((event) => {
            console.log(event.data, that, keyValue)
            const {
                gameId,
                playerId,
                key,
                action
            } = JSON.parse(event.data);

            if(gameId === this.gameId && playerId === this.playerId && key === this.key) {
                if(action === 'press') {
                    onPress();
                }
                else if(action === 'release') {
                    onRelease()
                }
            }
        })
    }

    unsubscribe() {
        this.socket.onmessage = undefined;
    }

}

export class KeyboadRemoteProxy {
    constructor(gameId, playerId, socket, mappings: {[x: string]: Key}) {
        Object.keys(mappings).forEach((key) => {
            const pressHandler = () => {
                socket.send(JSON.stringify({
                    gameId,
                    playerId,
                    action: 'press',
                    key
                }))
            }

            const releaseHandler = () => {
                socket.send(JSON.stringify({
                    gameId,
                    playerId,
                    action: 'release',
                    key
                }))
            }

            mappings[key].subscribe(pressHandler, releaseHandler);
        })
    }
}

type Handler = () => void;

export class Controller {
    mappings: { [k: string]: Input };
    pressHandlers: { [k: string]: Handler[] };
    releaseHandlers: { [k: string]: Handler[] };
    inputState: { [k: string]: boolean };
    constructor(mappings) {
        this.mappings = mappings;
        this.pressHandlers = {}
        this.releaseHandlers = {}
        this.inputState = {}

        Object.keys(this.mappings)
            .map((inputName) => {
                const onPress = () => {
                    console.log('onPress ' + inputName)
                    const pressHandlers = this.pressHandlers[inputName] || [];
                    pressHandlers
                        .forEach((handler) => {
                            handler();
                        })

                    this.inputState[inputName] = true;
                }

                const onRelease = () => {
                    console.log('onRelease ' + inputName)
                    const releaseHandlers = this.releaseHandlers[inputName] || [];
                    releaseHandlers
                        .forEach((handler) => {
                            handler();
                        })

                    this.inputState[inputName] = false;
                }

                this.mappings[inputName].subscribe(onPress, onRelease);
            })
    }
    onPress(input: string, handler: () => void): void {
        if(!this.pressHandlers[input]) {
            this.pressHandlers[input] = []
        }

        this.pressHandlers[input].push(handler);
    }
    onRelease(input: string, handler: () => void): void {
        if(!this.releaseHandlers[input]) {
            this.releaseHandlers[input] = []
        }

        this.releaseHandlers[input].push(handler);
    }
    isPressed(input: string): boolean {
        return this.inputState[input] === true;
    }
}