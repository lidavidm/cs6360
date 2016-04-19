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

import Camera = require("camera");
import Objectives = require("views/objectives");
import Controls = require("views/controls");
import level = require("level");
import pubsub = require("pubsub");
import {MAIN} from "model/editorcontext";
import {Session} from "execution/session";
import {PubSub} from "pubsub";

interface MapController extends _mithril.MithrilController {
    phaser: Phaser.Game,
    doneExecuting: _mithril.MithrilProperty<boolean>,
    paused: _mithril.MithrilProperty<boolean>,
    session: Session,
}

/**
 * The map component handles interactions with Phaser and contains the
 * execution controls and objectives.
 */
export const Component: _mithril.MithrilComponent<MapController> = <any> {
    controller: function(args: {
        event: PubSub,
    }): MapController {
        var controller: MapController = {
            phaser: null,
            doneExecuting: m.prop(false),
            paused: m.prop(false),
            session: null,
        };

        args.event.on(level.BaseLevel.NEXT_LEVEL_LOADED, () => {
            controller.doneExecuting(false);
            controller.paused(false);
        });

        return controller;
    },

    view: function(controller: MapController, args: {
        level: level.BaseLevel,
        executing: _mithril.MithrilProperty<boolean>,
        event: pubsub.PubSub,
        changeContext: (className: string, method: string) => void,
    }) {
        var style = "";
        if (args.executing()) {
            style = ".executing";
        }

        return m("div#sidebar" + style, [
            m("div#worldMap[title=Drag to move]", {
                config: function(element: HTMLElement, isInitialized: boolean) {
                    // TODO: listen for a new state?
                    if (!isInitialized) {
                        controller.phaser = new Phaser.Game(
                            "100", "100", Phaser.CANVAS, element);
                        controller.phaser.state.add("Main", args.level);
                        controller.phaser.state.start("Main");
                    }
                },
            }),
            m.component(Controls.Component, {
                executing: args.executing,
                doneExecuting: controller.doneExecuting,
                paused: controller.paused,
                valid: args.level.isCodeValid(),
                memoryUsage: args.level.program.validateMemoryUsage(),

                onrun: () => {
                    if (!args.level.program.isCodeParseable()) {
                        // TODO: report the error somehow
                        args.level.program.flagInvalid(true);
                        return;
                    }
                    else {
                        args.level.program.flagInvalid(false);
                    }

                    args.changeContext(MAIN, "");
                    args.executing(true);
                    let session = args.level.run();
                    controller.session = session;
                    session.then(() => {
                        controller.session = null;
                        m.startComputation();
                        controller.doneExecuting(true);
                        args.executing(false);
                        m.endComputation();
                        window.setTimeout(function() {
                            window.dispatchEvent(new Event("resize"));
                        }, 500);
                    });
                },

                onruninvalid: () => {
                    if (!args.level.program.isCodeParseable()) {
                        // TODO: report the error somehow
                        args.level.program.flagInvalid(true);
                    }
                    else {
                        args.level.program.flagInvalid(false);
                    }

                    args.event.broadcast("runInvalid");
                },

                onrunmemory: () => {
                    args.event.broadcast("runMemory");
                },

                onreset: () => {
                    args.level.runReset().then(() => {
                        m.startComputation();
                        args.executing(false);
                        controller.doneExecuting(false);
                        controller.paused(false);
                        m.endComputation();
                    });
                },

                onabort: () => {
                    if (controller.session) {
                        m.startComputation();
                        controller.session.abort();
                        m.endComputation();
                        window.setTimeout(function() {
                            window.dispatchEvent(new Event("resize"));
                        }, 500);
                    }
                },

                onpause: () => {
                    if (controller.session) {
                        if (controller.session.paused) {
                            controller.paused(false);
                            controller.session.unpause();
                        }
                        else {
                            controller.paused(true);
                            controller.session.pause();
                        }
                    }
                },

                onstep: () => {
                    if (controller.session && controller.session.paused) {
                        controller.session.step();
                    }
                }
            }),
            m.component(Objectives.Component, args.level.objectives),
        ]);
    },
};
