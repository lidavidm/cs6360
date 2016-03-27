'use strict';

goog.provide('Blockly.Blocks.oop');

goog.require('Blockly.Blocks');
goog.require('Blockly.Python');

Blockly.Blocks.oop.faded = {};

Blockly.Blocks.oop.isFaded = function(block_name) {
    return Blockly.Blocks.oop.faded[block_name] === true;
};

Blockly.Python.STATEMENT_PREFIX = "recordBlockBegin(%1)\n"
Blockly.Python.STATEMENT_POSTFIX = "recordBlockEnd(%1)\n"

Blockly.Blocks.setClassMethods = function(class_name, method_list) {
    var block_type = "method_" + class_name;
    Blockly.Blocks[block_type] = {
        init: function() {
            this.setColour(260);
            this.setOutput(true, "method");
            this.setInputsInline(true);
            this.appendDummyInput()
                .appendField(new Blockly.FieldDropdown(method_list),
                             "METHOD_NAME");
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
        }
    };

    Blockly.Python[block_type] = function(block) {
        var code = block.getFieldValue("METHOD_NAME");
        return [code, Blockly.Python.ORDER_ATOMIC];
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

        if (!object && !method) {
            this.setWarningText("I still need a method and an object!");
        }
        else if (!object) {
            this.setWarningText("I still need an object! Look at the toolbox.");
        }
        else if (!method) {
            this.setWarningText("I still need a method! Look at the blueprints in the toolbox.");
        }
        else {
            this.setWarningText(null);
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
