import * as PIXI from 'pixi.js'

class Animation {
    constructor(app, sprite) {
        this.animation = null;
        this.acc = 0;
        this.currentFrame = 0;
        this.maxFrame = -1;
        this.delay = 0.5;
        this.sprite = sprite;

        this.lookupAnimation = {};

        let cpt = 0
        app.ticker.add((delta) => {
            if(this.animation) {
                this.acc += delta
                if(cpt < 10) {
                    console.log(this, delta);
                    cpt++
                }
                // is it time for next frame?
                if (this.acc > this.delay) {
                    // next frame
                    this.currentFrame++;
                    if (this.currentFrame > this.maxFrame) {
                        this.currentFrame = 0
                    }

                    this.sprite.texture = PIXI.Texture.fromFrame(`_${this.animation}_00${this.currentFrame}.png`);
                }
            }
        })
    }
    register(name, nbFrame, frameDelay) {
        this.lookupAnimation[name] = {
            name,
            nbFrame,
            frameDelay
        }
    }
    setAnimation(name) {
        if(!this.lookupAnimation[name]) {
            throw new Error(`invalid animation name ${name}`);
        }
        const {
            frameDelay,
            nbFrame
        } = this.lookupAnimation[name];

        this.animation = name;
        this.acc = 0;
        this.currentFrame = 0;
        this.delay = frameDelay;
        this.maxFrame = nbFrame - 1;
    }
}
// class Animation {
//     constructor(app, sprite) {
//         this.animation = null;
//         this.acc = 0;
//         this.currentFrame = 0;
//         this.maxFrame = -1;
//         this.delay = 0.5;
//         this.sprite = sprite;
//
//         this.lookupAnimation = {};
//
//         let cpt = 0
//         app.ticker.add((delta) => {
//             if(this.animation) {
//                 this.acc += delta
//                 if(cpt < 10) {
//                     console.log(this, delta);
//                     cpt++
//                 }
//                 // is it time for next frame?
//                 if (this.acc > this.delay) {
//                     // next frame
//                     this.currentFrame++;
//                     if (this.currentFrame > this.maxFrame) {
//                         this.currentFrame = 0
//                     }
//
//                     this.sprite.texture = PIXI.Texture.fromFrame(`_${this.animation}_00${this.currentFrame}.png`);
//                 }
//             }
//         })
//     }
//     register(name, nbFrame, frameDelay) {
//         this.lookupAnimation[name] = {
//             name,
//             nbFrame,
//             frameDelay
//         }
//     }
//     setAnimation(name) {
//         if(!this.lookupAnimation[name]) {
//             throw new Error(`invalid animation name ${name}`);
//         }
//         const {
//             frameDelay,
//             nbFrame
//         } = this.lookupAnimation[name];
//
//         this.animation = name;
//         this.acc = 0;
//         this.currentFrame = 0;
//         this.delay = frameDelay;
//         this.maxFrame = nbFrame - 1;
//     }
// }

export default Animation;