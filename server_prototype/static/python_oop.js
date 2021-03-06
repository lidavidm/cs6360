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
    //var argCount = block.argCount_ || 0;
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

    if (block.data === "type_error") {
        return excTemplate("Type error!");
    }

    var objectClass = getClass(this.childObject());
    var methodClass = getClass(this.childMethod());
    var methodIsOnSupertype = false;

    var superClass = objectClass;
    while (superClass) {
        if (superClass === methodClass) {
            methodIsOnSupertype = true;
            break;
        }
        superClass = Blockly.Blocks.oop.getParentInHierarchy(superClass);
    }

    if (objectClass !== methodClass && !methodIsOnSupertype) {
        return excTemplate("Type error!");
    }

    // TODO: code generation for provided arguments
    var method = method.getFieldValue("METHOD_NAME");
    var code = object + "." + method + "(";
    for (var i = 1; i <= block.argCount_; i++) {
        var arg = Blockly.Python.valueToCode(block, 'ARG' + i, Blockly.Python.ORDER_NONE);
        if (i != 1) {
            code = code + ", ";
        }
        code = code + arg;
    }
    code = code + ")\n";
    return code;
};

Blockly.Python["new"] = function(block) {
    var origName = block.getFieldValue("NAME");
    var objectName = Blockly.Python.variableDB_.getName(
        origName, Blockly.Variables.NAME_TYPE);
    var className = Blockly.Python.valueToCode(block, "CLASS", Blockly.Python.ORDER_NONE);
    if (!block.getFieldValue("NAME") || !className) {
        return "raise BlocklyError('" + block.id + "', 'No object or class in instantiation!')\n";
    }
    var prefix = "";
    if (Blockly.Python.STATEMENT_PREFIX) {
        var recordDuplicate = "recordDuplicateObject('" + block.id + "', '" + objectName + "')\n";
        var recordHasValue = "recordDuplicateValue('" + block.id + "', '" + objectName + "')\n";
        prefix = "try:\n    " + objectName + "\n    if type(" + objectName + ") == type:\n        " + recordHasValue + "    else:\n        " + recordDuplicate + "except NameError:\n    pass\n";
    }
    return prefix + objectName + " = " + className + "()\n";
};
