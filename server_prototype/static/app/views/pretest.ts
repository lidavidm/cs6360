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

class MultipleChoiceQuestion {
    text: string;
    choices: string[];

    constructor(text: string, choices: string[]) {
        this.text = text;
        this.choices = choices;
    }
}

class SurveyScaleQuestion {
    text: string;

    constructor(text: string) {
        this.text = text;
    }
}

class SurveyFeedbackQuestion {
    text: string;

    constructor(text: string) {
        this.text = text;
    }
}

type Question = MultipleChoiceQuestion | SurveyFeedbackQuestion | SurveyScaleQuestion;

type Quiz = Question[];

const SAMPLE_QUESTIONS = [
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
    currentQuestion: _mithril.MithrilProperty<number>;
}

export const Component: _mithril.MithrilComponent<PretestController> = <any> {
    controller: function(): PretestController {
        return {
            currentQuestion: m.prop(1),
        };
    },

    view: function(controller: PretestController): _mithril.MithrilVirtualElement<PretestController> {
        return m("div#test", [
            m("header", m("h1", "RCAT: Robot Commander Aptitude Test")),
            m("div#progress", [
                `Question ${controller.currentQuestion() + 1} of ${SAMPLE_QUESTIONS.length}`,
                m("div#progressBar", {
                    style: {
                        width: (((controller.currentQuestion() + 1) / SAMPLE_QUESTIONS.length) * 100).toString() + "%",
                    },
                }),
            ]),
            m("div#question", (function() {
                let question = SAMPLE_QUESTIONS[controller.currentQuestion()];

                if (question instanceof MultipleChoiceQuestion) {
                    return [
                        m("p", question.text),
                        m("radiogroup",
                          m("ol", question.choices.map(function(choice, index) {
                              return m("li", [
                                  m("input[type=radio]", {
                                      group: "answer",
                                      label: choice,
                                      id: "answer" + index,
                                      name: "answer",
                                  }),
                                  m("label", {
                                      "for": "answer" + index,
                                  }, choice),
                              ]);
                          }))),
                    ];
                }
            })()),
            m("div#controls", [
                m(".clearfix"),
                m("button.ui.next", {
                    onclick: function() {
                        controller.currentQuestion(controller.currentQuestion() + 1);
                        if (controller.currentQuestion() >= SAMPLE_QUESTIONS.length) {
                            // TODO:
                            controller.currentQuestion(0);
                        }
                    }
                }, "Next"),
            ]),
        ]);
    }
}
