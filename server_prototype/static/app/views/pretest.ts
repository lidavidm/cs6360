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
import * as Logging from "logging";
import {MultipleChoiceQuestion, SurveyScaleQuestion, SurveyFeedbackQuestion} from "views/test";

const PRETEST = [
    new MultipleChoiceQuestion("This is a sample question?", [
        "I dunno",
        "If you're seeing this something went wrong",
        "Blame David",
    ]),
    new SurveyScaleQuestion("I enjoyed this game."),
    new SurveyFeedbackQuestion("Please enter any thoughts you have here."),
];

interface PretestController extends _mithril.MithrilController {
}

export const Component: _mithril.MithrilComponent<PretestController> = <any> {
    controller: function(): PretestController {
        // TODO: grab UUID and pass it to the main game
        return {};
    },

    view: function(controller: PretestController): _mithril.MithrilVirtualElement<PretestController> {
        return m.component(TestView.Component, {
            oncomplete: function(answers: string[]) {
                alert("Test complete!");
                // TODO: get UUID
                Logging.saveAnswers(null, "pretest", answers);
                window.setTimeout(() => {
                    m.route("/game", {}, true);
                }, 1250);
                document.getElementById("test").classList.add("vanish");
            },

            questions: PRETEST,

            title: "RCAT: Robot Commander Aptitude Test",
        });
    }
}
