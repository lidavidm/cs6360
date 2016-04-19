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

import {MovementLevel1} from "levels/movement1";
import {MovementLevel2} from "levels/movement2";
import {MovementLevel3} from "levels/movement3";
import {MovementLevel4} from "levels/movement4";
import {FuncDefsLevel1} from "levels/funcdefs1";
import {FuncDefsLevel2} from "levels/funcdefs2";
import {VacuumLevel1} from "levels/vacuum1";
import {VacuumLevel2} from "levels/vacuum2";
import {VacuumLevel3} from "levels/vacuum3";
import {VacuumLevel4} from "levels/vacuum4";
import {HierarchyLevel1} from "levels/hierarchy1";
import {HierarchyLevel2} from "levels/hierarchy2";
import {HierarchyLevel3} from "levels/hierarchy3";
import {BasicsLevel1} from "levels/basic1";
import {BasicsLevel2} from "levels/basic2";
import {Alpha1Level} from "levels/alpha1";
import {FrackingLevel} from "levels/fracking";

export const DEFAULT_PROGRESSION = new Progression([
    ["movement1", MovementLevel1],
    ["movement2", MovementLevel2],
    ["movement3", MovementLevel3],
    ["movement4", MovementLevel4],
    ["funcdefs1", FuncDefsLevel1],
    ["funcdefs2", FuncDefsLevel2],
    ["vacuum1", VacuumLevel1],
    ["vacuum2", VacuumLevel2],
    ["vacuum3", VacuumLevel3],
    ["vacuum4", VacuumLevel4],
    ["hierarchy1", HierarchyLevel1],
    ["hierarchy2", HierarchyLevel2],
    ["hierarchy3", HierarchyLevel3],
]);
