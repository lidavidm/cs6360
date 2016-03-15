import PubSub = require("pubsub");

interface ControlsController extends _mithril.MithrilController {
}

export const Component: _mithril.MithrilComponent<ControlsController> = <any> {
    controller: function(): ControlsController {
        return {};
    },

    view: function(controller: ControlsController, args: {
        executing: _mithril.MithrilProperty<boolean>,
        doneExecuting: _mithril.MithrilProperty<boolean>,
        onrun?: () => void,
        onreset?: () => void,
        onabort?: () => void,
        onpause?: () => void,
        onstep?: () => void,
    }): _mithril.MithrilVirtualElement<ControlsController> {
        let buttons: _mithril.MithrilVirtualElement<ControlsController>[] = [];
        if (!args.executing()) {
            // Mithril type definition seems to be off here
            buttons.push(m(<any> "button.run", {
                onclick: function() {
                    if (args.onrun) {
                        args.onrun();
                    }
                },
            }, "Run"));
        }
        else if (args.doneExecuting()) {
            buttons.push(m(<any> "button.abort", {
                onclick: function() {
                    if (args.onreset) {
                        args.onreset();
                    }
                },
            }, "Reset"));
        }
        else {
            buttons.push(m(<any> "button.abort", {
                onclick: function() {
                    if (args.onabort) {
                        args.onabort();
                    }
                },
            }, "Abort"));
            buttons.push(m(<any> "button.pause", {
                onclick: function() {
                    if (args.onpause) {
                        args.onpause();
                    }
                },
            }, "Pause"));
            buttons.push(m(<any> "button.step", {
                onclick: function() {
                    if (args.onstep) {
                        args.onstep();
                    }
                },
            }, "Step"));
        }
        return m("nav#gameControls", buttons);
    }
}
