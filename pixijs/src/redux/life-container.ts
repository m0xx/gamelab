import * as PIXI from 'pixi.js'
import {subscribeTo} from "./state";

const SIZE = 20;
const MARGIN = 8;

class LifeContainer {
    maxLifes: number;
    remainingLifes: number;
    graphics: any[];
    constructor(app, side, x, y, maxLifes) {
        this.maxLifes = maxLifes;
        this.remainingLifes = maxLifes;

        this.graphics = [];


        for(let i=0; i < maxLifes; i++) {
            const graphic = new PIXI.Graphics();
            graphic.beginFill(0xFF3300);
            // graphic.beginFill(0xFFFFFF);
            graphic.lineStyle(3, 0xffd900, 1);
            graphic.drawRect(x + (i * (MARGIN + SIZE)), y, SIZE, SIZE);

            this.graphics.push(graphic)
            app.stage.addChild(graphic);
        }

        subscribeTo(`gameState.${side}.remainingLifes`, (state) => {
            const {remainingLifes} = state.gameState[side];

            for(let i=0; i < maxLifes; i++) {
                if(remainingLifes < this.maxLifes - i) {
                    this.graphics[i].visible = false;
                }
            }
        })

    }
}

export default LifeContainer;