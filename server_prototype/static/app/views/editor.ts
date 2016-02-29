declare var Blockly: any;

import PyPyJS = require("../execution/python");

interface EditorController extends _mithril.MithrilController {
    toolbox: _mithril.MithrilProperty<string>,
    workspace: any,
}

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

    render(workspace: any) {
        workspace.updateToolbox(this._tree.documentElement);
    }

    xml() {
        return this._tree.documentElement;
    }
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
                    ["make negative copy", "invert"],
                    ["make positive copy", "abs"],
                ]);

                controller.workspace = Blockly.inject(element, {
                    toolbox: toolbox.xml(),
                    trashcan: true,
                });

                controller.workspace.addChangeListener(function(event: any) {
                    var block = Blockly.Block.getById(event.blockId);
                    if (event.newParentId) {
                        var parent = Blockly.Block.getById(event.newParentId);
                        if (parent["type"] === "tell") {
                            if (parent.childBlocks_.length === 2) {
                                var child1 = parent.childBlocks_[0];
                                var child2 = parent.childBlocks_[1];
                                var object = (child1.type === "variables_get") ?
                                    child1 : child2;
                                var method = (child1.type === "variables_get") ?
                                    child2 : child1;
                                var class_name = object.inputList[0].fieldRow[0].value_;
                                var method_class = method.data;
                                // TODO: account for primitives (str/int)
                                if (class_name !== method_class) {
                                    alert("Class/method mismatch!");
                                    block.unplug(true, true);
                                }
                            }
                        }
                    }
                    // TODO: when a method block is created, update
                    // its method list
                    // TODO: when a method block or variable block is
                    // moved, check class compatibility
                    console.log(Blockly.Python.workspaceToCode(controller.workspace));
                });
            },
        });
    },
};
