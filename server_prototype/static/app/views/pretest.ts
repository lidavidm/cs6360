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

import * as TestView from "views/test";
import {MultipleChoiceQuestion} from "views/test";

const PRETEST = [
    new MultipleChoiceQuestion("This is a sample question?", [
        "I dunno",
        "If you're seeing this something went wrong",
        "Blame David",
    ]),
    new MultipleChoiceQuestion("This is a sample question?", [
        "I dunno",
        "If you're seeing this something went wrong",
        "Blame David",
    ]),
    new MultipleChoiceQuestion("This is a sample question?", [
        "I dunno",
        "If you're seeing this something went wrong",
        "Blame David",
    ]),
];

interface PretestController extends _mithril.MithrilController {
}

export const Component: _mithril.MithrilComponent<PretestController> = <any> {
    controller: function(): PretestController {
        return {};
    },

    view: function(controller: PretestController): _mithril.MithrilVirtualElement<PretestController> {
        return m.component(TestView.Component, {
            oncomplete: function(answers: string[]) {
                alert("Test complete!");
                m.route("/");
            },

            questions: PRETEST,
        })
    }
}
