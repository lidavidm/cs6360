'use strict';

goog.provide('Blockly.Python.oop');

goog.require('Blockly.Python');

Blockly.Python['method'] = function(block) {
    var code = block.getFieldValue('METHOD_NAME');
    return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['tell'] = function(block) {
    var object = Blockly.Python.valueToCode(block, "OBJECT", Blockly.Python.ORDER_NONE) || 'None';
    var method = Blockly.Python.valueToCode(block, "METHOD", Blockly.Python.ORDER_NONE) || 'id';
    var code = object + "." + method + "()";
    return code;
};
