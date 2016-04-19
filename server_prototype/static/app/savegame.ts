// Copyright 2016 David Li, Michael Mauer, Andy Jiang

// This file is part of Tell Me to Survive.

// Tell Me to Survive is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Tell Me to Survive is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with Tell Me to Survive.  If not, see <http://www.gnu.org/licenses/>.

import {EditorContext, MAIN} from "model/editorcontext";

interface SavedCode {
    workspace: string,
    code: string,
}

export interface SavedClasses {
    [className: string]: {
        [method: string]: HTMLElement | string;
    },
}

export class Savegame {
    currentLevel: string;
    savedBlocks: { [level: string]: HTMLElement | string };
    classes: SavedClasses;

    constructor(level: string) {
        this.currentLevel = level;
        this.savedBlocks = Object.create(null);
        this.classes = Object.create(null);
    }

    stringifyCode(input: HTMLElement | string): SavedCode {
        if (typeof input === "string") {
            return {
                workspace: null,
                code: input,
            }
        }
        else {
            return {
                workspace: Blockly.Xml.domToText(input),
                code: null,
            };
        }
    }

    stringify(): string {
        let json = Object.create(null);
        json["currentLevel"] = this.currentLevel;
        json["savedBlocks"] = Object.create(null);

        for (let level in this.savedBlocks) {
            if (this.savedBlocks[level]) {
                json["savedBlocks"][level] = this.stringifyCode(this.savedBlocks[level]);
            }
        }

        json["classes"] = {};
        for (let className in this.classes) {
            let savedClass = Object.create(null);
            for (let method in this.classes[className]) {
                let methodImpl = this.classes[className][method];
                if (methodImpl) {
                    savedClass[method] = this.stringifyCode(methodImpl);
                }
            }
            json["classes"][className] = savedClass;
        }

        return JSON.stringify(json);
    }

    save(context: EditorContext) {
        if (context.className === MAIN) {
            if (context.code) {
                this.savedBlocks[this.currentLevel] = context.code;
            }
            else {
                this.savedBlocks[this.currentLevel] = context.workspace;
            }
        }
        else {
            if (!this.classes[context.className]) {
                this.classes[context.className] = Object.create(null);
            }
            if (context.code) {
                this.classes[context.className][context.method] = context.code;
            }
            else {
                this.classes[context.className][context.method] = context.workspace;
            }
        }

        window.localStorage["0"] = this.stringify();
    }

    load(context: EditorContext): EditorContext {
        context.code = null;
        context.workspace = null;

        if (context.className === MAIN) {
            if (this.savedBlocks[this.currentLevel]) {
                let saved = this.savedBlocks[this.currentLevel];
                if (typeof saved === "string") {
                    context.code = saved;
                }
                else {
                    context.workspace = saved;
                }
            }
            return context;
        }
        let savedClass = this.classes[context.className];
        if (savedClass && savedClass[context.method]) {
            let saved = savedClass[context.method];
            if (typeof saved === "string") {
                context.code = saved;
            }
            else {
                context.workspace = saved;
            }
        }
        return context;
    }

    loadAll(): SavedClasses {
        return this.classes;
    }

    static parseCode(input: SavedCode): HTMLElement | string {
        if (input.code) {
            return input.code;
        }
        else {
            return Blockly.Xml.textToDom(input.workspace || "<xml></xml>");
        }
    }

    static parse(json: string): Savegame {
        let parsed = JSON.parse(json);
        let game = new Savegame(parsed["currentLevel"]);
        for (let level in parsed["savedBlocks"]) {
            let parsedLevel = parsed["savedBlocks"][level];
            game.savedBlocks[level] = Savegame.parseCode(parsedLevel);
        }
        for (let className in parsed.classes) {
            game.classes[className] = {};
            for (let method in parsed.classes[className]) {
                game.classes[className][method] = Savegame.parseCode(parsed.classes[className][method]);
            }
        }
        return game;
    }

    static newGame(level: string): Savegame {
        return new Savegame(level);
    }
}
