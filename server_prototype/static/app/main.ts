import MapView = require("./views/map");
import EditorView = require("./views/editor");
import TooltipView = require("./views/tooltip");
import level = require("level");

interface GameController extends _mithril.MithrilController {
    executing: _mithril.MithrilBasicProperty<boolean>,
}

export const GameWidget: _mithril.MithrilComponent<GameController> = <any> {
    controller: function(): GameController {
        var controller = {
            executing: m.prop(false),
        };

        return controller;
    },

    view: function(controller: GameController, args: any) {
        return m(".container", [
            // TODO: change args into an interface
            m.component(MapView.Component, {
                executing: controller.executing,
                level: args.level,
            }),
            m.component(EditorView.Component, {
                executing: controller.executing,
                level: args.level,
            }),
        ]);
    },
};

interface MainController {
    level: level.Level,
}

export const MainComponent = {
    controller: function(): MainController {
        let initLevel = new level.Level();
        initLevel.addClass(null);  // TODO: dependent on Michael's data model
        initLevel.setTooltips([
            [
                new TooltipView.Tooltip(TooltipView.Region.Map, "Use the arrow keys to look around the map and see what's going on."),
                new TooltipView.Tooltip(TooltipView.Region.Objectives, "Here's what Mission Control said to do."),
                new TooltipView.Tooltip(TooltipView.Region.Controls, "Load your code onto the robot and run it."),
                new TooltipView.Tooltip(TooltipView.Region.Toolbox, "Pick blocks from here…"),
                new TooltipView.Tooltip(TooltipView.Region.Workspace, "…and drop them here to control the robot."),
            ]
        ]);

        return {
            level: initLevel,
        };
    },

    view: function(controller: MainController) {
        return m("div", [
            m("div#main", m.component(GameWidget, {
                level: controller.level
            })),
            m("div#tooltip",
              m.component(TooltipView.Component, controller.level.tooltips())),
        ])
    }
}

m.mount(document.getElementById("container"), MainComponent);
