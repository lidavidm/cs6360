declare var Blockly: any;

export class Savegame {
    currentLevel: string;
    savedBlocks: { [level: string]: HTMLElement };

    constructor(level: string) {
        this.currentLevel = level;
        this.savedBlocks = Object.create(null);
    }

    stringify(): string {
        let json = Object.create(null);
        json["currentLevel"] = this.currentLevel;
        json["savedBlocks"] = Object.create(null);

        for (let level in this.savedBlocks) {
            json["savedBlocks"][level] = Blockly.Xml.domToPrettyText(this.savedBlocks[level]);
        }

        return JSON.stringify(json);
    }

    save(blocks: HTMLElement) {
        this.savedBlocks[this.currentLevel] = blocks;

        window.localStorage["0"] = this.stringify();
    }

    load(): HTMLElement {
        return this.savedBlocks[this.currentLevel];
    }

    static parse(json: string): Savegame {
        let parsed = JSON.parse(json);
        let game = new Savegame(parsed["currentLevel"]);
        for (let level in parsed["savedBlocks"]) {
            game.savedBlocks[level] = Blockly.Xml.textToDom(parsed["savedBlocks"][level]);
        }

        return game;
    }

    static newGame(level: string): Savegame {
        return new Savegame(level);
    }
}
