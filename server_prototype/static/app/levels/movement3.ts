import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class MovementLevel3 extends BaseLevel {
    public robot: model.Robot;
    public gate: model.Gate;

    initialize() {
        super.initialize();

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
        ]);
        this.toolbox.addObject("robot", "Robot");

        this.toolbox.addControl("controls_repeat");

        this.objectives = [
            {
                objective: `Tell the robot [${asset.Robot.Basic}] to turn right`,
                completed: false,
                predicate: (level) => {
                    return level.robot.orientation == model.Direction.SOUTH;
                }
            },
            {
                objective: `Move the robot [${asset.Robot.Basic}] in front of the gate [${asset.Gate.Basic}]`,
                completed: false,
                predicate: (level) => {
                    return level.robot.getX() === 7 && level.robot.getY() === 7;
                }
            },
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Toolbox,
                    "Check the robot's blueprint for a function to get around that corner."),
            ],
        ];

        this.missionTitle = "Turn of Events";

        this.missionText = [
            "We've uploaded turn functions! They should help with that corner!"
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
        this.zoomCamera.position.y = 100;

        let map = this.game.add.tilemap("lava");
        map.addTilesetImage("cave2", "tiles");

        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        let layer2 = map.createLayer(
            "Tile Layer 2", this.game.width, this.game.height, this.background);

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.initWorld(map);
        this.robot = new model.Robot("robot", 7, 2, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");
        this.gate = new model.Gate("gate", 7, 8, this.modelWorld,
                                    this.foreground, "gate");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    blockLimit(context: EditorContext): number {
        return 7;
    }
}
