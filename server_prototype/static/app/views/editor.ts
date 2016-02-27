declare var Blockly: any;

import PyPyJS = require("../execution/python");

interface EditorController extends _mithril.MithrilController {
    toolbox: _mithril.MithrilProperty<_mithril.MithrilVirtualElement<EditorController>>,
    workspace: any,
}

// The Mithril type definition is incomplete and doesn't handle
// the args parameter to view().
export const Component: _mithril.MithrilComponent<EditorController> = <any> {
    controller: function(): EditorController {
        var controller: EditorController = {
            toolbox: m.prop(document.getElementById("toolbox").textContent),
            workspace: null,
        };

        return controller;
    },

    view: function(controller: EditorController, args: any) {
        if (controller.workspace) {
            controller.workspace.options.readOnly = args.executing();
        }
        return m("div#editor", {
            class: args.executing() ? "executing" : "",
            config: function(element: HTMLElement, isInitialized: boolean) {
                if (isInitialized) {
                    // https://groups.google.com/forum/#!topic/blockly/WE7x-HPh81A
                    // According to above link, window resize event is
                    // needed for Blockly to resize itself
                    window.dispatchEvent(new Event("resize"));

                    // Hide the toolbox if we're running code
                    var root =
                        <HTMLElement> document.querySelector(".blocklyTreeRoot");
                    if (args.executing()) {
                        root.style.display = "none";

                        // var interpreter = new PyPyJS.Interpreter("print 'hello, world!'");
                        // interpreter.run();
                    }
                    else {
                        root.style.display = "block";
                    }
                    return;
                }

                controller.workspace = Blockly.inject(element, {
                    toolbox: controller.toolbox(),
                    trashcan: true,
                });

                controller.workspace.addChangeListener(function() {
                    console.log(Blockly.Python.workspaceToCode(controller.workspace));
                });
            },
        });
    },
};
