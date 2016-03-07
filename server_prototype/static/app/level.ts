declare var Blockly: any;

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
    private map: string;
    private toolbox: Toolbox;

    constructor(test: typeof Level) {

    }
}

new Level(Level);
