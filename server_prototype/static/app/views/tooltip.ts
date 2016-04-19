// Copyright 2016 David Li, Michael Mauer, Andy Jiang

// This file is part of Tell Me to Survive.

// Tell Me to Survive is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Tell Me to Survive is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with Tell Me to Survive.  If not, see <http://www.gnu.org/licenses/>.

interface TooltipController extends _mithril.MithrilController {

}

export enum Region {
    Map,
    Controls,
    Toolbox,
    Workspace,
    Objectives,
    ButtonBar,
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
