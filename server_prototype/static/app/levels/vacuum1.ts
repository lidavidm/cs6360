import * as model from "../model/model";
import {BaseLevel, Toolbox} from "../level";
import * as TooltipView from "../views/tooltip";
import * as asset from "asset";

export class VacuumLevel1 extends BaseLevel {
    public modelWorld: model.World;
    public robot: model.Robot;
    public irons: model.Iron[];

    initialize() {
        super.initialize();

        this.missionTitle = "Vacuum 1";
        this.missionText = [
            "todo"
        ];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat_ext");
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.pickUpUnderneath,
            model.Robot.prototype.moveBackward,
        ]);
        this.toolbox.addObject("robot", "Robot");
        this.toolbox.addNumber();

        this.objectives = [
            {
                objective: "Collect 3 iron",
                completed: false,
                predicate: (level) => {
                    for (var iron of level.irons) {
                        if (!level.robot.holding(iron)) {
                            return false;
                        }
                    }
                    return true;
                }
            },
            {
                objective: `Move the robot [${asset.Robot.Basic}] back to base`,
                completed: false,
                predicate: (level) => {
                    return level.objectives[0].completed &&
                        level.robot.getX() === 1 && level.robot.getY() === 1;
                }
            },
        ];

        this.allTooltips = [[]];
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

        let map = this.game.add.tilemap("prototype");
        map.addTilesetImage("cave", "tiles");
        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.initWorld(map);

        this.robot = new model.Robot("robot", 1, 1, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");
        this.irons = [];
        this.irons.push(new model.Iron("iron", 3, 1,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 4, 1,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 5, 1,
                                   this.modelWorld, this.middle, "iron"));

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }
}
