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

export const DEFAULT_PROGRESSION = new Progression([
    ["movement1", MovementLevel1],
    ["movement2", MovementLevel2],
    ["movement3", MovementLevel3],
    ["movement4", MovementLevel4],
    ["backtobase", BackToBase],
    ["makeminer", MakeMiner],
    ["iron", IronLevel],
    ["recycling1", RecyclingLevel],
    ["fracking", FrackingLevel],
    ["scouting", ScoutLevel],
    ["rescue", RescueLevel],
    ["heavylifting", HeavyLiftingLevel],
    ["blastoff", BlastOffLevel],
]);
