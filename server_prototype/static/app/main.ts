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

import MapView = require("views/map");
import EditorView = require("views/editor");
import TooltipView = require("views/tooltip");
import CongratulationsView = require("views/congratulations");
import level = require("level");
import pubsub = require("pubsub");

import {DEFAULT_PROGRESSION} from "progression";
import {Savegame} from "savegame";
import {EditorContext, MAIN} from "model/editorcontext";
import * as HierarchyView from "views/hierarchy";

interface GameController extends _mithril.MithrilController {
}

export const GameWidget: _mithril.MithrilComponent<GameController> = <any> {
    controller: function(): GameController {
        var controller = Object.create(null);

        return controller;
    },

    view: function(controller: GameController, args: MainController) {
        return m(".container", [
            m.component(MapView.Component, {
                executing: args.executing,
                level: args.level,
                event: args.event,
                savegame: args.savegame,
                changeContext: args.changeContext,
            }),
            m.component(EditorView.Component, {
                executing: args.executing,
                level: args.level,
                event: args.event,
                savegame: args.savegame,
                context: args.context,
                showHierarchy: args.showHierarchy,
                changeContext: args.changeContext,
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
    context: EditorContext,
    changeContext: (className: string, method: string) => void,
    showHierarchy: _mithril.MithrilProperty<boolean>,
}

export const MainComponent = {
    controller: function(): MainController {
        let firstLevelName = DEFAULT_PROGRESSION.getLevelName(0);
        let savegame = Savegame.newGame(firstLevelName);
        if (window.localStorage["0"]) {
            savegame = Savegame.parse(window.localStorage["0"]);
        }

        let controller = Object.create(null);
        controller.loadScreen = m.prop(false);
        controller.loadScreenOldLevel = null;
        controller.executing = m.prop(false);
        controller.event = new pubsub.PubSub();
        controller.savegame = savegame;
        controller.showHierarchy = m.prop(false);

        controller.changeContext = function(className: string, method: string) {
            controller.context = controller.savegame.load({
                className: className,
                method: method,
                workspace: null,
                code: null,
            });
            controller.event.broadcast(level.BaseLevel.CONTEXT_CHANGED, controller.context);
        };

        controller.setLevel = function(newLevel: level.BaseLevel) {
            controller.context = {
                className: MAIN,
                method: "",
                workspace: null,
                code: null,
            };
            controller.context = savegame.load(controller.context);
            savegame.save(controller.context);
            newLevel.program.update(savegame);

            m.startComputation();
            newLevel.loadHierarchy(savegame.loadAll());
            m.endComputation();

            newLevel.event.on(level.BaseLevel.WORKSPACE_UPDATED, (blocks: HTMLElement | string) => {
                m.startComputation();
                if (typeof blocks === "string") {
                    controller.context.code = blocks;
                }
                else {
                    controller.context.workspace = blocks;
                }
                savegame.save(controller.context);
                m.endComputation();
            });

            newLevel.event.on(level.BaseLevel.OBJECTIVES_UPDATED, () => {
                if (newLevel.isComplete()) {
                    controller.loadScreenOldLevel = newLevel;
                    newLevel.tooltips().forEach((tooltip) => {
                        tooltip.hide();
                    });

                    let newLevelName = DEFAULT_PROGRESSION.nextLevel(savegame.currentLevel);
                    if (!newLevelName) {
                        window.setTimeout(function() {
                            window.setTimeout(function() {
                                m.route("/posttest", { uuid: savegame.uuid }, true);
                            }, 1250);

                            document.querySelector(".controller").classList.add("vanish");
                        }, 500);
                        return;
                    }

                    savegame.currentLevel = newLevelName;
                    let nextLevelProto = DEFAULT_PROGRESSION.getLevel(newLevelName);
                    let nextLevel = new nextLevelProto;
                    newLevel.game.state.add("Next", nextLevel, true);
                    newLevel.game.load.onLoadComplete.add(() => {
                        newLevel.game.load.onLoadComplete.removeAll();
                        controller.executing(false);
                        m.startComputation();
                        controller.setLevel(nextLevel);

                        let saved = savegame.load({
                            className: MAIN,
                            method: "",
                            workspace: null,
                        });
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
            (<any> window)["cheat_reset"] = () => {
                delete window.localStorage["0"];
                window.location.reload();
            };
        };

        // TYPE SYSTEM SHENANNIGANS
        let initLevelProto = DEFAULT_PROGRESSION.getLevel(savegame.currentLevel);
        let initLevel: level.BaseLevel = new initLevelProto;
        controller.setLevel(initLevel);
        controller.loadScreenOldLevel = initLevel;

        return controller;
    },

    view: function(controller: MainController) {
        return m("div.controller", [
            m(<any> "div#main", {
                key: "main",
            }, m.component(GameWidget, controller)),
            m(<any> "div#tooltip", {
                key: "tooltip",
            }, m.component(TooltipView.Component, controller.level.tooltips())),
            m.component(HierarchyView.Component, {
                showHierarchy: controller.showHierarchy,
                hierarchy: controller.level.hierarchy,
                event: controller.event,
                level: controller.level,
                changeContext: controller.changeContext,
            }),
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
