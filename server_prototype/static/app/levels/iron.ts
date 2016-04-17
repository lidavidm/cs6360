import * as model from "../model/model";
import {BaseLevel, Toolbox} from "../level";
import * as TooltipView from "../views/tooltip";
import * as asset from "asset";

export class IronLevel extends BaseLevel {
    public modelWorld: model.World;
    public robot: model.MineRobot;
    public irons: model.Iron[];

    initialize() {
        super.initialize();

        this.missionTitle = "Raw Materials";
        this.missionText = [
            "Gather more iron so we can build some new robots. You might find it convenient to define a moveAndMine method."
        ];

        this.toolbox = new Toolbox(false, "class", false);
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat");

        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
        ]);
        this.toolbox.addClass("MineRobot", asset.Robot.Red, model.MineRobot, [
            model.MineRobot.prototype.mine,
        ]);

        this.toolbox.addObject("miner", "MineRobot");

        this.objectives = [
            {
                objective: "Collect all the iron (5)",
                completed: false,
                predicate: (level) => {
                    for (var iron of level.irons) {
                        if (!level.robot.holding(iron)) {
                            return false;
                        }
                    }
                    return true;
                }
            }
        ];

        this.hierarchy = {
            name: "object",
            children: [
                {
                    name: "Robot",
                    children: [
                        {
                            name: "MineRobot",
                            children: [],
                            methods: ["mine"],
                            userMethods: ["moveAndMine"]
                        },
                    ],
                    methods: ["moveForward", "turnRight", "turnLeft"],
                },  
            ],
        };

        this.setUpFading();

        this.allTooltips = [[]];
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("outside", "assets/maps/small_world.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("miner", asset.Robot.Red);
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

        this.robot = new model.MineRobot("miner", 7, 4, model.Direction.SOUTH,
                                     this.modelWorld, this.foreground, "miner");
        this.irons = [];
        this.irons.push(new model.Iron("iron", 7, 6,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 5, 6,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 4, 6,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 3, 6,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 3, 7,
                                   this.modelWorld, this.middle, "iron"));

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
    }

    blockLimit(context: EditorContext): number {
        return 21;
    }
}
