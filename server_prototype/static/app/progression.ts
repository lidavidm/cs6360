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

import {BaseLevel} from "level";

export class Progression {
    levels: [string, any, number][];
    levelMap: { [name: string]: [number, any, number] };

    constructor(levels: [string, any, number][]) {
        this.levels = levels;
        this.levelMap = Object.create(null);

        this.levels.forEach(([name, level, id], index) => {
            this.levelMap[name] = [index, level, id];
        });
    }

    getLevel(name: string): any {
        return this.levelMap[name][1];
    }

    getLevelName(index: number): string {
        return this.levels[index][0];
    }

    getLevelID(name: string): number {
        return this.levelMap[name][2];
    }

    nextLevel(name: string): string {
        let [index, _, __] = this.levelMap[name];
        let nextIndex = index + 1;
        if (nextIndex >= this.levels.length) return null;
        return this.levels[nextIndex][0];
    }
}

// import {BasicsLevel1} from "levels/basic1";
// import {BasicsLevel2} from "levels/basic2";
// import {Alpha1Level} from "levels/alpha1";

import {MovementLevel1} from "levels/movement1";
import {MovementLevel2} from "levels/movement2";
import {MovementLevel3} from "levels/movement3";
import {MovementLevel4} from "levels/movement4";
import {BackToBase} from "levels/backtobase";
import {MakeMiner} from "levels/makeminer";
import {IronLevel} from "levels/iron";
import {RecyclingLevel} from "levels/recycling1";
import {FrackingLevel} from "levels/fracking";
import {ScoutLevel} from "levels/scouting";
import {RescueLevel} from "levels/rescue";
import {HeavyLiftingLevel} from "levels/heavylifting";
import {BlastOffLevel} from "levels/blastoff";


// DO NOT DUPLICATE IDS. OTHERWISE WE CAN'T TELL THEM APART IN THE
// LOGS. IDs do not need to be sequential.
// DO NOT USE NEGATIVE NUMBERS. Those are used for the pretest/posttest.
export const DEFAULT_PROGRESSION = new Progression([
    ["movement1", MovementLevel1, 0],
    ["movement2", MovementLevel2, 1],
    ["movement3", MovementLevel3, 2],
    ["movement4", MovementLevel4, 3],
    ["backtobase", BackToBase, 4],
    ["makeminer", MakeMiner, 5],
    ["iron", IronLevel, 6],
    ["recycling1", RecyclingLevel, 7],
    ["fracking", FrackingLevel, 8],
    ["scouting", ScoutLevel, 9],
    ["rescue", RescueLevel, 10],
    ["heavylifting", HeavyLiftingLevel, 11],
    ["blastoff", BlastOffLevel, 12],
]);
