declare var Blockly: any;

import PyPyJS = require("../execution/python");

interface EditorController extends _mithril.MithrilController {
    toolbox: _mithril.MithrilProperty<string>,
    workspace: any,
}

/**
 * An abstraction of the Blockly toolbox, i.e. what blocks and
 * categories to show to the user.
 */
class Toolbox {
    private _tree: Document;

    constructor(toolbox?: string) {
        var _parser = new DOMParser();
        if (toolbox) {
            this._tree = _parser.parseFromString(toolbox, "text/xml");
        }
        else {
            this._tree = _parser.parseFromString("<xml></xml>", "text/xml");
        }
    }

    /**
     * Add the methods of a class to the toolbox.
     */
    addClass(className: string, methods: string[]) {
        let category = this._tree.createElement("category");
        let method_type = "method_" + className;
        category.setAttribute("name", "class " + className);
        category.setAttribute("class", "blueprint");

        for (let method of methods) {
            var block = this._tree.createElement("block");
            block.setAttribute("type", method_type);
            category.appendChild(block);
        }
        this._tree.documentElement.appendChild(category);
    }

    /**
     * Draw this toolbox into the given workspace.
     */
    render(workspace: any) {
        workspace.updateToolbox(this._tree.documentElement);
    }

    /**
     * Get the XML representation of this toolbox.
     */
    xml() {
        return this._tree.documentElement;
    }
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
        };

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

                // TODO: factor this into a set of classes
                Blockly.Blocks.setClassMethods("Robot", [
                    ["turn left", "turnLeft"],
                    ["move forward", "moveForward"],
                    ["self destruct", "selfDestruct"],
                ]);

                Blockly.Blocks.setClassMethods("number", [
                    ["make negative copy", "invert"],
                    ["make positive copy", "abs"],
                ]);

                var toolbox = new Toolbox(controller.toolbox());
                toolbox.addClass("number", [
                    "invert",
                    "abs",
                ]);

                controller.workspace = Blockly.inject(element, {
                    toolbox: toolbox.xml(),
                    trashcan: true,
                });

                controller.workspace.addChangeListener((event: any) => {
                    var block = Blockly.Block.getById(event.blockId);
                    if (block.parentBlock_) {
                        var parent = block.parentBlock_;
                        if (parent["type"] === "tell") {
                            let children = this.destructureTell(parent);
                            if (children.object && children.method) {
                                var childClass = this.getClass(children.object);
                                var methodClass = this.getClass(children.method);
                                if (childClass !== methodClass) {
                                    alert(`Class/method mismatch: ${childClass} vs ${methodClass}!`);
                                    block.unplug(true, true);
                                }
                            }
                        }
                    }
                    console.log(Blockly.Python.workspaceToCode(controller.workspace));
                });
            },
        });
    },

    // TODO: factor this into separate classes.
    /**
     * Determine the class of a variable or method block.
     */
    getClass: function(block: any): string {
        if (block["type"] === "variables_get") {
            return block.inputList[0].fieldRow[0].value_;
        }
        else if (block["type"] === "math_number") {
            return "number";
        }
        else if (block["type"].slice(0, 6) === "method") {
            return block.data;
        }
        return null;
    },

    /**
     * Given a `tell` block, return the object and method blocks
     * within.
     */
    destructureTell: function(tellBlock: any): {
        object: any,
        method: any,
    } {
        if (tellBlock.childBlocks_.length === 0) {
            return {
                object: null,
                method: null,
            };
        }
        else if (tellBlock.childBlocks_.length === 1) {
            let child = tellBlock.childBlocks_[0];
            if (child["type"].slice(0, 6) === "method") {
                return {
                    object: null,
                    method: child,
                };
            }
            else {
                return {
                    object: child,
                    method: null,
                };
            }
        }
        else {
            let child1 = tellBlock.childBlocks_[0];
            let child2 = tellBlock.childBlocks_[1];

            if (child1["type"].slice(0, 6) === "method") {
                return {
                    object: child2,
                    method: child1,
                };
            }
            else {
                 return {
                    object: child1,
                    method: child2,
                };
            }
        }
    }
};
