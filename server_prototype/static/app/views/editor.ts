declare var Blockly: any;

import PyPyJS = require("../execution/python");

import block_utils = require("../block_utils");

interface EditorController extends _mithril.MithrilController {
    toolbox: _mithril.MithrilProperty<string>,
    workspace: any,
    changeListener: (event: any) => void,
}

/**
 * The editor component, which handles interactions with Blockly.
 */
// The Mithril type definition is incomplete and doesn't handle
// the args parameter to view(), so we cast to `any` to satisfy the typechecker.
export const Component: _mithril.MithrilComponent<EditorController> = <any> {
    controller: function(): EditorController {
        var controller: EditorController = {
            toolbox: m.prop(document.getElementById("toolbox").textContent),
            workspace: null,
            changeListener: function(event: any) {
                var block = Blockly.Block.getById(event.blockId);
                typecheck(event, block);
                updateObjectImage(event, block);
                console.log(Blockly.Python.workspaceToCode(controller.workspace));
            },
        };

        function typecheck(event: any, block: any) {
            if (block.parentBlock_) {
                var parent = block.parentBlock_;
                var result = block_utils.typecheckTell(parent);
                if (result) {
                    block.unplug(true);
                    alert(result.message);
                }
            }
        }

        function updateObjectImage(event: any, block: any) {
            if (block["type"] === "variables_get") {
                block.validate();
            }
        }

        return controller;
    },

    view: function(controller: EditorController, args: any) {
        if (controller.workspace) {
            controller.workspace.options.readOnly = args.executing();
        }
        return m("div#editor", {
            class: args.executing() ? "executing" : "",
            config: (element: HTMLElement, isInitialized: boolean) => {
                if (isInitialized) {
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

                    this.resizeBlockly();
                    return;
                }

                // TODO: factor this into a set of classes
                Blockly.Blocks.setClassMethods("Robot", [
                    ["turn left", "turnLeft"],
                    ["move forward", "moveForward"],
                    ["pick up object underneath", "pickUpUnder"],
                ]);

                var toolbox = new Toolbox(controller.toolbox());
                toolbox.addClass("Robot", "assets/sprites/robot_3Dblue.png", [
                    "turnLeft",
                    "moveForward",
                ]);

                controller.workspace = Blockly.inject(element, {
                    toolbox: toolbox.xml(),
                    trashcan: true,
                });

                controller.workspace.addChangeListener(controller.changeListener);
            },
        });
    },

    resizeBlockly: function() {
        // https://groups.google.com/forum/#!topic/blockly/WE7x-HPh81A
        // According to above link, window resize event is needed for
        // Blockly to resize itself
        window.dispatchEvent(new Event("resize"));
    }
};
