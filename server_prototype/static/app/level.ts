declare var Blockly: any;

import TooltipView = require("./views/tooltip");

// m.prop(document.getElementById("toolbox").textContent)
// var toolbox = new Toolbox(controller.toolbox());
// toolbox.addClass("Robot", "assets/sprites/robot_3Dblue.png", [
//     "turnLeft",
//     "moveForward",
// ]);
// Blockly.Blocks.setClassMethods("Robot", [
//     ["turn left", "turnLeft"],
//     ["move forward", "moveForward"],
//     ["pick up object underneath", "pickUpUnder"],
// ]);


/**
 * An abstraction of the Blockly toolbox, i.e. what blocks and
 * categories to show to the user.
 */
export class Toolbox {
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

    /**
     * Add the methods of a class to the toolbox.
     */
    addClass(className: string, image: string, methods: string[]) {
        Blockly.Blocks.variables.addClass(className, image);

        let category = this._tree.createElement("category");
        let method_type = "method_" + className;
        category.setAttribute("name", "class " + className);
        category.setAttribute("class", "blueprint");

        for (let method of methods) {
            let block = this._tree.createElement("block");
            block.setAttribute("type", method_type);
            let methodName = this._tree.createElement("field");
            methodName.setAttribute("name", "METHOD_NAME");
            methodName.textContent = method;
            block.appendChild(methodName);
            category.appendChild(block);
        }
        this._tree.documentElement.appendChild(category);
    }

    /**
     * Draw this toolbox into the given workspace.
     */
    render(workspace: any) {
        workspace.updateToolbox(this._tree.documentElement);
    }

    /**
     * Get the XML representation of this toolbox.
     */
    xml() {
        return this._tree.documentElement;
    }
}

/**
 *
 */
export class Level {
    private _map: string;
    private _toolbox: Toolbox;
    private _classes: any;
    private _tooltips: TooltipView.Tooltip[];

    constructor(test: typeof Level) {

    }

    public toolbox(): Toolbox {
        return this._toolbox;
    }

    public addClass(classObject: any) {
        this._toolbox.addClass();
        Blockly.Blocks.setClassMethods();
        // TODO: broadcast event indicating toolbox has been updated
    }
}

new Level(Level);
