declare var Blockly: any;

import {EditorContext, MAIN} from "model/editorcontext";

interface SavedClasses {
    [className: string]: {
        [method: string]: HTMLElement;
    },
}

export class Savegame {
    currentLevel: string;
    savedBlocks: { [level: string]: HTMLElement };
    classes: SavedClasses;

    constructor(level: string) {
        this.currentLevel = level;
        this.savedBlocks = Object.create(null);
        this.classes = Object.create(null);
    }

    stringify(): string {
        let json = Object.create(null);
        json["currentLevel"] = this.currentLevel;
        json["savedBlocks"] = Object.create(null);

        for (let level in this.savedBlocks) {
            json["savedBlocks"][level] = Blockly.Xml.domToText(this.savedBlocks[level]);
        }

        json["classes"] = {};
        for (let className in this.classes) {
            let savedClass = Object.create(null);
            for (let method in this.classes[className]) {
                savedClass[method] = Blockly.Xml.domToText(this.classes[className][method]);
            }
            json["classes"][className] = savedClass;
        }

        return JSON.stringify(json);
    }

    save(context: EditorContext) {
        if (context.className === MAIN) {
            this.savedBlocks[this.currentLevel] = context.workspace;
        }
        else {
            if (!this.classes[context.className]) {
                this.classes[context.className] = Object.create(null);
            }
            this.classes[context.className][context.method] = context.workspace;
        }

        window.localStorage["0"] = this.stringify();
    }

    load(context: EditorContext): EditorContext {
        context.workspace = Blockly.Xml.textToDom("<xml></xml>");

        if (context.className === MAIN) {
            context.workspace = this.savedBlocks[this.currentLevel] || context.workspace;
            return context;
        }
        let savedClass = this.classes[context.className];
        if (savedClass && savedClass[context.method]) {
            context.workspace = savedClass[context.method];
        }
        return context;
    }

    loadAll(): SavedClasses {
        return this.classes;
    }

    static parse(json: string): Savegame {
        let parsed = JSON.parse(json);
        let game = new Savegame(parsed["currentLevel"]);
        for (let level in parsed["savedBlocks"]) {
            let parsedLevel = parsed["savedBlocks"][level];
            game.savedBlocks[level] = Blockly.Xml.textToDom(parsedLevel);
        }
        for (let className in parsed.classes) {
            game.classes[className] = {};
            for (let method in parsed.classes[className]) {
                game.classes[className][method] = Blockly.Xml.textToDom(parsed.classes[className][method]);
            }
        }
        return game;
    }

    static newGame(level: string): Savegame {
        return new Savegame(level);
    }
}
