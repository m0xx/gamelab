export enum InputAction {
    ATTACK = "ATTACK",
    RUN_RIGHT = "RUN_RIGHT",
    RUN_LEFT = "RUN_LEFT"
}

export interface Input {
    subscribe(onPress: () => void, onRelease: () => void);
    unsubscribe();
}

export class Key implements Input {
    keyValue: string;
    downHandler?: (event: any) => void;
    upHandler?: (event: any) => void;

    constructor(keyValue: string) {
        this.keyValue = keyValue;
    }

    subscribe(onPress: () => void, onRelease: () => void) {
        let isDown = false;

        this.downHandler = event => {
            if (event.key === this.keyValue) {
                if(!isDown) {
                    isDown = true;
                    onPress();
                }
                event.preventDefault();
            }
        };

        this.upHandler = event => {
            if (event.key === this.keyValue) {
                if(isDown) {
                    isDown = false;
                    onRelease();
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
    unsubscribe() {
        if(this.downHandler) {
            window.removeEventListener("keydown", this.downHandler);
        }
        if(this.upHandler) {
            window.removeEventListener("keyup", this.upHandler);
        }
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