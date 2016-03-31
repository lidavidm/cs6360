import * as model from "model/model";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class MovementLevel3 extends BaseLevel {
    public robot: model.Robot;

    initialize() {
        super.initialize();

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
        ]);
        this.toolbox.addObject("robot", "Robot");

        this.objectives = [
            {
                objective: `Move the robot [${asset.Robot.Basic}] around the corner`,
                completed: false,
                predicate: (level) => {
                    return level.robot.getX() === 7 && level.robot.getY() === 3;
                }
            },
        ];

        this.allTooltips = [
            [
                // new TooltipView.Tooltip(TooltipView.Region.Controls,
                //     "Load your code onto the robot and run it."),
                new TooltipView.Tooltip(TooltipView.Region.Toolbox,
                    "Check the robot's blueprint for a function to get around that corner."),
                // new TooltipView.Tooltip(TooltipView.Region.Workspace,
                //     "Right click and select duplicate to copy a command."),
            ],
        ];

        // They daon't need to see the heirarchy for level 1
        // this.hierarchy = {
        //     name: "object",
        //     children: [
        //         {
        //             name: "Robot",
        //             children: [],
        //             methods: ["moveForward", "turnRight"],
        //         },
        //     ],
        // };
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("movement1", "assets/maps/movement1.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("robot", asset.Robot.Basic);
    }

    create() {
        // Create the world objects here.
        super.create();

        let map = this.game.add.tilemap("movement1");
        map.addTilesetImage("cave2", "tiles");

        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        let layer2 = map.createLayer(
            "Tile Layer 2", this.game.width, this.game.height, this.background);

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.initWorld(map);
        this.robot = new model.Robot("robot", 6, 2, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }
}
