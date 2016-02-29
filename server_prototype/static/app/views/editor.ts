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

                // TODO: factor this into a set of classes
                Blockly.Blocks.setClassMethods("Robot", [
                    ["turn left", "turnLeft"],
                    ["move forward", "moveForward"],
                    ["self destruct", "selfDestruct"],
                ]);

                Blockly.Blocks.setClassMethods("number", [
                    ["invert", "invert"],
                ]);

                var parser = new DOMParser();
                var toolbox = parser.parseFromString(controller.toolbox(), "text/xml");
                var category = toolbox.createElement("category");
                category.setAttribute("name", "class number");
                category.setAttribute("class", "blueprint");
                var block = toolbox.createElement("block");
                block.setAttribute("type", "method_number");
                category.appendChild(block);
                toolbox.documentElement.appendChild(category);
                console.log(toolbox);

                controller.workspace = Blockly.inject(element, {
                    toolbox: toolbox.documentElement,
                    trashcan: true,
                });

                controller.workspace.addChangeListener(function(event) {
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
