import MapView = require("./views/map");
import EditorView = require("./views/editor");

interface GameController extends _mithril.MithrilController {
    executing: _mithril.MithrilBasicProperty<boolean>,
}

var GameWidget = {
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

console.log("Mount", document.body);
m.mount(document.body, GameWidget);
