import {EventEmitter} from "eventemitter3";
import Client from "./client";
import {release} from "os";

export enum InputAction {
    ATTACK = "ATTACK",
    RUN_RIGHT = "RUN_RIGHT",
    RUN_LEFT = "RUN_LEFT"
}

export interface Input {
    subscribe(onPress: () => void, onRelease: () => void);
    unsubscribe();
    on(event: string, handler: (...args: any) => void);
    once(event: string, handler: (...args: any) => void);
    off(event: string, handler: (...args: any) => void);
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



export class RemoteKey extends EventEmitter implements Input {
    constructor(gameId, playerId, keyName, client: Client) {
        super();

        client.on('player:key:press', ({gameId: _gameId, playerId: _playerId, key: _key}) => {
            if(gameId === _gameId && playerId === _playerId && keyName === _key) {
                this.emit('press')
            }
        })

        client.on('player:key:release', ({gameId: _gameId, playerId: _playerId, key: _key}) => {
            if(gameId === _gameId && playerId === _playerId && keyName === _key) {
                this.emit('release')
            }
        })
    }

    subscribe(onPress: () => void, onRelease: () => void) {
        this.on('press', onPress)
        this.on('release', onRelease)
    }

    unsubscribe() {
        // TODO
    }

}

export class KeyboadRemoteProxy {
    constructor(gameId, playerId, client: Client, mappings: {[x: string]: Key}) {
        Object.keys(mappings).forEach((key) => {
            const pressHandler = () => {
                client.send('cmd:key:press',{
                    gameId,
                    playerId,
                    key
                })
            }

            const releaseHandler = () => {
                client.send('cmd:key:release',{
                    gameId,
                    playerId,
                    key
                })
            }

            mappings[key].on('press', pressHandler);
            mappings[key].on('release', releaseHandler);
        })
    }
}

type Handler = () => void;

export class Controller extends EventEmitter{
    mappings: { [k: string]: Input };
    inputState: { [k: string]: boolean };
    constructor(mappings) {
        super();
        this.mappings = mappings;
        this.inputState = {}

        Object.keys(this.mappings)
            .map((inputName) => {
                const onPress = () => {
                    this.emit(`${inputName}:press`);
                    this.inputState[inputName] = true;
                }

                const onRelease = () => {
                    this.emit(`${inputName}:release`);
                    this.inputState[inputName] = true;
                }

                this.mappings[inputName].on('press', onPress);
                this.mappings[inputName].on('release', onRelease);
            })
    }
    isPressed(input: string): boolean {
        return this.inputState[input] === true;
    }
}