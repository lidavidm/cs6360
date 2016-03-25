import MapView = require("views/map");
import EditorView = require("views/editor");
import TooltipView = require("views/tooltip");
import CongratulationsView = require("views/congratulations");
import level = require("level");
import pubsub = require("pubsub");

import {DEFAULT_PROGRESSION} from "progression";
import {Savegame} from "savegame";

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
        savegame: Savegame,
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
                savegame: args.savegame,
            }),
        ]);
    },
};

interface MainController extends _mithril.MithrilController {
    level: level.BaseLevel,
    loadScreenOldLevel: level.BaseLevel,
    executing: _mithril.MithrilBasicProperty<boolean>,
    event: pubsub.PubSub,
    savegame: Savegame,
}

export const MainComponent = {
    controller: function(): MainController {
        let firstLevelName = DEFAULT_PROGRESSION.getLevelName(0);
        let savegame = Savegame.newGame(firstLevelName);
        if (window.localStorage["0"]) {
            savegame = Savegame.parse(window.localStorage["0"]);
            savegame.currentLevel = firstLevelName;
        }

        let controller = Object.create(null);
        controller.loadScreen = m.prop(false);
        controller.loadScreenOldLevel = null;
        controller.executing = m.prop(false);
        controller.event = new pubsub.PubSub();
        controller.savegame = savegame;

        controller.setLevel = function(newLevel: level.BaseLevel) {
            newLevel.event.on(level.BaseLevel.WORKSPACE_UPDATED, (blocks: HTMLElement) => {
                savegame.save(blocks);
            });
            newLevel.event.on(level.BaseLevel.OBJECTIVES_UPDATED, () => {
                if (newLevel.isComplete()) {
                    controller.loadScreenOldLevel = newLevel;
                    newLevel.tooltips().forEach((tooltip) => {
                        tooltip.hide();
                    });

                    let newLevelName = DEFAULT_PROGRESSION.nextLevel(savegame.currentLevel);
                    if (!newLevelName) {
                        // TODO: victory screen!
                    }
                    // TODO: save workspace
                    savegame.currentLevel = newLevelName;
                    let nextLevelProto = DEFAULT_PROGRESSION.getLevel(newLevelName);
                    let nextLevel = new nextLevelProto;
                    newLevel.game.state.add("Next", nextLevel, true);
                    newLevel.game.load.onLoadComplete.add(() => {
                        newLevel.game.load.onLoadComplete.removeAll();
                        controller.executing(false);
                        m.startComputation();
                        controller.setLevel(nextLevel);

                        let saved = savegame.load();
                        controller.event.broadcast(level.BaseLevel.NEXT_LEVEL_LOADED, nextLevel, saved);

                        // TODO: get rid of this (get rid of level events?)
                        if (controller.loadScreenOldLevel) {
                            controller.loadScreenOldLevel.event.broadcast(level.BaseLevel.NEXT_LEVEL_LOADED);
                        }

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

        // TYPE SYSTEM SHENANNIGANS
        let initLevelProto = DEFAULT_PROGRESSION.getLevel(savegame.currentLevel);
        let initLevel: level.BaseLevel = new initLevelProto;
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
                savegame: controller.savegame,
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
