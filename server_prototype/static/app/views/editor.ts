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
    onunload: () => void,
    numBlocks: _mithril.MithrilProperty<number>,
    context: EditorContext,
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
            numBlocks: m.prop(0),
            context: null,

            onunload: function() {
                if (controller.workspace) {
                    controller.workspace.dispose();
                }
                if (controller.editor) {
                    controller.editor.destroy();
                }
            },

            changeListener: function(event: any) {
                controller.numBlocks(controller.workspace.getAllBlocks().length);
                controller.level.event.broadcast(
                    level.BaseLevel.WORKSPACE_UPDATED,
                    Blockly.Xml.workspaceToDom(controller.workspace));
                var block = Blockly.Block.getById(event.blockId);
                if (block) {
                    updateObjectImage(event, block);
                }

                for (let block of controller.workspace.getAllBlocks()) {
                    if (block.warning) {
                        block.warning.setVisible(true);
                        break;
                    }
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

                let code = context.code;
                let lines = code.split("\n");
                if (context.className === MAIN) {
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
                    let end = 10000;
                    for (let line of lines) {
                        if (line.indexOf(":") > -1) {
                            end = line.indexOf(":") + 1;
                        }
                    }
                    controller.readonlyRange = new Range(0, 0, 2, end);
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
                let code = controller.level.program.getMethodCode(context.className, context.method, true);
                context.code = code;
            }

            if (context.code) {
                controller.level.program.flagInvalid(false);
            }
            else {
                updateUserObjects();
            }
            setupLevel(context);

            // Flash title when context changed
            window.setTimeout(() => {
                document.querySelector("#editor .title").classList.add("blink");
                window.setTimeout(() => {
                    document.querySelector("#editor .title").classList.remove("blink");
                }, 1000);
            }, 500);
        });

        function updateObjectImage(event: any, block: any) {
            if (block && block["type"] === "variables_get") {
                block.validate();
            }
        }

        function setupLevel(context: EditorContext) {
            controller.context = context;
            if (context.code) {
                if (!controller.editor) return;
                controller.editor.getSession().setValue(context.code);
                controller.markReadonly(context);
            }
            else if (!controller.level.canUseBlockEditor(context)) {
                if (context.className === MAIN) {
                    if (controller.level.program.globals.length === 0) {
                        controller.level.program.event.on("globals_defined", () => {
                            setupLevel(context);
                        });
                        return;
                    }
                    else {
                        context.code = controller.level.program.getMainCode();
                    }
                }
                else {
                    context.code = controller.level.program.getMethodCode(context.className, context.method, true);
                }
                setupLevel(context);
                return;
            }
            else {
                controller.workspace.dispose();
                controller.workspace = Blockly.inject(controller.element, {
                    toolbox: controller.level.toolbox.xml(),
                    trashcan: true,
                    startScale: 1.5,
                    grid: {
                        spacing: 20,
                        length: 2,
                        colour: "#777",
                        snap: true,
                    },
                });
                updateToolbox();
                controller.workspace.clear();

                Blockly.Xml.domToWorkspace(
                    controller.workspace,
                    context.workspace || controller.level.fallbackWorkspace(context));
                fixWorkspace();
                controller.numBlocks(controller.workspace.getAllBlocks().length);
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

        function updateToolbox() {
            let toolbox = controller.level.toolbox.xml();
            if (controller.context.className !== MAIN) {
                toolbox = controller.level.toolbox.methodXml(controller.context, controller.level.hierarchy);
            }
            controller.workspace.updateToolbox(toolbox);
        }

        args.event.on(level.BaseLevel.TOOLBOX_UPDATED, () => {
            updateToolbox();
        });

        args.event.on(level.BaseLevel.NEXT_LEVEL_LOADED, (nextLevel: level.BaseLevel, blocks: EditorContext) => {
            controller.level = nextLevel;
            controller.numBlocks(0);
            // TODO: reset editor too
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
        let usingCodeEditor = !!args.context.code || !controller.level.canUseBlockEditor(args.context);

        let header = [
            m("div.title", [
                m("span", "Editing: "),
                args.context.className === MAIN ? null : m("img", {
                    src: Blockly.Blocks.variables.CLASS_IMAGE(args.context.className),
                }),
                m("code", args.context.className === MAIN ? "<main>" : `${args.context.className}.${args.context.method}`),
            ]),
        ];
        if (args.level.hierarchy !== null) {
            let disabledTitle = args.level.isCodeValid() ? null : "Fix code errors here first.";
            // We can't disable these two buttons, because the game
            // saves invalid code. When they return, they won't be
            // able to go and edit it.
            header.unshift(m(<any> "button.ui", {
                onclick: function() {
                    args.showHierarchy(true);
                },
                disabled: args.executing(),
            }, "Class Hierarchy"));
            if (args.context.className !== MAIN) {
                header.unshift(m(<any> "button.ui", {
                    onclick: function() {
                        args.changeContext(MAIN, "");
                    },
                    disabled: args.executing(),
                }, "Edit main"));
            }

            if (args.level.canUseCodeEditor(args.context) && !usingCodeEditor) {
                header.unshift(m(<any> "button.ui", {
                    onclick: function() {
                        if (window.confirm("You will not be able to convert back to blocks - are you sure?")) {
                            args.context.workspace = null;
                            if (args.context.className === MAIN) {
                                let code = controller.level.program.getMainCode();
                                args.context.code = code;
                            }
                            else {
                                let code = controller.level.program.getMethodCode(args.context.className, args.context.method, true);
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
                header.unshift(m(<any> "button.ui", {
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

        if (mode === ".blockly") {
            let limit = args.level.blockLimit(args.context);
            if (limit !== null) {
                let percent = Math.min(100, Math.ceil(100 * controller.numBlocks() / limit));
                let color = controller.numBlocks() > limit ? "orange" : "green";
                let bg = `linear-gradient(to right, ${color} ${percent}%, black ${percent + 1}%, black 100%)`;

                header.push(m("div#memoryBar", {
                    key: "memoryBar",
                    style: {
                        background: bg,
                    },
                }, [
                    m("strong", "Memory Used: "),
                    m("span.use", controller.numBlocks()),
                    "/",
                    m("span.limit", limit.toString()),
                    " blocks",
                ]));
            }
            else {
                header.push(m("div#memoryBar", {
                    key: "memoryBar",
                }, [
                    m("strong", "Unlimited Memory"),
                ]));
            }
        }

        return m("div#editor" + mode, {
            class: args.executing() ? "executing" : "",
        }, [
            m("header", {
                key: "editorHeader",
                class: args.context.className === MAIN ? "" : "blueprint",
            }, header),
            m("div#workspace", {
                config: (element: HTMLElement, isInitialized: boolean) => {
                    controller.element = element;
                    if (isInitialized) {
                        return;
                    }

                    controller.workspace = Blockly.inject(element, {
                        toolbox: controller.level.toolbox.xml(),
                        trashcan: true,
                        startScale: 1.5,
                    });
                    Blockly.Css.setTypeIndicatorColours("#CF3", "#FC3", "#FC3");

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
                                // Allow enter key at end so that if
                                // the body is deleted, they can still
                                // edit it
                                let sr = editor.getSelectionRange();
                                let rr = controller.readonlyRange.end;
                                let selectionIsOneChar = sr.start.row === sr.end.row && sr.start.column === sr.end.column;
                                if (selectionIsOneChar && keyCode === 13 && sr.end.row === rr.row && sr.end.column === rr.column) return;
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
};
