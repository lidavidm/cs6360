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
        memoryUsage: string,
        onrun?: () => void,
        onruninvalid?: () => void,
        onrunmemory?: () => void,
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
            if (args.memoryUsage !== null) {
                cssClass = ".runMemory";
                text = "Over Memory Limit";
            }

            buttons.push(m(<any> ("button" + cssClass), {
                onclick: function() {
                    if (!args.valid) {
                        if (args.onruninvalid) {
                            args.onruninvalid();
                        }
                    }
                    else if (args.memoryUsage !== null) {
                        if (args.onrunmemory) {
                            args.onrunmemory();
                        }
                    }
                    else if (args.onrun) {
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
