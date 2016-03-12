interface MapController extends _mithril.MithrilController {
    phaser: Phaser.Game,
}

import Camera = require("camera");
import Objectives = require("views/objectives");
import Controls = require("views/controls");
import level = require("level");

/**
 * The map component handles interactions with Phaser and contains the
 * execution controls and objectives.
 */
export const Component: _mithril.MithrilComponent<MapController> = <any> {
    controller: function(): MapController {
        var controller: MapController = {
            phaser: null,
        };

        return controller;
    },

    view: function(controller: MapController, args: {
        state: level.BaseState,
        executing: _mithril.MithrilProperty<boolean>,
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
                        controller.phaser.state.add("Main", args.state);
                        controller.phaser.state.start("Main");
                    }
                },
            }),
            m.component(Objectives.Component, args.state.level.objectives()),
            m.component(Controls.Component, {
                executing: args.executing,

                onrun: () => {
                    args.executing(true);
                    args.state.zoom(args.executing());
                },

                onabort: () => {
                    args.state.level.objectives().map((objective) => {
                        objective.completed = true;
                    })

                    args.state.level.event.broadcast(level.Level.OBJECTIVES_UPDATED);
                },
            }),
        ]);
    },
};
