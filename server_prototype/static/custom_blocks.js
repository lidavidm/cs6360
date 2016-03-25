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

Blockly.Blocks["tell"] = {
    init: function() {
        var message = "tell %1 to %2";
        if (Blockly.Blocks.oop.isFaded("tell")) {
            message = "%1.(%2)";
        }
        this.jsonInit({
            "id": "tell",
            "message0": message,
            "args0": [
                {
                    "type": "input_value",
                    "name": "OBJECT"
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
        var children = this.getChildren();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child["type"] === "math_number" || child["type"] === "variables_get") {
                return child;
            }
        }
        return null;
    },

    childMethod: function() {
        var children = this.getChildren();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child["type"].slice(0, 6) === "method") {
                return child;
            }
        }
        return null;
    },
}
