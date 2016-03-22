import Camera = require("camera");
import Objectives = require("views/objectives");
import Controls = require("views/controls");
import level = require("level");
import pubsub = require("pubsub");
import {Session} from "../execution/session";

interface MapController extends _mithril.MithrilController {
    phaser: Phaser.Game,
    doneExecuting: _mithril.MithrilProperty<boolean>,
    session: Session,
}

/**
 * The map component handles interactions with Phaser and contains the
 * execution controls and objectives.
 */
export const Component: _mithril.MithrilComponent<MapController> = <any> {
    controller: function(): MapController {
        var controller: MapController = {
            phaser: null,
            doneExecuting: m.prop(false),
            session: null,
        };

        return controller;
    },

    view: function(controller: MapController, args: {
        level: level.BaseLevel,
        executing: _mithril.MithrilProperty<boolean>,
        event: pubsub.PubSub,
    }) {
        var style = "";
        if (args.executing()) {
            style = ".executing";
        }

        return m("div#sidebar" + style, [
            m("div#worldMap", {
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
            m.component(Objectives.Component, args.level.objectives),
            m.component(Controls.Component, {
                executing: args.executing,
                doneExecuting: controller.doneExecuting,

                onrun: () => {
                    args.executing(true);
                    let session = args.level.run();
                    controller.session = session;
                    session.then(() => {
                        controller.session = null;
                        m.startComputation();
                        controller.doneExecuting(true);
                        m.endComputation();
                    });
                },

                onreset: () => {
                    args.level.runReset().then(() => {
                        m.startComputation();
                        args.executing(false);
                        controller.doneExecuting(false);
                        m.endComputation();
                    });
                },

                onabort: () => {
                    if (controller.session) {
                        controller.session.abort();
                    }
                },

                onpause: () => {
                    if (controller.session) {
                        if (controller.session.paused) {
                            controller.session.unpause();
                        }
                        else {
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
        ]);
    },
};
