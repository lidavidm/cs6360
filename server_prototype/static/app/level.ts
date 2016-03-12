declare var Blockly: any;

import TooltipView = require("views/tooltip");
import PubSub = require("pubsub");

export interface Objective {
    objective: string,
    completed: boolean,
    // predicate: (level: Level): boolean,
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

import Camera = require("camera");
export class BaseState extends Phaser.State {
    public level: Level;

    protected cursors: any;
    protected zoomCamera: Camera.ZoomCamera;

    protected background: Phaser.Group;
    protected middle: Phaser.Group;
    protected foreground: Phaser.Group;

    constructor(level: Level) {
        super();

        this.level = level;
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

    zoom(zoomed: boolean) {
        if (zoomed) {
            this.zoomCamera.scale.set(2, 2);
        }
        else {
            this.zoomCamera.scale.set(1, 1);
        }
    }
}

export class StateAlpha extends BaseState {
    preload() {
        super.preload();

        this.game.load.tilemap("prototype", "assets/maps/prototype.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("tiles", "assets/tilesets/cave.png");
        this.game.load.image("robot", "assets/sprites/robot_3Dblue.png");
        this.game.load.image("iron", "assets/sprites/iron.png");
    }

    create() {
        super.create();

        var map = this.game.add.tilemap("prototype");
        map.addTilesetImage("cave", "tiles");
        var layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        var robot = this.foreground.create(16, 16, "robot");
        robot.width = robot.height = 16;

        var iron = this.foreground.create(80, 16, "iron");

        this.cursors = this.game.input.keyboard.createCursorKeys();
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
    private _objectives: Objective[];

    public event: PubSub.PubSub;

    /**
     * The event that should be fired if objectives are updated.
     */
    public static OBJECTIVES_UPDATED = "objectivesUpdated";

    constructor() {
        this.event = new PubSub.PubSub();

        let initialToolbox = document.getElementById("toolbox").textContent;
        this._toolbox = new Toolbox(initialToolbox);

        this._objectives = [
            {
                objective: "Move the robot to the iron",
                completed: false,
            },
            {
                objective: "Take the iron",
                completed: false,
            },
            {
                objective: "Move the robot back to base",
                completed: false,
            },
        ];
    }

    public isComplete(): boolean {
        for (let objective of this._objectives) {
            if (!objective.completed) {
                return false;
            }
        }
        return true;
    }

    public setObjectives(objectives: Objective[]) {
        this._objectives = objectives;
    }

    public objectives(): Objective[] {
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
