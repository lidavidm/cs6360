import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class HierarchyLevel1 extends BaseLevel {
    public robot: model.Robot;
    public iron: model.Iron;

    initialize() {
        super.initialize();

        this.missionTitle = "Family Values";
        this.missionText = [
            "We've found the blueprints for a normal robot.",
            "Robot is a SUPERCLASS of your SmallRobot, so smallRobot understands the same commands as Robot.",
            "Try telling smallRobot to do things from the Robot blueprints.",
        ];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addClass("SmallRobot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.moveBackward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.mine,
        ]);
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
            model.Robot.prototype.mine,
        ]);

        this.toolbox.addObject("smallRobot", "SmallRobot");

        this.toolbox.addControl("controls_repeat_ext");
        this.toolbox.addNumber(0);

        this.objectives = [
            {
                objective: `Make the robot [${asset.Robot.Red}] turn left (again).`,
                completed: false,
                predicate: (level) => {
                    return level.robot.orientation == model.Direction.NORTH;
                }
            },
            {
                objective: `Gather more iron [${asset.Iron.Basic}]!`,
                completed: false,
                predicate: (level) => {
                    return level.robot.lastPickedUp() != null;
                }
            },
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Toolbox,
                    "Use turnLeft from the robot blueprints!"),
                new TooltipView.Tooltip(TooltipView.Region.ButtonBar,
                    "Check out the updated hierarchy!"),
            ],
        ];

        this.hierarchy = {
            name: "object",
            children: [
                {
                    name: "Robot",
                    children: [
                        {
                            name: "SmallRobot",
                            children: [],
                            methods: ["moveForward", "moveBackward", "turnRight", "mine"],
                            userMethods: ["advance", "moveAndMine", "vacuum"],
                        },
                    ],
                    methods: ["moveForward", "turnRight", "turnLeft", "mine"],
                    userMethods: [],
                },
            ],
        };

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
        this.robot = new model.Robot("smallRobot", 17, 4, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");
        this.iron = new model.Iron("iron", 15, 3,
                                   this.modelWorld, this.middle, "iron");
        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
        Blockly.Blocks.oop.faded['controls_repeat_ext'] = true;
    }
}
