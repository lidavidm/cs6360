declare var Blockly: any;

import PyPyJS = require("../execution/python");

import block_utils = require("../block_utils");
import level = require("../level");

interface EditorController extends _mithril.MithrilController {
    level: level.BaseLevel,
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
            level: null,
            workspace: null,
            changeListener: function(event: any) {
                var block = Blockly.Block.getById(event.blockId);
                if (block) {
                    typecheck(event, block);
                    updateObjectImage(event, block);

                    // TODO: refactor this into a method - perhaps even pass to level
                    if (block["type"].slice(0, 6) === "method") {
                        if (block.getParent()) {
                            if (block.comment) {
                                block.comment.setVisible(false);
                            }
                            block.setCommentText(null);
                        }
                        else {
                            block.setCommentText("This method is lonely! Help it with the tell block.");
                            block.comment.setVisible(true);
                        }
                    }
                }
                let code = Blockly.Python.workspaceToCode(controller.workspace);
                if (controller.level) {
                    controller.level.setCode(code);
                    console.log(code);
                }
            },
        };

        function typecheck(event: any, block: any) {
            if (block && block.parentBlock_) {
                var parent = block.parentBlock_;
                var result = block_utils.typecheckTell(parent);
                if (result) {
                    block.unplug(true);
                    alert(result.message);
                }
            }
        }

        function updateObjectImage(event: any, block: any) {
            if (block && block["type"] === "variables_get") {
                block.validate();
            }
        }

        return controller;
    },

    view: function(controller: EditorController, args: any) {
        controller.level = args.level;

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
                    }
                    else {
                        root.style.display = "block";
                    }

                    this.resizeBlockly();
                    return;
                }

                // TODO: rebind this when the level changes
                controller.level.event.on(level.BaseLevel.BLOCK_EXECUTED, (blockID) => {
                    // Enable trace so that block highlighting works -
                    // needs to be reset before each highlight call
                    // because Blockly resets it
                    controller.workspace.traceOn(true);
                    console.log(blockID);
                    controller.workspace.highlightBlock(blockID);
                });

                controller.workspace = Blockly.inject(element, {
                    toolbox: controller.level.toolbox.xml(),
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
