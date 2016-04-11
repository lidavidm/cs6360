import * as model from "../model/model";
import {BaseLevel, Toolbox} from "../level";
import * as TooltipView from "../views/tooltip";
import * as asset from "asset";

// Goal: write a vacuum method
export class VacuumLevel3 extends BaseLevel {
    public modelWorld: model.World;
    public robot: model.Robot;
    public irons: model.Iron[];

    initialize() {
        super.initialize();

        this.missionTitle = "Vacuum";
        this.missionText = [
            "We managed to upload a temporary fix to the robot's loops. You might want to use one to implement a more powerful mining method."
        ];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat_ext");
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.moveBackward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.mine,
        ]);
        this.toolbox.addObject("robot", "Robot");
        this.toolbox.addNumber();

        let headlessWorkspace = new Blockly.Workspace();
        this.objectives = [
            {
                objective: `Define a 'vacuum' method`,
                completed: false,
                predicate: (level) => {
                    let impl = level.program.savegame.load({
                        className: "Robot",
                        method: "vacuum"
                    });
                    headlessWorkspace.clear();
                    if (impl.workspace) {
                        Blockly.Xml.domToWorkspace(headlessWorkspace, impl.workspace);
                        if (headlessWorkspace.getTopBlocks()) {
                            // accept any implementation
                            return true;
                        }
                    }
                    return false;
                }
            },
            {
                objective: "Collect 10 iron",
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

        this.hierarchy = {
            name: "object",
            children: [
                {
                    name: "Robot",
                    children: [],
                    methods: ["moveForward", "moveBackward", "turnRight", "mine"],
                    userMethods: ["moveAndMine", "vacuum"],
                },
            ],
        };

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Toolbox, "One idea is to implement vacuum so that it mines a line of ten iron."),
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
        for (var i = 0; i < 10; i++) {
            this.irons.push(new model.Iron("iron", 2, 2 + i,
                                   this.modelWorld, this.middle, "iron"));
        }

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }
}
