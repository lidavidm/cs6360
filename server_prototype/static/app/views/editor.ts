declare var Blockly: any;

import block_utils = require("block_utils");
import level = require("level");
import pubsub = require("pubsub");
import * as HierarchyView from "./hierarchy";
import {EditorContext, MAIN} from "model/editorcontext";

interface EditorController extends _mithril.MithrilController {
    level: level.BaseLevel,
    element: HTMLElement,
    workspace: any,
    changeListener: (event: any) => void,
    setupLevel: (blocks?: HTMLElement) => void,
}

interface Args {
    event: pubsub.PubSub,
    level: level.BaseLevel,
    executing: _mithril.MithrilProperty<boolean>,
    showHierarchy: _mithril.MithrilProperty<boolean>,
    changeContext: (className: string, method: string) => void,
    context: EditorContext,
}

/**
 * The editor component, which handles interactions with Blockly.
 */
// The Mithril type definition is incomplete and doesn't handle
// the args parameter to view(), so we cast to `any` to satisfy the typechecker.
export const Component: _mithril.MithrilComponent<EditorController> = <any> {
    controller: function(args: Args): EditorController {
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

        args.event.on(level.BaseLevel.CONTEXT_CHANGED, (context: EditorContext) => {
            controller.workspace.clear();
            Blockly.Xml.domToWorkspace(controller.workspace, context.workspace);
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
                try {
                    controller.workspace.highlightBlock(blockID);
                }
                catch (e) {
                    // We use headless workspaces for codegen. The
                    // block IDs there do not exist here, and the
                    // block is a headless block, so highlighting it
                    // raises an exception. We catch that here so the
                    // code will execute. For code highlighting, we
                    // must make sure that we're always looking at
                    // main() when executing.
                }
            });
        }

        args.event.on(level.BaseLevel.TOOLBOX_UPDATED, () => {
            controller.workspace.updateToolbox(controller.level.toolbox.xml());
        });

        args.event.on(level.BaseLevel.NEXT_LEVEL_LOADED, (nextLevel: level.BaseLevel, blocks: EditorContext) => {
            controller.level = nextLevel;
            controller.workspace.dispose();
            controller.workspace = Blockly.inject(controller.element, {
                toolbox: controller.level.toolbox.xml(),
                trashcan: true,
            });

            controller.workspace.addChangeListener(controller.changeListener);

            setupLevel(blocks.workspace);
        });

        return controller;
    },

    view: function(controller: EditorController, args: Args) {
        controller.level = args.level;

        if (controller.workspace) {
            controller.workspace.options.readOnly = args.executing();
        }

        let header = [
            "Editing ",
            m("code", args.context.className === MAIN ? "<main>" : `${args.context.className}.${args.context.method}`),
        ];
        if (args.level.hierarchy !== null) {
            let disabledText = args.level.isCodeValid() ? "" : "—fix code errors first";
            header.push(m(<any> "button", {
                onclick: function() {
                    args.showHierarchy(true);
                },
                disabled: !args.level.isCodeValid(),
            }, "Object Hierarchy" + disabledText));
            if (args.context.className !== MAIN) {
                header.push(m(<any> "button", {
                    onclick: function() {
                        if (args.level.isCodeValid()) {
                            args.changeContext(MAIN, "");
                        }
                        else {
                            // TODO:
                            alert("Code is invalid - fix the code before changing what you're editing!");
                        }
                    },
                    disabled: !args.level.isCodeValid(),
                }, "Edit main" + disabledText));
            }
        }

        return m("div#editor", {
            class: args.executing() ? "executing" : "",
        }, [
            m("header", header),
            m("div#workspace", {
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

                    controller.setupLevel(args.context.workspace);

                    controller.workspace.addChangeListener(controller.changeListener);
                },
            })
        ]);
    },

    resizeBlockly: function() {
        // https://groups.google.com/forum/#!topic/blockly/WE7x-HPh81A
        // According to above link, window resize event is needed for
        // Blockly to resize itself
        window.dispatchEvent(new Event("resize"));
    }
};
