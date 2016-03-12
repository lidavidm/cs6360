import level = require("level");

interface ObjectivesController extends _mithril.MithrilController {

}

export const Component: _mithril.MithrilComponent<ObjectivesController> = <any> {
    controller: function(): ObjectivesController {
        return {};
    },

    view: function<T>(controller: ObjectivesController, args: level.Objective<T>[]): any {
        return m("div#objectives", [
            m("h2", "Objectives"),
            m("ul", args.map(function(objective) {
                let completed = objective.completed ? ".checked" : "";
                return m("li", [
                    // CSS won't let us style an actual checkbox
                    m("span.checkbox" + completed),
                    objective.objective,
                ]);
            })),
        ]);
    }
}
