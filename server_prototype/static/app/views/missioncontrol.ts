interface MCController extends _mithril.MithrilController {

}

export const Component: _mithril.MithrilComponent<MCController> = <any> {
    controller: function(): MCController {
        return {};
    },

    view: function(controller: MCController, args: any): any {
        return m("div#objectives");
    }
}
