import MapView = require("views/map");
import EditorView = require("views/editor");
import TooltipView = require("views/tooltip");
import CongratulationsView = require("views/congratulations");
import level = require("level");
import pubsub = require("pubsub");

import {Alpha1Level} from "levels/alpha1";

interface GameController extends _mithril.MithrilController {
}

export const GameWidget: _mithril.MithrilComponent<GameController> = <any> {
    controller: function(): GameController {
        var controller = Object.create(null);

        return controller;
    },

    view: function(controller: GameController, args: {
        level: level.BaseLevel,
        executing: _mithril.MithrilProperty<boolean>,
        event: pubsub.PubSub,
    }) {
        return m(".container", [
            // TODO: change args into an interface
            m.component(MapView.Component, {
                executing: args.executing,
                level: args.level,
                event: args.event,
            }),
            m.component(EditorView.Component, {
                executing: args.executing,
                level: args.level,
                event: args.event,
            }),
        ]);
    },
};

interface MainController extends _mithril.MithrilController {
    level: level.BaseLevel,
    loadScreenOldLevel: level.BaseLevel,
    executing: _mithril.MithrilBasicProperty<boolean>,
    event: pubsub.PubSub,
}

export const MainComponent = {
    controller: function(): MainController {
        let controller = Object.create(null);
        controller.loadScreen = m.prop(false);
        controller.loadScreenOldLevel = null;
        controller.executing = m.prop(false);
        controller.event = new pubsub.PubSub();

        controller.setLevel = function(newLevel: level.BaseLevel) {
            newLevel.event.on(level.BaseLevel.OBJECTIVES_UPDATED, () => {
                if (newLevel.isComplete()) {
                    controller.loadScreenOldLevel = newLevel;
                    newLevel.tooltips().forEach((tooltip) => {
                        tooltip.hide();
                    });

                    let nextLevel = newLevel.nextLevel();
                    newLevel.game.load.onLoadComplete.add(() => {
                        newLevel.game.load.onLoadComplete.removeAll();
                        controller.executing(false);
                        m.startComputation();
                        controller.setLevel(nextLevel);
                        controller.event.broadcast(level.BaseLevel.NEXT_LEVEL_LOADED, nextLevel);
                        controller.loadScreenOldLevel.event.broadcast(level.BaseLevel.NEXT_LEVEL_LOADED);
                        m.endComputation();
                    });
                }
            });

            controller.level = newLevel;
            (<any> window)["cheat_finish"] = () => {
                m.startComputation();
                controller.level.objectives.forEach((objective: any) => {
                    objective.completed = true;
                });
                controller.level.event.broadcast(level.BaseLevel.OBJECTIVES_UPDATED);
                m.endComputation();
            };
        };

        let initLevel = new Alpha1Level();
        controller.setLevel(initLevel);

        return controller;
    },

    view: function(controller: MainController) {
        return m("div", [
            m(<any> "div#main", {
                key: "main",
            }, m.component(GameWidget, {
                level: controller.level,
                executing: controller.executing,
                event: controller.event,
            })),
            m(<any> "div#tooltip", {
                key: "tooltip",
            }, m.component(TooltipView.Component, controller.level.tooltips())),
            m.component(CongratulationsView.Component, {
                level: controller.loadScreenOldLevel,
                onContinue: () => {
                    controller.loadScreenOldLevel = null;
                },
                event: controller.event,
            }),
        ])
    }
}

m.mount(document.getElementById("container"), MainComponent);
