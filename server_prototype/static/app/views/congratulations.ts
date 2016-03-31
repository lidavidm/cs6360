import level = require("level");
import pubsub = require("pubsub");

import {renderObjective} from "./objectives";

enum State {
    OldLevel,
    NewStory,
    NewObjectives,
}

interface CongratulationsController extends _mithril.MithrilController {
    loaded: _mithril.MithrilProperty<boolean>,
    nextLevel: level.BaseLevel,
    state: _mithril.MithrilProperty<State>,
}

interface Args {
    level: level.BaseLevel,
    event: pubsub.PubSub,
    onContinue: () => void,
}

export const Component: _mithril.MithrilComponent<CongratulationsController> = <any> {
    controller: function(args: Args): CongratulationsController {
        let controller = Object.create(null);
        controller.loaded = m.prop(false);
        controller.state = m.prop(State.OldLevel);
        controller.nextLevel = null;

        args.event.on(level.BaseLevel.NEXT_LEVEL_LOADED, (nextLevel) => {
            console.log(nextLevel);
            controller.nextLevel = nextLevel;
            controller.loaded(true);
        });

        return controller;
    },

    view: function(controller: CongratulationsController, args: Args): any {
        if (args.level === null) {
            controller.state(State.OldLevel);
            controller.nextLevel = null;
            controller.loaded(false);
            return m(<any> "div", {
                key: "congratulations",
            });
        }

        switch (controller.state()) {
        case State.OldLevel: {
            let button: _mithril.MithrilVirtualElement<CongratulationsController> = null;
            if (controller.loaded()) {
                button = m(<any> "button.ui.right", {
                    onclick: () => {
                        controller.state(State.NewStory);
                    }
                }, "Continue");
            }
            else {
                button = m("button.ui[disabled].right.loading", "Loading…");
            }

            return m(<any> "div#congratulationsContainer", {
                key: "congratulations",
            }, m("div#congratulations", [
                m("h2", "Success"),
                m("ul", args.level.objectives.map(function(objective) {
                    return m("li.objective", [
                        // CSS won't let us style an actual checkbox
                        m("span.checkbox.checked"),
                        renderObjective(objective),
                    ]);
                })),
                button,
                m(".clearfix"),
            ]));
        }

        case State.NewStory: {
            return m(<any> "div#congratulationsContainer.nextLevel", {
                key: "congratulations",
            }, m("div#congratulations", [
                m("h2", "Mission"),
                m("section", controller.nextLevel.missionText.map(function(text) {
                    return m("p", text);
                })),
                m(<any> "button.ui.right", {
                    onclick: () => {
                        controller.state(State.NewObjectives);
                    }
                }, "Continue"),
                m(".clearfix"),
            ]));
        }

        case State.NewObjectives: {
            return m(<any> "div#congratulationsContainer.nextLevel", {
                key: "congratulations",
            }, m("div#congratulations", [
                m("h2", "Objectives"),
                m("ul", controller.nextLevel.objectives.map(function(objective) {
                    return m("li.objective", [
                        m("span.checkbox"),
                        renderObjective(objective),
                    ]);
                })),
                m(<any> "button.ui.right", {
                    onclick: () => {
                        controller.loaded(false);
                        args.onContinue();
                    }
                }, "Continue"),
                m(".clearfix"),
            ]));
        }
        }
    }
}
