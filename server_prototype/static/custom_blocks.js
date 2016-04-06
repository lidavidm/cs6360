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
};

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
            if (this.svgPath_) {
                this.svgPath_.style.fill = "url(#blueprintGrid)";
                this.svgPathLight_.style.stroke = "#007";
                this.svgPathDark_.style.stroke = "#007";
                this.svgPathDark_.style.fill = "#007";
            }
        }
    };

    Blockly.Python["class"] = function(block) {
        var code = block.getFieldValue("CLASS_NAME");
        return [code, Blockly.Python.ORDER_ATOMIC];
    };
};

Blockly.Blocks["tell"] = {
    init: function() {
        var faded = Blockly.Blocks.oop.isFaded("tell");
        var message = "tell %1 to %2";
        if (faded) {
            message = "%1.%2(";
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
        if (faded) {
            this.appendDummyInput('RIGHT_PAREN').appendField(')');
        }
        this.setMutator(new Blockly.Mutator(['tell_arg', 'tell_return']));
        this.argCount_ = 0;
        this.returnCount_ = 0;
    },

    mutationToDom: function() {
        if (!this.argCount_ && !this.returnCount_) {
            return null;
        }
        var container = document.createElement('mutation');
        if (this.argCount_) {
            container.setAttribute('arg', this.argCount_);
        }
        if (this.returnCount_) {
            container.setAttribute('return', 1);
        }
        return container;
    },

    domToMutation: function(xmlElement) {
        this.argCount_ = parseInt(xmlElement.getAttribute('arg'), 10) || 0;
        this.returnCount_ = parseInt(xmlElement.getAttribute('return'), 10) || 0;
        var faded = Blockly.Blocks.oop.isFaded("tell");
        for (var i = 1; i <= this.argCount_; i++) {
            if (faded) {
                this.removeInput('RIGHT_PAREN');
            }
            var vi = this.appendValueInput('ARG' + i);
            vi.setCheck(["object", "Boolean", "Number"]);
            if (faded) {
                if (i != 1) {
                    vi.appendField(',');
                }
                this.appendDummyInput('RIGHT_PAREN').appendField(')');
            } else {
                if (i == 1) {
                    vi.appendField('with');
                }
            }
        }
        if (this.returnCount_) {
            this.appendDummyInput('RETURN');
        }
    },

    decompose: function(workspace) {
        var containerBlock = workspace.newBlock('tell_base');
        containerBlock.initSvg();
        var connection = containerBlock.nextConnection;
        for (var i = 1; i <= this.argCount_; i++) {
            var tellArgBlock = workspace.newBlock('tell_arg');
            tellArgBlock.initSvg();
            connection.connect(tellArgBlock.previousConnection);
            connection = tellArgBlock.nextConnection;
        }
        if (this.returnCount_) {
            var returnBlock = workspace.newBlock('tell_return');
            returnBlock.initSvg();
            connection.connect(returnBlock.previousConnection);
        }
        return containerBlock;
    },

    compose: function(containerBlock) {
        var faded = Blockly.Blocks.oop.isFaded("tell");

        if (this.returnCount_ > 0) {
            this.removeInput('RETURN');
            // this.setOutput(false);
            // this.setPreviousStatement(true, null);
            // this.setNextStatement(true, null);
        }
        this.returnCount_ = 0;

        for (var i = this.argCount_; i > 0; i--) {
            this.removeInput('ARG' + i);
        }
        this.argCount_ = 0;
        var returnsValue = false;
        // Rebuild the block's optional inputs.
        var clauseBlock = containerBlock.nextConnection.targetBlock();
        while (clauseBlock) {
            switch (clauseBlock.type) {
                case 'tell_arg':
                    this.argCount_++;
                    if (faded) {
                        this.removeInput('RIGHT_PAREN');
                    }
                    var argInput = this.appendValueInput('ARG' + this.argCount_);
                    argInput.setCheck(['object', 'Boolean', 'Number']);
                    if (faded) {
                        if (this.argCount_ != 1) {
                            argInput.appendField(',');
                        }
                        this.appendDummyInput('RIGHT_PAREN').appendField(')');
                    } else {
                        if (this.argCount_ == 1) {
                            argInput.appendField('with');
                        }
                    }
                    // Reconnect any child blocks.
                    if (clauseBlock.valueConnection_) {
                        argInput.connection.connect(clauseBlock.valueConnection_);
                    }
                    break;
                case 'tell_return':
                    this.returnCount_++;
                    var returnInput = this.appendDummyInput('RETURN');
                    // this.unplug();
                    // this.setPreviousStatement(false);
                    // this.setNextStatement(false);
                    // this.setOutput(true, 'Boolean');
                    break;
                default:
                    throw 'Unknown block type.';
            }
            clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
        }
    },

    saveConnections: function(containerBlock) {
        var clauseBlock = containerBlock.nextConnection.targetBlock();
        var i = 1;
        while (clauseBlock) {
            switch (clauseBlock.type) {
                case 'tell_arg':
                    var argInput = this.getInput('ARG' + i);
                    clauseBlock.valueConnection_ = argInput && argInput.connection.targetConnection;
                    i++;
                    break;
                case 'tell_return':
                    break;
                default:
                    throw 'Unknown block type.';
            }
            clauseBlock = clauseBlock.nextConnection && clauseBlock.nextConnection.targetBlock();
        }
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
    }
};

/**
* tell_base, tell_arg, and tell_return are the blocks that
* appear in the mutator dialogue for the tell block
*/
Blockly.Blocks['tell_base'] = {
    init: function() {
        this.setColour(120);
        this.appendDummyInput().appendField('tell');
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};

Blockly.Blocks['tell_arg'] = {
    init: function() {
        this.setColour(120);
        this.appendDummyInput()
            .appendField('argument');
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.contextMenu = false;
    }
};

Blockly.Blocks['tell_return'] = {
    init: function() {
        this.setColour(120);
        this.appendDummyInput()
            .appendField('return');
        this.setPreviousStatement(true);
        this.setNextStatement(false);
        this.contextMenu = false;
    }
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

Blockly.Blocks['while'] = {
  init: function() {
    this.setColour(Blockly.Blocks.logic.HUE);
    var vi = this.appendValueInput('WHILE');
    vi.setCheck('Boolean');
    var faded = Blockly.Blocks.oop.isFaded("while");
    if (faded) {
      vi.appendField('while');
      this.appendDummyInput().appendField(":");
    } else {
      vi.appendField('repeat while');
    }

    var si = this.appendStatementInput('DO');
    if (!faded) {
      si.appendField(Blockly.Msg.CONTROLS_WHILEUNTIL_INPUT_DO);
    }

    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  }
};
