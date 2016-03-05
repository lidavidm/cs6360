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
        return m("nav#gameControls", [
            // Mithril type definition seems to be off here
            m(<any> "button", {
                onclick: function() {
                    args.executing(!args.executing());
                    args.scale(args.executing());
                },
            }, "Run"),
        ]);
    }
}
