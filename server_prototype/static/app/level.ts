declare var Blockly: any;

import TooltipView = require("views/tooltip");
import PubSub = require("pubsub");

export interface Objective<T> {
    objective: string,
    completed: boolean,
    predicate: (level: T) => boolean,
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
    addClass(className: string, image: string, classObject: any) {
        let methods: [string, string][] = [];
        Object.getOwnPropertyNames(classObject.prototype)
            .sort()
            .forEach(function(property) {
                let method = classObject.prototype[property];
                if (method.friendlyName) {
                    methods.push([method.friendlyName, method.funcName]);
                }
            });
        Blockly.Blocks.variables.addClass(className, image);
        Blockly.Blocks.setClassMethods(className, methods);

        // TODO: broadcast event indicating toolbox has been updated

        let category = this._tree.createElement("category");
        let method_type = "method_" + className;
        category.setAttribute("name", "class " + className);
        category.setAttribute("class", "blueprint");

        for (let method of methods) {
            let block = this._tree.createElement("block");
            block.setAttribute("type", method_type);
            let methodName = this._tree.createElement("field");
            methodName.setAttribute("name", "METHOD_NAME");
            methodName.textContent = method[1];
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

import Camera = require("camera");
export class BaseLevel extends Phaser.State {
    private classes: any[];

    public event: PubSub.PubSub;

    public objectives: Objective<this>[];
    public toolbox: Toolbox;

    protected allTooltips: TooltipView.Tooltip[][];
    private _tooltipIndex: number;

    protected cursors: any;
    protected zoomCamera: Camera.ZoomCamera;

    protected background: Phaser.Group;
    protected middle: Phaser.Group;
    protected foreground: Phaser.Group;

    protected code: string;

    /**
     * The event that should be fired if objectives are updated.
     */
    public static OBJECTIVES_UPDATED = "objectivesUpdated";
    public static NEXT_LEVEL_LOADED = "nextLevelLoaded";

    constructor() {
        super();

        this._tooltipIndex = 0;
        this.objectives = [];
        this.event = new PubSub.PubSub();

        this.init();
    }

    init() {

    }

    preload() {
        this.game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
    }

    create() {
        this.zoomCamera = new Camera.ZoomCamera(this.game);
        this.background = this.game.add.group(this.zoomCamera.group);
        this.middle = this.game.add.group(this.zoomCamera.group);
        this.foreground = this.game.add.group(this.zoomCamera.group);
    }

    update() {
        if (!this.game.input.activePointer.withinGame) return;

        if (this.cursors.up.isDown) {
            this.zoomCamera.position.y -= 4;
        }
        else if (this.cursors.down.isDown) {
            this.zoomCamera.position.y += 4;
        }
        else if (this.cursors.left.isDown) {
            this.zoomCamera.position.x -= 4;
        }
        else if (this.cursors.right.isDown) {
            this.zoomCamera.position.x += 4;
        }

        this.zoomCamera.update();
    }

    render() {
    }

    isComplete(): boolean {
        for (let objective of this.objectives) {
            if (!objective.completed) {
                return false;
            }
        }
        return true;
    }

    nextTooltips() {
        this._tooltipIndex =
            (this._tooltipIndex + 1) % this.allTooltips.length;
    }

    setCode(code: string) {
        this.code = code;
    }

    tooltips(): TooltipView.Tooltip[] {
        return this.allTooltips[this._tooltipIndex];
    }

    run() {
        this.zoom(true);
    }

    zoom(zoomed: boolean) {
        if (zoomed) {
            this.zoomCamera.scale.set(2, 2);
        }
        else {
            this.zoomCamera.scale.set(1, 1);
        }
    }

    nextLevel(): BaseLevel {
        return this;
    }
}

import model = require("model/model");
