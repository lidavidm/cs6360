import * as model from "../model/model";
import {BaseLevel, Toolbox} from "../level";
import * as TooltipView from "../views/tooltip";
import * as python from "../execution/python";

export class BasicsLevel2 extends BaseLevel {
    public robot: model.Robot;
    public iron: model.Iron;

    init() {
        super.init();

        this.toolbox = new Toolbox(false);
        this.toolbox.addControl("tell");
        this.toolbox.addClass("Robot", "assets/sprites/robot_3Dblue.png", model.Robot);
        this.toolbox.addObject("robot", "Robot");

        this.objectives = [
            {
                objective: "Move the robot forward one more time",
                completed: false,
                predicate: (level) => {
                    return level.robot.getX() === 3 && level.robot.getY() === 1;
                }
            },
            {
                objective: "Move the robot all the way to the iron.",
                completed: false,
                predicate: (level) => {
                    return level.robot.getX() === 5 && level.robot.getY() === 1;
                }
            },
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Objectives, "Here's what Mission Control said to do."),
                new TooltipView.Tooltip(TooltipView.Region.Workspace, "Right click a block and select duplicate to copy it.")
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
        // Create the world objects here.
        super.create();

        let map = this.game.add.tilemap("prototype");
        map.addTilesetImage("cave", "tiles");
        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.initWorld(map);
        this.robot = new model.Robot("robot", 2, 1, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");
        this.iron = new model.Iron("iron", 5, 1,
                                   this.modelWorld, this.middle, "iron");

        this.modelWorld.log.recordInitEnd();

        this.interpreter = new python.Interpreter("", this.modelWorld, this.toolbox);
        this.interpreter.instantiateAll();
    }
}
