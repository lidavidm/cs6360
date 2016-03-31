/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Variable blocks for Blockly.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

goog.provide('Blockly.Blocks.variables');

goog.require('Blockly.Blocks');


/**
 * Common HSV hue for all blocks in this category.
 */
Blockly.Blocks.variables.HUE = 330;

/**
 * The list of possible classes that a variable can take on.
 */
Blockly.Blocks.variables.CLASS_LIST = {
  "object": {
    name: "object",
    image: "https://www.gstatic.com/codesite/ph/images/star_on.gif",
  }
};

Blockly.Blocks.variables.addClass = function(className, image) {
  Blockly.Blocks.variables.CLASS_LIST[className] = {
    name: className,
    image: image,
  };
};

/**
 * Generate the list of possible classes that a variable can take on,
 * for the dropdown of a variables_get block.
 */
Blockly.Blocks.variables.CLASSES = function() {
  return Object.keys(Blockly.Blocks.variables.CLASS_LIST).sort().map(function(key) {
    return [Blockly.Blocks.variables.CLASS_LIST[key].name, key];
  });
};

/**
 * The image for the class.
 */
Blockly.Blocks.variables.CLASS_IMAGE = function(className) {
  var classRecord = Blockly.Blocks.variables.CLASS_LIST[className];
  if (classRecord && classRecord.image) {
    return classRecord.image;
  }

  return "https://www.gstatic.com/codesite/ph/images/star_on.gif";
};


Blockly.Blocks['variables_get'] = {
  /**
   * Block for variable getter.
   * @this Blockly.Block
   */
  init: function() {
    this.setHelpUrl(Blockly.Msg.VARIABLES_GET_HELPURL);
    this.setColour(Blockly.Blocks.variables.HUE);
    this.setInputsInline(true);
    this.data = "object";
    this.appendDummyInput()
        .appendField(
            new Blockly.FieldImage(
              Blockly.Blocks.variables.CLASS_IMAGE(this.data), 15, 15, "*"),
          "CLASS_IMAGE")
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable(
        Blockly.Msg.VARIABLES_DEFAULT_NAME), 'VAR');
    this.setOutput(true, "object");
    this.setTooltip(Blockly.Msg.VARIABLES_GET_TOOLTIP);
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_GET_CREATE_SET;
  },
  /**
   * Update the class image of this block.
   * @this Blockly.Block
   */
  validate: function() {
    var block_class = this.data;
    var image = this.getField("CLASS_IMAGE");
    var image_src = Blockly.Blocks.variables.CLASS_IMAGE(block_class);
    image.setValue(image_src);
  },
  contextMenuType_: 'variables_set',
  /**
   * Add menu option to create getter/setter block for this setter/getter.
   * @param {!Array} options List of menu options to add to.
   * @this Blockly.Block
   */
  customContextMenu: function(options) {
    // var option = {enabled: true};
    // var name = this.getFieldValue('VAR');
    // option.text = this.contextMenuMsg_.replace('%1', name);
    // var xmlField = goog.dom.createDom('field', null, name);
    // xmlField.setAttribute('name', 'VAR');
    // var xmlBlock = goog.dom.createDom('block', null, xmlField);
    // xmlBlock.setAttribute('type', this.contextMenuType_);
    // option.callback = Blockly.ContextMenu.callbackFactory(this, xmlBlock);
    // options.push(option);
  }
};

Blockly.Blocks['variables_set'] = {
  /**
   * Block for variable setter.
   * @this Blockly.Block
   */
  init: function() {
    this.jsonInit({
      "message0": Blockly.Msg.VARIABLES_SET,
      "args0": [
        {
          "type": "field_variable",
          "name": "VAR",
          "variable": Blockly.Msg.VARIABLES_DEFAULT_NAME
        },
        {
          "type": "input_value",
          "name": "VALUE"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": Blockly.Blocks.variables.HUE,
      "tooltip": Blockly.Msg.VARIABLES_SET_TOOLTIP,
      "helpUrl": Blockly.Msg.VARIABLES_SET_HELPURL
    });
    this.contextMenuMsg_ = Blockly.Msg.VARIABLES_SET_CREATE_GET;
  },
  /**
   * Return all variables referenced by this block.
   * @return {!Array.<string>} List of variable names.
   * @this Blockly.Block
   */
  getVars: function() {
    return [this.getFieldValue('VAR')];
  },
  /**
   * Notification that a variable is renaming.
   * If the name matches one of this block's variables, rename it.
   * @param {string} oldName Previous name of variable.
   * @param {string} newName Renamed variable.
   * @this Blockly.Block
   */
  renameVar: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
      this.setFieldValue(newName, 'VAR');
    }
  },
  contextMenuType_: 'variables_get',
  customContextMenu: Blockly.Blocks['variables_get'].customContextMenu
};
