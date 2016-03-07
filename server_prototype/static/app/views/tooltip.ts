interface TooltipController extends _mithril.MithrilController {

}

export enum Region {
    Map,
    Controls,
    Toolbox,
    Workspace,
    Objectives,
}

export class Tooltip {
    region: Region;
    message: string;

    constructor(region: Region, message: string) {
        this.region = region;
        this.message = message;
    }
}

// TODO: have this just be DOM manipulation instead?
export const Component: _mithril.MithrilComponent<TooltipController> = <any> {
    controller: function(): TooltipController {
        return {};
    },

    view: function(
        controller: TooltipController,
        args: _mithril.MithrilProperty<Tooltip[]>
    ): any {
        return m("div", args().map((tooltip: Tooltip) => {
            return m("div.tooltip." + Region[tooltip.region].toLowerCase(),
                     tooltip.message);
        }));
    }
}
