import level = require("level");

interface CongratulationsController extends _mithril.MithrilController {
    loaded: _mithril.MithrilProperty<boolean>,
    registeredLoadEvent: _mithril.MithrilProperty<boolean>,
}

interface Args {
    level: level.BaseLevel,
    onContinue: () => void,
}

export const Component: _mithril.MithrilComponent<CongratulationsController> = <any> {
    controller: function(args: Args): CongratulationsController {
        let controller = Object.create(null);
        controller.loaded = m.prop(false);
        controller.registeredLoadEvent = m.prop(false);

        return controller;
    },

    view: function(controller: CongratulationsController, args: Args): any {
        if (args.level === null) {
            return m(<any> "div", {
                key: "congratulations",
            });
        }

        if (!controller.registeredLoadEvent()) {
            args.level.event.on(level.BaseLevel.NEXT_LEVEL_LOADED, () => {
                controller.loaded(true);
            })
        }

        let button: _mithril.MithrilVirtualElement<CongratulationsController> = null;
        if (controller.loaded()) {
            button = m(<any> "button.ui.right", {
                onclick: () => {
                    controller.loaded(false);
                    controller.registeredLoadEvent(false);
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
