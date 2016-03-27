declare var Blockly: any;

import block_utils = require("block_utils");
import level = require("level");
import pubsub = require("pubsub");
import * as HierarchyView from "./hierarchy";

interface EditorController extends _mithril.MithrilController {
    level: level.BaseLevel,
    element: HTMLElement,
    workspace: any,
    changeListener: (event: any) => void,
    setupLevel: (blocks?: HTMLElement) => void,
}

/**
 * The editor component, which handles interactions with Blockly.
 */
// The Mithril type definition is incomplete and doesn't handle
// the args parameter to view(), so we cast to `any` to satisfy the typechecker.
export const Component: _mithril.MithrilComponent<EditorController> = <any> {
    controller: function(args: {
        event: pubsub.PubSub,
    }): EditorController {
        var controller: EditorController = {
            level: null,
            element: null,
            workspace: null,
            changeListener: function(event: any) {
                controller.level.event.broadcast(
                    level.BaseLevel.WORKSPACE_UPDATED,
                    Blockly.Xml.workspaceToDom(controller.workspace));
                var block = Blockly.Block.getById(event.blockId);
                if (block) {
                    typecheck(event, block);
                    updateObjectImage(event, block);
                }
                let code = Blockly.Python.workspaceToCode(controller.workspace);
                if (controller.level) {
                    m.startComputation();
                    controller.level.setCode(code);
                    console.log(code);
                    m.endComputation();
                }
            },

            setupLevel: setupLevel,
        };

        args.event.on("runInvalid", () => {
            controller.workspace.getAllBlocks().forEach((block: any) => {
                if (block.warning) {
                    block.warning.setVisible(true);
                }
            });
        });

        function typecheck(event: any, block: any) {
            if (block && block.parentBlock_) {
                var parent = block.getParent();
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

        function setupLevel(blocks: HTMLElement) {
            controller.workspace.clear();
            controller.workspace.updateToolbox(controller.level.toolbox.xml());
            if (blocks) {
                Blockly.Xml.domToWorkspace(controller.workspace, blocks);
            }

            controller.level.event.on(level.BaseLevel.BLOCK_EXECUTED, (blockID) => {
                // Enable trace so that block highlighting works -
                // needs to be reset before each highlight call
                // because Blockly resets it
                controller.workspace.traceOn(true);
                controller.workspace.highlightBlock(blockID);
            });
        }

        args.event.on(level.BaseLevel.NEXT_LEVEL_LOADED, (nextLevel: level.BaseLevel, blocks: HTMLElement) => {
            controller.level = nextLevel;
            controller.workspace.dispose();
            controller.workspace = Blockly.inject(controller.element, {
                toolbox: controller.level.toolbox.xml(),
                trashcan: true,
            });

            controller.workspace.addChangeListener(controller.changeListener);

            setupLevel(blocks);
        });

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
                controller.element = element;
                if (isInitialized) {
                    this.resizeBlockly();
                    return;
                }

                controller.workspace = Blockly.inject(element, {
                    toolbox: controller.level.toolbox.xml(),
                    trashcan: true,
                });

                controller.setupLevel(args.savegame.load());

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
