import MapView = require("./views/map");
import EditorView = require("./views/editor");
import TooltipView = require("./views/tooltip");

interface GameController extends _mithril.MithrilController {
    executing: _mithril.MithrilBasicProperty<boolean>,
}

const tooltips = m.prop([
    new TooltipView.Tooltip(TooltipView.Region.Map, "Use the arrow keys to look around the map and see what's going on."),
    new TooltipView.Tooltip(TooltipView.Region.Objectives, "Here's what Mission Control said to do."),
    new TooltipView.Tooltip(TooltipView.Region.Controls, "Load your code onto the robot and run it."),
    new TooltipView.Tooltip(TooltipView.Region.Toolbox, "Pick blocks from here…"),
    new TooltipView.Tooltip(TooltipView.Region.Workspace, "…and drop them here to control the robot."),
]);

export const GameWidget = {
    controller: function(): GameController {
        var controller = {
            executing: m.prop(false),
        };

        return controller;
    },

    view: function(controller: GameController) {
        return m(".container", [
            m.component(MapView.Component, {
                executing: controller.executing,
            }),
            m.component(EditorView.Component, {
                executing: controller.executing,
            }),
        ]);
    },
};

interface MainController {

}

export const MainComponent = {
    controller: function(): MainController {
        return {};
    },

    view: function(controller: MainController) {
        return m("div", [
            m("div#main", m.component(GameWidget)),
            m("div#tooltip", m.component(TooltipView.Component, tooltips)),
        ])
    }
}

m.mount(document.getElementById("container"), MainComponent);
