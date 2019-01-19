import * as PIXI from 'pixi.js'

export class TextureManager {
    lookup: object;
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