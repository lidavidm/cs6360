import * as model from "model/model";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class MovementLevel4 extends BaseLevel {
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

        this.toolbox.addControl("controls_repeat_ext");
        this.toolbox.addNumber(4);

        this.objectives = [
            {
                objective: `Move the robot [${asset.Robot.Basic}] around the corner`,
                completed: false,
                predicate: (level) => {
                    return level.robot.getX() === 7 && level.robot.getY() === 8;
                }
            },
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Map,
                    "Use the arrow keys to look around the map and see what's going on."),
                new TooltipView.Tooltip(TooltipView.Region.Toolbox,
                    "Loops are back online! Try repeatedly telling the robot to move forward to the exit"),
            ],
        ];

        // They don't need to see the heirarchy for level 1
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
        this.robot = new model.Robot("robot", 7, 3, model.Direction.SOUTH   ,
                                     this.modelWorld, this.foreground, "robot");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }
}
