'use strict';

goog.provide('Blockly.Blocks.oop');

goog.require('Blockly.Blocks');
goog.require('Blockly.Python');

Blockly.Blocks.oop.faded = {};

Blockly.Blocks.oop.isFaded = function(block_name) {
    return Blockly.Blocks.oop.faded[block_name] === true;
};

Blockly.Blocks.oop.clearFaded = function() {
    Blockly.Blocks.oop.faded = {};
}

/**
 * The object hierarchy to use for typechecking. Should be a
 * dictionary of className: directParentClassName values.
 */
Blockly.Blocks.oop.hierarchy = {};
Blockly.Blocks.oop.setHierarchy = function(hierarchy) {
    var traverse = function(root, parent) {
        Blockly.Blocks.oop.hierarchy[root.name] = parent;
        if (root.children) {
            root.children.forEach(function(child) {
                traverse(child, root.name);
            });
        }
    };
    Blockly.Blocks.oop.hierarchy = {};
    if (!hierarchy) return;
    traverse(hierarchy, null);
    console.log(Blockly.Blocks.oop.hierarchy);
};

Blockly.Blocks.oop.getParentInHierarchy = function(className) {
    return Blockly.Blocks.oop.hierarchy[className] || null;
};

Blockly.Python.STATEMENT_PREFIX = "recordBlockBegin(%1)\n"
Blockly.Python.STATEMENT_POSTFIX = "recordBlockEnd(%1)\n"

Blockly.Blocks.classMethods = {};
Blockly.Blocks.userMethods = {};

Blockly.Blocks.addUserMethod = function(className, method) {
    // Method is a list [friendly name, name, (type info...)]
    if (!Blockly.Blocks.userMethods[className]) {
        Blockly.Blocks.userMethods[className] = {};
    }
    Blockly.Blocks.userMethods[className][method[0]] = method;
};

Blockly.Blocks.getUserMethods = function(className) {
    if (!Blockly.Blocks.userMethods[className]) {
        return [];
    }
    return Object.keys(Blockly.Blocks.userMethods[className])
        .sort()
        .map(function(methodName) {
            return Blockly.Blocks.userMethods[className][methodName];
        });
};

function getClass(block) {
    if (block["type"] === "variables_get") {
        return block.data;
    }
    else if (block["type"].slice(0, 6) === "method") {
        return block.getClassName();
    }
    else if (block["type"] === "math_number") {
        return "number";
    }
    else if (block["type"] === "logic_boolean") {
        return "bool";
    }
    else {
        return "object";
    }
}

Blockly.Blocks.setClassMethods = function(class_name, method_list) {
    var block_type = "method_" + class_name;
    Blockly.Blocks.classMethods[class_name] = method_list;
    Blockly.Blocks[block_type] = {
        init: function() {
            this.setColour(260);
            this.setOutput(true, "method");
            this.setInputsInline(true);
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown(function() {
                    return Blockly.Blocks.classMethods[class_name]
                        .concat(Blockly.Blocks.getUserMethods(class_name))
                        .sort();
                }), "METHOD_NAME");
            this.data = class_name;
        },

        onchange: function(event) {
            if (this.getSurroundParent()) {
                this.setWarningText(null);
            }
            else {
                this.setWarningText("Put me in a tell block!");
                if (this.warning) {
                    this.warning.setVisible(true);
                }
            }
        },

        getClassName: function() {
            return this.data;
        },
    };

    Blockly.Python[block_type] = function(block) {
        return ["raise BlocklyError('Method block can't be by itself!')", Blockly.Python.ORDER_ATOMIC];
    };
};

Blockly.Blocks.setClassObjects = function(classes) {
    var classList = classes.map(function(className) {
        return [className, className];
    });
    Blockly.Blocks["class"] = {
        init: function() {
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown(classList), "CLASS_NAME");
            this.setOutput(true, "class");
            this.setColour(330);
            this.setTooltip('');
            this.setHelpUrl('http://www.example.com/');
            this.svgPath_.style.fill = "url(#blueprintGrid)";
            this.svgPathLight_.style.stroke = "#007";
            this.svgPathDark_.style.stroke = "#007";
            this.svgPathDark_.style.fill = "#007";
        }
    };

    Blockly.Python["class"] = function(block) {
        var code = block.getFieldValue("CLASS_NAME");
        return [code, Blockly.Python.ORDER_ATOMIC];
    };
};

Blockly.Blocks["tell"] = {
    init: function() {
        var message = "tell %1 to %2";
        if (Blockly.Blocks.oop.isFaded("tell")) {
            message = "%1.%2()";
        }
        this.jsonInit({
            "id": "tell",
            "message0": message,
            "args0": [
                {
                    "type": "input_value",
                    "name": "OBJECT",
                    "check": [
                        "object",
                        "Boolean",
                        "Number",
                    ],
                },
                {
                    "type": "input_value",
                    "name": "METHOD",
                    "check": "method",
                }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120,
            "tooltip": "",
            "helpUrl": "http://www.example.com/"
        });
    },

    onchange: function(event) {
        var object = this.childObject();
        var method = this.childMethod();
        this.setWarningText(null, "typechecker");
        this.setWarningText(null, "argumentchecker");
        this.data = null;

        if (!object && !method) {
            this.setWarningText("I still need a method and an object!", "argumentchecker");
        }
        else if (!object) {
            this.setWarningText("I still need an object! Look at the toolbox.", "argumentchecker");
        }
        else if (!method) {
            this.setWarningText("I still need a method! Look at the blueprints on the left.", "argumentchecker");
        }
        else {
            var objectClass = getClass(object);
            var methodClass = getClass(method);
            var methodIsOnSupertype = false;

            var superClass = objectClass;
            while (superClass) {
                if (superClass === methodClass) {
                    methodIsOnSupertype = true;
                    break;
                }
                superClass = Blockly.Blocks.oop.getParentInHierarchy(superClass);
            }

            if (objectClass === methodClass || methodIsOnSupertype) {
                this.setWarningText(null, "typechecker");
            }
            else {
                this.setWarningText(objectClass + " doesn't understand " + method.getFieldValue("METHOD_NAME") + "!", "typechecker");
                m.startComputation();
                this.data = "type_error";
                m.endComputation();
            }
        }

        if (this.warning) {
            this.warning.setVisible(true);
        }
    },

    childObject: function() {
        return this.getInputTargetBlock("OBJECT");
    },

    childMethod: function() {
        return this.getInputTargetBlock("METHOD");
    },
};

Blockly.Blocks["new"] = {
  init: function() {
      if (Blockly.Blocks.oop.isFaded("new")) {
          this.appendDummyInput()
              .appendField(new Blockly.FieldTextInput(""), "NAME");
          this.appendValueInput("CLASS")
              .setCheck("class")
              .appendField("=");
          this.appendDummyInput()
              .appendField("()");
      }
      else {
          this.appendValueInput("CLASS")
              .setCheck("class")
              .appendField("create a new");
          this.appendDummyInput()
              .appendField("called")
              .appendField(new Blockly.FieldTextInput(""), "NAME");
      }

      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(120);
      this.setTooltip("");
      this.setHelpUrl("http://www.example.com/");
  },
};
