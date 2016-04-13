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

        this.missionTitle = "Raw Materials";
        this.missionText = [
            "It looks like this robot is going to kick the bucket soon. Before that happens, let's get some more iron to build a new one."
        ];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addClass("SmallRobot", asset.Robot.Red, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.moveBackward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.mine,
        ]);
        this.toolbox.addObject("smallRobot", "SmallRobot");

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
                objective: `Move the robot [${asset.Robot.Red}] back to base`,
                completed: false,
                predicate: (level) => {
                    return level.objectives[0].completed &&
                        level.robot.getX() === 17 && level.robot.getY() === 4;
                }
            },
        ];

        this.hierarchy = {
            name: "object",
            children: [
                {
                    name: "SmallRobot",
                    children: [],
                    methods: ["moveForward", "moveBackward", "turnRight", "mine"],
                    userMethods: ["temporaryLeft", "advance"]
                },
            ],
        };

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Toolbox, "Ugh, looks like loops are broken again. You'll have to make do for now."),
            ]
        ];

        this.setUpFading();
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("outside", "assets/maps/outside.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("robot", asset.Robot.Red);
        this.game.load.image("iron", asset.Iron.Basic);
    }

    create() {
        super.create();

        this.zoomCamera.position.x = 1000;

        let map = this.game.add.tilemap("outside");
        map.addTilesetImage("cave2", "tiles");

        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        let layer2 = map.createLayer(
            "Tile Layer 2", this.game.width, this.game.height, this.background);

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.initWorld(map);

        this.robot = new model.Robot("smallRobot", 17, 4, model.Direction.SOUTH,
                                     this.modelWorld, this.foreground, "robot");
        this.irons = [];
        this.irons.push(new model.Iron("iron", 17, 6,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 17, 7,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 17, 8,
                                   this.modelWorld, this.middle, "iron"));

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
    }
}
