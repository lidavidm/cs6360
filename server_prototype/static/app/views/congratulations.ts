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
        // Start in "new story" by default so first level can show the story
        // TODO: XXX this is rather hacky
        controller.state = m.prop(State.NewStory);
        controller.nextLevel = args.level;

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
                m("h2", controller.nextLevel.missionTitle),
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
