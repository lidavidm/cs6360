import * as model from "../model/model";
import {BaseLevel, Toolbox} from "../level";
import * as TooltipView from "../views/tooltip";
import * as asset from "asset";

// Goal: write a moveAndMine method
export class VacuumLevel2 extends BaseLevel {
    public modelWorld: model.World;
    public robot: model.Robot;
    public irons: model.Iron[];

    initialize() {
        super.initialize();

        this.missionTitle = "";
        this.missionText = [
            "Repeating 'moveForward' and 'mine' is getting kind of tedious. Try writing a new method."
        ];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.moveBackward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.mine,
        ]);
        this.toolbox.addObject("robot", "Robot");

        let headlessWorkspace = new Blockly.Workspace();
        this.objectives = [
            {
                objective: `Implement moveAndMine`,
                completed: false,
                predicate: (level) => {
                    let impl = level.program.savegame.load({
                        className: "Robot",
                        method: "moveAndMine"
                    });
                    headlessWorkspace.clear();
                    if (impl.workspace) {
                        Blockly.Xml.domToWorkspace(headlessWorkspace, impl.workspace);
                        let allTopBlocks: any[] = [];
                        for (let block of headlessWorkspace.getTopBlocks()) {
                            while (block) {
                                allTopBlocks.push(block);
                                block = block.getNextBlock();
                            }
                        }
                        console.log(allTopBlocks);
                        if (allTopBlocks.length !== 2) {
                            return false;
                        }
                        if (allTopBlocks[0].type != 'tell' || allTopBlocks[1].type != 'tell') {
                            return false;
                        }
                        var object = Blockly.Python.valueToCode(allTopBlocks[0], "OBJECT", Blockly.Python.ORDER_NONE);
                        var method = allTopBlocks[0].getInputTargetBlock("METHOD").getFieldValue("METHOD_NAME");
                        if (object != 'self' || method != 'moveForward') {
                            return false;
                        }
                        var object = Blockly.Python.valueToCode(allTopBlocks[1], "OBJECT", Blockly.Python.ORDER_NONE);
                        var method = allTopBlocks[1].getInputTargetBlock("METHOD").getFieldValue("METHOD_NAME");
                        if (object != 'self' || method != 'mine') {
                            return false;
                        }
                        return true;
                    }
                    return false;
                }
            },
            {
                objective: "Collect 5 iron",
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
        ];

        this.allTooltips = [[]];

        this.hierarchy = {
            name: "object",
            children: [
                {
                    name: "Robot",
                    children: [],
                    methods: ["moveForward", "moveBackward", "turnRight", "mine"],
                    userMethods: ["moveAndMine"],
                },
            ],
        };

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Toolbox, "moveAndMine should make the robot move one space and mine"),
            ]
        ];
    }

    preload() {
        super.preload();

        this.game.load.tilemap("prototype", "assets/maps/prototype.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("tiles", "assets/tilesets/cave.png");
        this.game.load.image("robot", asset.Robot.Basic);
        this.game.load.image("iron", asset.Iron.Basic);
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
        for (var i = 0; i < 5; i++) {
            this.irons.push(new model.Iron("iron", 2, 2 + i,
                                   this.modelWorld, this.middle, "iron"));
        }

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }
}
