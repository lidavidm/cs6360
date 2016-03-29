import {BaseLevel} from "level";

export class Progression {
    levels: [string, any][];
    levelMap: { [name: string]: [number, any] };

    constructor(levels: [string, any][]) {
        this.levels = levels;
        this.levelMap = Object.create(null);

        this.levels.forEach(([name, level], index) => {
            this.levelMap[name] = [index, level];
        });
    }

    getLevel(name: string): any {
        return this.levelMap[name][1];
    }

    getLevelName(index: number): string {
        return this.levels[index][0];
    }

    nextLevel(name: string): string {
        let [index, _] = this.levelMap[name];
        let nextIndex = index + 1;
        if (nextIndex >= this.levels.length) return null;
        return this.levels[nextIndex][0];
    }
}

import {MovementLevel1} from "levels/movement1";
import {BasicsLevel1} from "levels/basic1";
import {BasicsLevel2} from "levels/basic2";
import {Alpha1Level} from "levels/alpha1";

export const DEFAULT_PROGRESSION = new Progression([
    ["movement1", MovementLevel1],
    ["basic1", BasicsLevel1],
    ["basic2", BasicsLevel2],
    ["alpha1", Alpha1Level],
]);
