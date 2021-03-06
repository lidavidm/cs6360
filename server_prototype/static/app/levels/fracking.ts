import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class FrackingLevel extends BaseLevel {
    public frackingRobot: model.Robot;
    public oil: model.FixedResource;
    public well: model.FixedResource;

    initialize() {
        super.initialize();

        this.missionTitle = "American Spirit";

        this.missionText = ["We need oil for your robots. Here's an overridden robot you can construct - when you tell one to mine, it drills or pumps instead."];

        this.toolbox = new Toolbox(false, "class", false);
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat");
        this.toolbox.addControl("new");
        this.toolbox.addClasses(["Robot", "MineRobot", "FrackingRobot"]);

        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
            model.Robot.prototype.selfDestruct,
        ]);
        this.toolbox.addClass("MineRobot", asset.Robot.Red, model.MineRobot, [
            model.MineRobot.prototype.mine,
        ]);
        this.toolbox.addClass("FrackingRobot", asset.Robot.Blue, model.FrackingRobot, [
        ]);

        this.objectives = [
            {
                objective: `Create a FrackingRobot [${asset.Robot.Blue}]`,
                completed: false,
                predicate: (level, initialized) => {
                    return this.frackingRobot && initialized[this.frackingRobot.getID()];
                }
            },
            {
                objective: `Pump water into the northern well with mine()`,
                completed: false,
                predicate: (level) => {
                    return this.well && this.well.mined === true;
                }
            },
            {
                objective: `Drill into the southern well with mine()`,
                completed: false,
                predicate: (level) => {
                    return this.well && this.oil && this.well.mined === true && this.oil.mined === true;
                }
            },
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.ButtonBar,
                    "This level can be solved with 12 blocks!"),
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
                            children: [
                                {
                                    name: "FrackingRobot",
                                    children: [],
                                    methods: [],
                                    userMethods: [],
                                }
                            ],
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

        this.game.load.image("robot", asset.Robot.Basic);
        this.game.load.image("mineRobot", asset.Robot.Red);
        this.game.load.image("frackingRobot", asset.Robot.Blue);

        this.game.load.image("well", asset.Misc.Well);
    }

    setupCamera() {
        this.zoomCamera.position.x = 80;
        this.zoomCamera.position.y = 100;
    }

    create() {
        // Create the world objects here.
        super.create();

        let map = this.game.add.tilemap("outside");
        map.addTilesetImage("cave2", "tiles");

        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        let layer2 = map.createLayer(
            "Tile Layer 2", this.game.width, this.game.height, this.background);

        this.initWorld(map);

        this.oil = new model.FixedResource("oil", 2, 5, 0xaba938, this.modelWorld, this.middle, "well");
        this.well = new model.LinkedResource("well", 2, 4, 0x0000FF, this.modelWorld, this.middle, "well", this.oil);

        this.oil.mine();
        this.well.fill();

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
        Blockly.Blocks.oop.faded['controls_repeat'] = true;
    }

    instantiateObject(className: string, varName: string): model.WorldObject {
        if (!this.modelWorld.passable(7, 4)) {
            return null;
        }

        if (className === "Robot") {
            return new model.Robot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "robot");
        }
        else if (className === "MineRobot") {
            return new model.MineRobot(varName, 7, 4, model.Direction.SOUTH,
                                   this.modelWorld, this.foreground, "mineRobot");
        }
        else if (className === "FrackingRobot") {
            this.frackingRobot = new model.FrackingRobot(varName, 7, 4,
                model.Direction.WEST, this.modelWorld, this.middle, "frackingRobot");
            return this.frackingRobot;
        }
        else {
            return null;
        }
    }

    blockLimit(context: EditorContext): number {
        if (context.className === MAIN) {
            return 20;
        }
        else {
            return 6;
        }
    }

}
