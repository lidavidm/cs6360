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

export class MultipleChoiceQuestion {
    text: string;
    choices: string[];

    constructor(text: string, choices: string[]) {
        this.text = text;
        this.choices = choices;
    }
}

export class SurveyScaleQuestion {
    text: string;

    constructor(text: string) {
        this.text = text;
    }
}

export class SurveyFeedbackQuestion {
    text: string;

    constructor(text: string) {
        this.text = text;
    }
}

export type Question = MultipleChoiceQuestion | SurveyFeedbackQuestion | SurveyScaleQuestion;

interface TestController extends _mithril.MithrilController {
    currentQuestion: _mithril.MithrilProperty<number>;
    answers: string[],
}

interface Args {
    questions: Question[],
    oncomplete: (answers: string[]) => void,
}

export const Component: _mithril.MithrilComponent<TestController> = <any> {
    controller: function(): TestController {
        return {
            currentQuestion: m.prop(0),
            answers: [],
        };
    },

    view: function(controller: TestController, args: Args): _mithril.MithrilVirtualElement<TestController> {
        return m("div#test", [
            m("header", m("h1", "RCAT: Robot Commander Aptitude Test")),
            m("div#progress", [
                `Question ${controller.currentQuestion() + 1} of ${args.questions.length}`,
                m("div#progressBar", {
                    style: {
                        width: (((controller.currentQuestion() + 1) / args.questions.length) * 100).toString() + "%",
                    },
                }),
            ]),
            m("div#question", {
                // Force mithril to recreate the elements on redraw
                key: "question" + controller.currentQuestion(),
            }, (function() {
                let question = args.questions[controller.currentQuestion()];
                let result = [m("p", question.text)];

                if (question instanceof MultipleChoiceQuestion || question instanceof SurveyScaleQuestion) {
                    let choices = ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"];
                    if (question instanceof MultipleChoiceQuestion) {
                        choices = question.choices;
                    }
                    result.push(
                        m("radiogroup",
                          m("ol", choices.map(function(choice, index) {
                              return m("li", [
                                  m("input[type=radio]", {
                                      id: "answer" + index,
                                      name: "answer",
                                      checked: "",
                                      onchange: function() {
                                          if (controller.answers.length > controller.currentQuestion()) {
                                              controller.answers.pop();
                                          }
                                          controller.answers.push(choice);
                                      },
                                  }),
                                  m("label", {
                                      "for": "answer" + index,
                                  }, choice),
                              ]);
                          })))
                    );
                }
                else if (question instanceof SurveyFeedbackQuestion) {
                    controller.answers.push("");
                    result.push(m("textarea", {
                        placeholder: "Enter any feedback here...",
                        cols: 80,
                        rows: 15,
                        oninput: function(event: any) {
                            controller.answers[controller.answers.length - 1] = event.target.value;
                        }
                    }));
                }

                return result;
            })()),
            m("div#controls", [
                m(".clearfix"),
                m("button.ui.next", {
                    disabled: controller.answers.length > controller.currentQuestion() ? "": "disabled",
                    onclick: function() {
                        controller.currentQuestion(controller.currentQuestion() + 1);
                        if (controller.currentQuestion() >= args.questions.length) {
                            args.oncomplete(controller.answers);
                        }
                    }
                }, "Next"),
            ]),
        ]);
    }
}
