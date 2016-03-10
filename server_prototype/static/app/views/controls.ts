import PubSub = require("pubsub");

interface ControlsController extends _mithril.MithrilController {
}

export const Component: _mithril.MithrilComponent<ControlsController> = <any> {
    controller: function(): ControlsController {
        return {};
    },

    view: function(controller: ControlsController, args: {
        executing: _mithril.MithrilProperty<boolean>,
        scale: _mithril.MithrilProperty<boolean>,
        onrun?: () => void,
        onabort?: () => void,
        onpause?: () => void,
        onstep?: () => void,
    }): _mithril.MithrilVirtualElement<ControlsController> {
        let buttons: _mithril.MithrilVirtualElement<ControlsController>[] = [];
        if (!args.executing()) {
            // Mithril type definition seems to be off here
            buttons.push(m(<any> "button.run", {
                onclick: function() {
                    args.executing(!args.executing());
                    args.scale(args.executing());

                    if (args.onrun) {
                        args.onrun();
                    }
                },
            }, "Run"));
        }
        else {
            buttons.push(m(<any> "button.abort", {
                onclick: function() {
                    args.executing(!args.executing());
                    args.scale(args.executing());

                    if (args.onabort) {
                        args.onabort();
                    }
                },
            }, "Abort"));
            buttons.push(m(<any> "button.pause", {
                onclick: function() {
                    args.executing(!args.executing());
                    args.scale(args.executing());

                    if (args.onpause) {
                        args.onpause();
                    }
                },
            }, "Pause"));
            buttons.push(m(<any> "button.step", {
                onclick: function() {
                    args.executing(!args.executing());
                    args.scale(args.executing());

                    if (args.onstep) {
                        args.onstep();
                    }
                },
            }, "Step"));
        }
        return m("nav#gameControls", buttons);
    }
}
