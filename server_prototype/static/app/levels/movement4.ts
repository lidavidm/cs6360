import * as model from "model/model";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class MovementLevel4 extends BaseLevel {
    public robot: model.Robot;
    public gate: model.Gate;

    initialize() {
        super.initialize();

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
        ]);
        this.toolbox.addObject("robot", "Robot");

        this.toolbox.addClass("Gate", asset.Gate.Basic, model.Gate, [
            model.Gate.prototype.open,
        ]);
        this.toolbox.addObject("gate", "Gate");

        this.toolbox.addControl("controls_repeat_ext");
        this.toolbox.addNumber(0);

        this.objectives = [
            {
                objective: `Tell the gate [${asset.Gate.Basic}] to open`,
                completed: false,
                predicate: (level) => {
                    return level.gate.opened;
                }
            },
            {
                objective: `Tell the robot [${asset.Robot.Basic}] to move past the gate [${asset.Gate.Basic}]`,
                completed: false,
                predicate: (level) => {
                    return level.robot.getX() === 7 && level.robot.getY() === 8;
                }
            },
        ];

        this.missionTitle = "Escape!";

        this.missionText = [
            "Open the gate to get out of the cave!",
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Toolbox,
                    "Check the Gate's blueprint!"),
            ],
        ];
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("lava", "assets/maps/lava.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("robot", asset.Robot.Basic);
        this.game.load.image("gate", asset.Gate.Basic);
    }

    create() {
        // Create the world objects here.
        super.create();

        this.zoomCamera.position.x = 120;
        this.zoomCamera.position.y = 120;

        let map = this.game.add.tilemap("lava");
        map.addTilesetImage("cave2", "tiles");

        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        let layer2 = map.createLayer(
            "Tile Layer 2", this.game.width, this.game.height, this.background);

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.initWorld(map);
        this.robot = new model.Robot("robot", 7, 7, model.Direction.SOUTH   ,
                                     this.modelWorld, this.foreground, "robot");
        this.gate = new model.Gate("gate", 7, 8, this.modelWorld,
                                   this.foreground, "gate");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }
}
