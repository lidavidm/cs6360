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
export class BaseLevel extends Phaser.State {
    private classes: any[];

    public event: PubSub.PubSub;

    public objectives: Objective[];
    public toolbox: Toolbox;

    protected allTooltips: TooltipView.Tooltip[][];
    private _tooltipIndex: number;

    protected cursors: any;
    protected zoomCamera: Camera.ZoomCamera;

    protected background: Phaser.Group;
    protected middle: Phaser.Group;
    protected foreground: Phaser.Group;

    /**
     * The event that should be fired if objectives are updated.
     */
    public static OBJECTIVES_UPDATED = "objectivesUpdated";

    constructor() {
        super();

        this._tooltipIndex = 0;
        this.objectives = [];
        this.event = new PubSub.PubSub();

        this.init();
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

    // TODO: move this to toolbox
    addClass(classObject: any) {
        Blockly.Blocks.setClassMethods("Robot", [
            ["turn left", "turnLeft"],
            ["move forward", "moveForward"],
            ["pick up object underneath", "pickUpUnder"],
        ]);
        this.toolbox.addClass("Robot", "assets/sprites/robot_3Dblue.png", [
            "turnLeft",
            "moveForward",
            "pickUpUnder",
        ]);
        // TODO: broadcast event indicating toolbox has been updated
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

    tooltips(): TooltipView.Tooltip[] {
        return this.allTooltips[this._tooltipIndex];
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

export class AlphaLevel extends BaseLevel {
    init() {
        super.init();

        let initialToolbox = document.getElementById("toolbox").textContent;
        this.toolbox = new Toolbox(initialToolbox);

        this.objectives = [
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

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Map, "Use the arrow keys to look around the map and see what's going on."),
                new TooltipView.Tooltip(TooltipView.Region.Objectives, "Here's what Mission Control said to do."),
                new TooltipView.Tooltip(TooltipView.Region.Controls, "Load your code onto the robot and run it."),
                new TooltipView.Tooltip(TooltipView.Region.Toolbox, "Pick blocks from here…"),
                new TooltipView.Tooltip(TooltipView.Region.Workspace, "…and drop them here to control the robot."),
            ]
        ];
    }

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
