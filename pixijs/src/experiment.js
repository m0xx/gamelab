import * as PIXI from 'pixi.js'
import {TextureManager} from "./utils";

const app = new PIXI.Application({width: 1000, height: 600});

// const boundaries = {x: this.app.screen.width, y: this.app.screen.height};

const r1 = new PIXI.Graphics();
r1.beginFill(0xFF700B, 0.3);
r1.drawRect(500, 300, 250, 300)
app.stage.addChild(r1);

const r2 = new PIXI.Graphics();
r2.beginFill(0xFF700B, 0.3);
r2.drawRect(500, 300, 250, 300)
// r2.anchor.set(0.5)
app.stage.addChild(r2);

var texture = PIXI.Texture.fromImage('assets/cat.png');
var cat = new PIXI.Sprite(texture);
cat.x = 500
cat.y = 300
cat.anchor.set(1, 0.5)
app.stage.addChild(cat);
window.__cat = cat;

document.getElementById("app").appendChild(app.view)

