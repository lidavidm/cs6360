interface ControlsController extends _mithril.MithrilController {
}

export const Component: _mithril.MithrilComponent<ControlsController> = <any> {
    controller: function(): ControlsController {
        return {};
    },

    view: function(controller: ControlsController, args: {
        executing: _mithril.MithrilProperty<boolean>,
        scale: _mithril.MithrilProperty<boolean>,
    }): _mithril.MithrilVirtualElement<ControlsController> {
        let buttons: _mithril.MithrilVirtualElement<ControlsController>[] = [];
        if (!args.executing()) {
            // Mithril type definition seems to be off here
            buttons.push(m(<any> "button.run", {
                onclick: function() {
                    args.executing(!args.executing());
                    args.scale(args.executing());
                },
            }, "Run"));
        }
        else {
            buttons.push(m(<any> "button.abort", {
                onclick: function() {
                    args.executing(!args.executing());
                    args.scale(args.executing());
                },
            }, "Abort"));
            buttons.push(m(<any> "button.pause", {
                onclick: function() {
                    args.executing(!args.executing());
                    args.scale(args.executing());
                },
            }, "Pause"));
            buttons.push(m(<any> "button.step", {
                onclick: function() {
                    args.executing(!args.executing());
                    args.scale(args.executing());
                },
            }, "Step"));
        }
        return m("nav#gameControls", buttons);
    }
}
