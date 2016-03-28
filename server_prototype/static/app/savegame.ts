declare var Blockly: any;

import {EditorContext, MAIN} from "model/editorcontext";

export interface SavedCode {
    workspace: HTMLElement,
    code: string,
}

export interface SavedLevel {
    main: HTMLElement,
    classes: {
        [className: string]: {
            [method: string]: HTMLElement;
        },
    },

}

export class Savegame {
    currentLevel: string;
    savedBlocks: { [level: string]: SavedLevel };

    constructor(level: string) {
        this.currentLevel = level;
        this.savedBlocks = Object.create(null);
    }

    stringify(): string {
        let json = Object.create(null);
        json["currentLevel"] = this.currentLevel;
        json["savedBlocks"] = Object.create(null);

        for (let level in this.savedBlocks) {
            json["savedBlocks"][level] = {};
            let levelObj = json["savedBlocks"][level];
            levelObj.main = Blockly.Xml.domToPrettyText(this.savedBlocks[level].main);
            levelObj.classes = {};
            for (let className in this.savedBlocks[level].classes) {
                levelObj.classes[className] = {};
                for (let method in this.savedBlocks[level].classes[className]) {
                    levelObj.classes[className][method] = Blockly.Xml.domToText(this.savedBlocks[level].classes[className][method]);
                }
            }
        }

        return JSON.stringify(json);
    }

    save(context: EditorContext) {
        if (!(this.currentLevel in this.savedBlocks)) {
            this.savedBlocks[this.currentLevel] = {
                main: null,
                classes: {},
            };
        }

        if (context.className === MAIN) {
            this.savedBlocks[this.currentLevel].main = context.workspace;
        }
        else {
            if (!this.savedBlocks[this.currentLevel].classes[context.className]) {
                this.savedBlocks[this.currentLevel].classes[context.className] = Object.create(null);
            }
            this.savedBlocks[this.currentLevel].classes[context.className][context.method] = context.workspace;
        }

        window.localStorage["0"] = this.stringify();
    }

    load(context: EditorContext): EditorContext {
        context.workspace = Blockly.Xml.textToDom("<xml></xml>");
        if (!(this.currentLevel in this.savedBlocks)) return context;
        if (context.className === MAIN) {
            context.workspace = this.savedBlocks[this.currentLevel].main;
            return context;
        }
        let savedClass = this.savedBlocks[this.currentLevel].classes[context.className];
        if (savedClass && savedClass[context.method]) {
            context.workspace = savedClass[context.method];
        }
        return context;
    }

    loadAll(): SavedLevel {
        return this.savedBlocks[this.currentLevel];
    }

    static parse(json: string): Savegame {
        let parsed = JSON.parse(json);
        let game = new Savegame(parsed["currentLevel"]);
        for (let level in parsed["savedBlocks"]) {
            let parsedLevel = parsed["savedBlocks"][level];
            game.savedBlocks[level] = {
                main: Blockly.Xml.textToDom(parsedLevel.main),
                // TODO:
                classes: {},
            };
        }
        return game;
    }

    static newGame(level: string): Savegame {
        return new Savegame(level);
    }
}
