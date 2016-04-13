import level = require("level");
import pubsub = require("pubsub");
import * as HierarchyView from "./hierarchy";
import {EditorContext, MAIN} from "model/editorcontext";

interface EditorController extends _mithril.MithrilController {
    level: level.BaseLevel,
    element: HTMLElement,
    workspace: any,
    editor: AceAjax.Editor,
    changeListener: (event: any) => void,
    codeListener: () => void,
    annotationListener: () => void,
    setupLevel: (blocks: EditorContext) => void,
    markReadonly: (context: EditorContext) => void,
    readonlyRange: AceAjax.Range,
    readonlyRangeId: number,
}

interface Args {
    event: pubsub.PubSub,
    level: level.BaseLevel,
    executing: _mithril.MithrilProperty<boolean>,
    showHierarchy: _mithril.MithrilProperty<boolean>,
    changeContext: (className: string, method: string) => void,
    context: EditorContext,
}


let Range: typeof AceAjax.Range = ace.require("ace/range").Range;

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
            editor: null,
            readonlyRange: null,
            readonlyRangeId: -1,

            changeListener: function(event: any) {
                controller.level.event.broadcast(
                    level.BaseLevel.WORKSPACE_UPDATED,
                    Blockly.Xml.workspaceToDom(controller.workspace));
                var block = Blockly.Block.getById(event.blockId);
                if (block) {
                    updateObjectImage(event, block);
                }

                updateUserObjects();
            },

            codeListener: function() {
                controller.level.event.broadcast(
                    level.BaseLevel.WORKSPACE_UPDATED,
                    controller.editor.getSession().getValue());
            },

            annotationListener: function() {
                let annotations = controller.editor.getSession().getAnnotations();
                m.startComputation();
                controller.level.program.flagInvalid(annotations.length > 0);
                m.endComputation();

                return true;
            },

            markReadonly: function(context: EditorContext) {
                if (controller.readonlyRange) {
                    controller.editor.getSession().removeMarker(controller.readonlyRangeId);
                }

                if (context.className === MAIN) {
                    let code = context.code;
                    let lines = code.split("\n");
                    let index = 0;
                    for (let line of lines) {
                        if (line.indexOf("Beginning of main code") > -1) {
                            break;
                        }
                        index++;
                    }
                    controller.readonlyRange = new Range(0, 0, index, 10000);
                }
                else {
                    controller.readonlyRange = new Range(0, 0, 2, 10000);
                    controller.readonlyRangeId =
                        controller.editor.getSession().addMarker(controller.readonlyRange, "readonly");
                }
            },

            setupLevel: setupLevel,
        };

        function updateUserObjects() {
            let blocks = controller.workspace.getAllBlocks();

            let objects: { [name: string]: string } = {};

            for (let block of blocks) {
                if (block["type"] == "new") {
                    let input = block.getInputTargetBlock("CLASS");
                    if (!input) continue;
                    if (!block.getFieldValue("NAME")) continue;
                    objects[block.getFieldValue("NAME")] = input.getFieldValue("CLASS_NAME");
                }
            }

            if (controller.level.toolbox.setUserObjects(objects)) {
                updateToolbox();
            }
        }

        // Workaround for issue #49
        function fixWorkspace() {
            controller.workspace.getAllBlocks().forEach(function(block: any) {
                block.setDisabled(false);
                try {
                    block.setEditable(true);
                }
                catch (e) {
                    // BlockSvg#setEditable seems to have a bug, but
                    // it doesn't affect the main purpose of this call
                }
                block.setMovable(true);
                block.setDeletable(true);
            });
        }

        args.event.on("runInvalid", () => {
            controller.workspace.getAllBlocks().forEach((block: any) => {
                if (block.warning) {
                    block.warning.setVisible(true);
                }
            });
        });

        args.event.on(level.BaseLevel.CONTEXT_CHANGED, (context: EditorContext) => {
            if (!controller.level.canUseBlockEditor(context) && !context.code) {
                let code = controller.level.program.getMethodCode(context.className, context.method);
                context.code = code;
            }

            if (context.code) {
                controller.level.program.flagInvalid(false);
            }
            else {
                updateUserObjects();
            }
            setupLevel(context);
        });

        function updateObjectImage(event: any, block: any) {
            if (block && block["type"] === "variables_get") {
                block.validate();
            }
        }

        function setupLevel(context: EditorContext) {
            if (context.code) {
                // TODO: if code-only, use fallback
                controller.editor.getSession().setValue(context.code);
                controller.markReadonly(context);
            }
            else {
                controller.workspace.dispose();
                controller.workspace = Blockly.inject(controller.element, {
                    toolbox: controller.level.toolbox.xml(),
                    trashcan: true,
                });
                updateToolbox(context.className);
                controller.workspace.clear();

                Blockly.Xml.domToWorkspace(
                    controller.workspace,
                    context.workspace || controller.level.fallbackWorkspace(context));
                fixWorkspace();
            }

            let lastBlockExecuted: any = null;

            controller.workspace.addChangeListener(controller.changeListener);

            // TODO: highlighting for code execution?
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
                    return;
                }
                if (controller.workspace.getBlockById(blockID)) {
                    lastBlockExecuted = blockID;
                }
            });

            // TODO: error reporting in code mode?
            controller.level.event.on(level.BaseLevel.BLOCK_ERROR, (err, blockID) => {
                if (lastBlockExecuted) {
                    let block = controller.workspace.getBlockById(lastBlockExecuted);
                    block.setWarningText(err, "execution_error");
                    if (block.warning) {
                        block.warning.setVisible(true);
                    }
                    return;
                }
                alert(err);
            });
        }

        let lastClassName: string = null;
        function updateToolbox(className?: string) {
            if (!className && lastClassName) {
                className = lastClassName;
            }
            lastClassName = className;
            let toolbox = controller.level.toolbox.xml();
            if (className !== MAIN) {
                toolbox = controller.level.toolbox.methodXml(className, controller.level.hierarchy);
            }
            controller.workspace.updateToolbox(toolbox);
        }

        args.event.on(level.BaseLevel.TOOLBOX_UPDATED, (className) => {
            updateToolbox(className);
        });

        args.event.on(level.BaseLevel.NEXT_LEVEL_LOADED, (nextLevel: level.BaseLevel, blocks: EditorContext) => {
            controller.level = nextLevel;
            // TODO: reset editor too
            controller.workspace.dispose();
            controller.workspace = Blockly.inject(controller.element, {
                toolbox: controller.level.toolbox.xml(),
                trashcan: true,
            });

            setupLevel(blocks);

            // Auto-open toolbox
            let toolbox = controller.workspace.toolbox_;
            if (toolbox.tree_ && toolbox.tree_.getChildren()[0]) {
                toolbox.tree_.getChildren()[0].select()
            }
        });

        return controller;
    },

    view: function(controller: EditorController, args: Args) {
        controller.level = args.level;

        // TODO: disable editor too
        if (controller.workspace) {
            controller.workspace.options.readOnly = args.executing();
        }

        // Cast to bool
        let usingCodeEditor = !!args.context.code;

        let header = [
            m("div.title", [
                m("span", "Editing: "),
                m("br"),
                m("code", args.context.className === MAIN ? "<main>" : `${args.context.className}.${args.context.method}`),
            ]),
        ];
        if (args.level.hierarchy !== null) {
            let disabledTitle = args.level.isCodeValid() ? null : "Fix code errors here first.";
            // We can't disable these two buttons, because the game
            // saves invalid code. When they return, they won't be
            // able to go and edit it.
            header.push(m(<any> "button.ui", {
                onclick: function() {
                    args.showHierarchy(true);
                },
                disabled: args.executing(),
            }, "Class Hierarchy"));
            if (args.context.className !== MAIN) {
                header.push(m(<any> "button.ui", {
                    onclick: function() {
                        args.changeContext(MAIN, "");
                    },
                    disabled: args.executing(),
                }, "Edit main"));
            }

            if (args.level.canUseCodeEditor(args.context) && !usingCodeEditor) {
                header.push(m(<any> "button.ui", {
                    onclick: function() {
                        if (window.confirm("You will not be able to convert back to blocks - are you sure?")) {
                            args.context.workspace = null;
                            if (args.context.className === MAIN) {
                                let code = controller.level.program.getMainCode();
                                args.context.code = code;
                            }
                            else {
                                let code = controller.level.program.getMethodCode(args.context.className, args.context.method);
                                args.context.code = code;
                            }
                            controller.editor.getSession().setValue(args.context.code);
                            controller.markReadonly(args.context);
                        }
                    },
                    title: disabledTitle,
                    disabled: !args.level.isCodeValid() || args.executing(),
                }, "Edit as code"));
            }
            else if (args.level.canUseBlockEditor(args.context) && usingCodeEditor) {
                header.push(m(<any> "button.ui", {
                    onclick: function() {
                        if (window.confirm("You will lose all the code here - are you sure?")) {
                            args.context.code = null;
                            args.context.workspace = controller.level.fallbackWorkspace(args.context);
                            controller.setupLevel(args.context);
                        }
                    },
                    disabled: args.executing(),
                }, "Edit as blocks"));
            }
        }

        let mode = ".blockly";
        if (usingCodeEditor || !args.level.canUseBlockEditor(args.context)) {
            mode = ".ace";
        }

        return m("div#editor" + mode, {
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

                    controller.setupLevel(args.context);

                    controller.workspace.addChangeListener(controller.changeListener);
                },
            }),
            m("div#codeWorkspace", {
                config: (element: HTMLElement, isInitialized: boolean) => {
                    if (isInitialized) {
                        return;
                    }

                    let editor = ace.edit(element);
                    controller.editor = editor;
                    editor.setOption("fontSize", "1rem");
                    editor.setTheme("ace/theme/monokai");
                    editor.getSession().setMode("ace/mode/python");
                    editor.getSession().on("change", controller.codeListener);
                    editor.getSession().on("changeAnnotation", controller.annotationListener);
                    editor.setOption("useWorker", true);
                    editor.setOption("dragEnabled", false);

                    controller.setupLevel(args.context);

                    // Based on http://stackoverflow.com/questions/24958589/
                    // Make the header uneditable
                    editor.keyBinding.addKeyboardHandler({
                        handleKeyboard: function(data: any, hash: number, keyString: any, keyCode: number, event: any): any {
                            // Let arrow keys through
                            if ((keyCode <= 40 && keyCode >= 37) || hash === -1) {
                                return false;
                            }

                            if (controller.readonlyRange &&
                                controller.readonlyRange.intersects(editor.getSelectionRange())) {
                                return {
                                    command: "null",
                                    passEvent: false,
                                };
                            }
                        }
                    });

                },
            }),
        ]);
    },

    resizeBlockly: function() {
        // https://groups.google.com/forum/#!topic/blockly/WE7x-HPh81A
        // According to above link, window resize event is needed for
        // Blockly to resize itself
        window.dispatchEvent(new Event("resize"));
    }
};
