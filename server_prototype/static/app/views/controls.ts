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
        paused: _mithril.MithrilProperty<boolean>,
        valid: boolean,
        onrun?: () => void,
        onruninvalid?: () => void,
        onreset?: () => void,
        onabort?: () => void,
        onpause?: () => void,
        onstep?: () => void,
    }): _mithril.MithrilVirtualElement<ControlsController> {
        let buttons: _mithril.MithrilVirtualElement<ControlsController>[] = [];
        if (args.doneExecuting()) {
            buttons.push(m(<any> "button.reset", {
                onclick: function() {
                    if (args.onreset) {
                        args.onreset();
                    }
                },
            }, "Reset"));
        }
        else if (!args.executing()) {
            let cssClass = args.valid ? ".run" : ".runInvalid";
            let text = args.valid ? "Run" : "Invalid Code";
            buttons.push(m(<any> ("button" + cssClass), {
                onclick: function() {
                    if (!args.valid) {
                        if (args.onruninvalid) {
                            args.onruninvalid();
                        }
                        return;
                    };

                    if (args.onrun) {
                        args.onrun();
                    }
                },
            }, text));
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
            }, args.paused() ? "Resume" : "Pause"));
            buttons.push(m(<any> "button.step", {
                onclick: function() {
                    if (args.onstep) {
                        args.onstep();
                    }
                },
                disabled: !args.paused(),
            }, "Step"));
        }
        return m("nav#gameControls", buttons);
    }
}
