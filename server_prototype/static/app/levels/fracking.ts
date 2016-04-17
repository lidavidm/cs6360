import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class FrackingLevel extends BaseLevel {
    public pumpRobot: model.Robot;
    public drillRobot: model.Robot;
    public oil: model.FixedResource;
    public well: model.FixedResource;

    initialize() {
        super.initialize();

        this.missionTitle = "American Business";

        this.missionText = ["We need oil for your robots. Here's two overridden robots - when you tell them to mine, they drill or pump."];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
            model.Robot.prototype.mine,
        ]);
        this.toolbox.addClass("DrillRobot", asset.Robot.Yellow, model.DrillRobot, [
        ]);
        this.toolbox.addClass("PumpRobot", asset.Robot.Blue, model.PumpRobot, [
        ]);

        this.toolbox.addObject("pumpRobot", "PumpRobot");
        this.toolbox.addObject("drillRobot", "DrillRobot");

        this.toolbox.addControl("controls_repeat_ext");
        this.toolbox.addNumber(0);

        this.objectives = [
            {
                objective: `Pump water into the southern well with mine()`,
                completed: false,
                predicate: (level) => {
                    return false;
                }
            },
            {
                objective: `Drill into the northern well with mine()`,
                completed: false,
                predicate: (level) => {
                    return false;
                }
            },
            {
                objective: `Bring the oil back to base`,
                completed: false,
                predicate: (level) => {
                    return false;
                }
            },
        ];

        this.allTooltips = [[]];

        this.hierarchy = {
            name: "object",
            children: [
                {
                    name: "Robot",
                    methods: ["moveForward", "turnRight", "turnLeft"],
                    children: [
                        {
                            name: "PumpRobot",
                            children: [],
                            methods: [],
                            userMethods: [],
                        },
                        {
                            name: "DrillRobot",
                            children: [],
                            methods: [],
                            userMethods: [],
                        },

                    ],
                },
            ],
        };

        this.setUpFading();
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("outside", "assets/maps/small_world.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("robotBlue", asset.Robot.Blue);
        this.game.load.image("robotYellow", asset.Robot.Yellow);
        this.game.load.image("well", asset.Misc.Well);
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
        this.well = new model.LinkedResource("well", 2, 7, 0x0000FF, this.modelWorld, this.middle, "well", this.oil);
        this.pumpRobot = new model.PumpRobot("pumpRobot", 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "robotBlue");
        this.drillRobot = new model.DrillRobot("drillRobot", 7, 5, model.Direction.WEST, this.modelWorld, this.middle, "robotYellow");

        this.well.fill();

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);

        this.zoomCamera.position.x = 500;
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
        Blockly.Blocks.oop.faded['controls_repeat_ext'] = true;
    }
}
