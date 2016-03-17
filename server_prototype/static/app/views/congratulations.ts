import level = require("level");
import pubsub = require("pubsub");

interface CongratulationsController extends _mithril.MithrilController {
    loaded: _mithril.MithrilProperty<boolean>,
}

interface Args {
    level: level.BaseLevel,
    event: pubsub.PubSub,
    onContinue: () => void,
}

export const Component: _mithril.MithrilComponent<CongratulationsController> = <any> {
    controller: function(args: Args): CongratulationsController {
        let controller = Object.create(null);
        controller.loaded = m.prop(false);

        args.event.on(level.BaseLevel.NEXT_LEVEL_LOADED, () => {
            controller.loaded(true);
        });

        return controller;
    },

    view: function(controller: CongratulationsController, args: Args): any {
        if (args.level === null) {
            return m(<any> "div", {
                key: "congratulations",
            });
        }

        let button: _mithril.MithrilVirtualElement<CongratulationsController> = null;
        if (controller.loaded()) {
            button = m(<any> "button.ui.right", {
                onclick: () => {
                    controller.loaded(false);
                    args.onContinue();
                }
            }, "Continue");
        }
        else {
            button = m("button.ui[disabled].right.loading", "Loading…");
        }

        return m(<any> "div#congratulationsContainer", {
            key: "congratulations",
        }, m("div#congratulations", [
            m("h2", "Success"),
            m("ul", args.level.objectives.map(function(objective) {
                return m("li", [
                    // CSS won't let us style an actual checkbox
                    m("span.checkbox.checked"),
                    objective.objective,
                ]);
            })),
            button,
            m(".clearfix"),
        ]));
    }
}
