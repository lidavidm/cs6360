import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class RecyclingLevel extends BaseLevel {
    public robot: model.Robot;
    public miner: model.MineRobot;

    initialize() {
        super.initialize();

        this.missionTitle = "Recyling";
        this.missionText = [
            "That regular robot isn't very useful. Time to get rid of it.",
        ];

        this.toolbox = new Toolbox(false, "class", false);
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat");
        this.toolbox.addControl("new");
        this.toolbox.addClasses(["Robot", "MineRobot"]);

        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
            model.Robot.prototype.selfDestruct,
        ]);
        this.toolbox.addClass("MineRobot", asset.Robot.Red, model.MineRobot, [
            model.MineRobot.prototype.mine,
        ]);

        this.toolbox.addObject("miner", "MineRobot");
        this.toolbox.addObject("robot", "Robot");

        this.objectives = [
            {
                objective: `Move the old robot [${asset.Robot.Basic}] 7 spaces west`,
                completed: false,
                predicate: (level) => {
                    return this.robot.getX() == 1;
                }
            },
            {
                objective: `Move the miner [${asset.Robot.Red}] back to base [${asset.Misc.Base}]`,
                completed: false,
                predicate: (level) => {
                    return this.miner.getX() ==  7 && this.miner.getY() == 4;
                }
            },
            {
                objective: `Self-destruct the old robot [${asset.Robot.Basic}]`,
                completed: false,
                predicate: (level) => {
                    return this.robot.destructed;
                }
            },
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.ButtonBar,
                    "This level can be solved with 25 blocks!"),
            ],
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
                    methods: ["moveForward", "turnRight", "turnLeft", "selfDestruct"],
                },
            ],
        };

        this.setUpFading();
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("outside", "assets/maps/small_world.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("miner", asset.Robot.Red);
        this.game.load.image("robot", asset.Robot.Basic);
    }

    create() {
        // Create the world objects here.
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
        this.miner = new model.MineRobot("miner", 3, 7, model.Direction.SOUTH,
                                     this.modelWorld, this.foreground, "miner");
        this.robot = new model.Robot("robot", 8, 4, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
        Blockly.Blocks.oop.faded['controls_repeat'] = true;
    }

    blockLimit(context: EditorContext): number {
        if (context.className === MAIN) {
            return 35;
        }
        else {
            return 6;
        }
    }
}
