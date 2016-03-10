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
    _region: Region;
    _message: string;
    _visible: boolean;

    constructor(region: Region, message: string) {
        this._region = region;
        this._message = message;
        this._visible = true;
    }

    visible() {
        return this._visible;
    }

    toggle() {
        this._visible = !this._visible;
    }

    hide() {
        this._visible = false;
    }
}

// TODO: have this just be DOM manipulation instead?
export const Component: _mithril.MithrilComponent<TooltipController> = <any> {
    controller: function(): TooltipController {
        return {};
    },

    view: function(
        controller: TooltipController,
        tooltips: Tooltip[]
    ): any {
        return m("div", tooltips.map((tooltip: Tooltip) => {
            if (!tooltip.visible()) return null;
            return m("div.tooltip." + Region[tooltip._region].toLowerCase(),
                     [
                         tooltip._message,
                         m(<any> "button", {
                             onclick: () => {
                                 tooltip.toggle();
                             }
                         }, "×"),
                     ]);
        }));
    }
}
