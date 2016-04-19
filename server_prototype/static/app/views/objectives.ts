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

import level = require("level");

interface ObjectivesController extends _mithril.MithrilController {

}

export function renderObjective(objective: level.Objective<any>): _mithril.MithrilTrustedString {
    return m.trust(objective.objective.replace(/\[(.*?)\]/g, "<img src='$1'/>"));
}

export const Component: _mithril.MithrilComponent<ObjectivesController> = <any> {
    controller: function(): ObjectivesController {
        return {};
    },

    view: function<T>(controller: ObjectivesController, args: level.Objective<T>[]): any {
        return m("div#objectives", [
            m("h2", "Objectives"),
            m("ul", args.map(function(objective) {
                return m("li.objective" + (objective.completed ? ".completed" : ""), [
                    // CSS won't let us style an actual checkbox
                    m("span.checkbox" + (objective.completed ? ".checked" : "")),
                    m("span.description", renderObjective(objective)),
                ]);
            })),
        ]);
    }
}
