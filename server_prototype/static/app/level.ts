declare var Blockly: any;

import TooltipView = require("./views/tooltip");

export interface Objectives {
    [objective: string]: boolean,
}

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
    private _tooltips: TooltipView.Tooltip[][];
    private _tooltipIndex: number;
    private _objectives: Objectives;

    constructor() {
        let initialToolbox = document.getElementById("toolbox").textContent;
        this._toolbox = new Toolbox(initialToolbox);

        this._objectives = {
            "Move the robot to the iron": false,
            "Take the iron": false,
            "Move the robot back to base": false,
        };
    }

    public objectives(): Objectives {
        return this._objectives;
    }

    public toolbox(): Toolbox {
        return this._toolbox;
    }

    public setTooltips(tooltips: TooltipView.Tooltip[][]) {
        this._tooltips = tooltips;
        this._tooltipIndex = 0;
    }

    public tooltips(): TooltipView.Tooltip[] {
        return this._tooltips[this._tooltipIndex];
    }

    public nextTooltips() {
        this._tooltipIndex = (this._tooltipIndex + 1) % this._tooltips.length;
    }

    public addClass(classObject: any) {
        Blockly.Blocks.setClassMethods("Robot", [
            ["turn left", "turnLeft"],
            ["move forward", "moveForward"],
            ["pick up object underneath", "pickUpUnder"],
        ]);
        this._toolbox.addClass("Robot", "assets/sprites/robot_3Dblue.png", [
            "turnLeft",
            "moveForward",
            "pickUpUnder",
        ]);
        // TODO: broadcast event indicating toolbox has been updated
    }

    public removeClass() {

    }
}
