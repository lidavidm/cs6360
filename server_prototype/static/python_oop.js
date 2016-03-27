'use strict';

goog.provide('Blockly.Python.oop');

goog.require('Blockly.Python');

Blockly.Python['method'] = function(block) {
    var code = block.getFieldValue('METHOD_NAME');
    return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['tell'] = function(block) {
    var object = Blockly.Python.valueToCode(block, "OBJECT", Blockly.Python.ORDER_NONE);
    var method = block.getInputTargetBlock("METHOD");
    var id = block.id;
    var excTemplate = function(msg) {
        return "raise BlocklyError('" + id + "', '" + msg + "')\n";
    }
    if (!object && !method) {
        return excTemplate("This block needs an object and a method!");
    }
    else if (!object) {
        return excTemplate("This block needs an object!");
    }
    else if (!method) {
        return excTemplate("This block needs a method!");
    }
    var method = method.getFieldValue("METHOD_NAME");
    var code = object + "." + method + "()\n";
    return code;
};

Blockly.Python["new"] = function(block) {
    var className = Blockly.Python.valueToCode(block, "CLASS", Blockly.Python.ORDER_NONE);
    var objectName = block.getFieldValue("NAME");
    return objectName + " = " + className + "()\n";
};
