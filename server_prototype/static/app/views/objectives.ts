import level = require("level");

interface ObjectivesController extends _mithril.MithrilController {

}

export function renderObjective(objective: level.Objective<any>): _mithril.MithrilTrustedString {
    return m.trust(objective.objective.replace(/\[(.*)\]/g, "<img src='$1'/>"));
}

export const Component: _mithril.MithrilComponent<ObjectivesController> = <any> {
    controller: function(): ObjectivesController {
        return {};
    },

    view: function<T>(controller: ObjectivesController, args: level.Objective<T>[]): any {
        return m("div#objectives", [
            m("h2", "Objectives"),
            m("ul", args.map(function(objective) {
                return m("li.objective" + (objective.completed ? ".completed" : ""), [
                    // CSS won't let us style an actual checkbox
                    m("span.checkbox" + (objective.completed ? ".checked" : "")),
                    m("span.description", renderObjective(objective)),
                ]);
            })),
        ]);
    }
}
