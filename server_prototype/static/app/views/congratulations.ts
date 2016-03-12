import level = require("level");

interface CongratulationsController extends _mithril.MithrilController {

}

export const Component: _mithril.MithrilComponent<CongratulationsController> = <any> {
    controller: function(): CongratulationsController {
        return {};
    },

    view: function(controller: CongratulationsController, args: level.BaseLevel): any {
        return m("div#congratulationsContainer", m("div#congratulations", [
            m("h2", "Success"),
            m("ul", args.objectives.map(function(objective) {
                return m("li", [
                    // CSS won't let us style an actual checkbox
                    m("span.checkbox.checked"),
                    objective.objective,
                ]);
            })),
            m("button.ui[disabled].right.loading", "Loading…"),
            m(".clearfix"),
        ]));
    }
}
