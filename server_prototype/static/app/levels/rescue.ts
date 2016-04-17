import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class RescueLevel extends BaseLevel {
    public rescuer: model.Robot;
    public drone: model.Drone;

    initialize() {
        super.initialize();

        this.missionTitle = "Eye Opener";

        this.missionText = ["One of the surveilance drones just stopped. We need to get it working or we'll lose visuals on your area."];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
        ]);
        this.toolbox.addClass("RescueRobot", asset.Robot.Red, model.RescueRobot, [
            model.RescueRobot.prototype.rescue,
        ]);
        this.toolbox.addClass("Drone", asset.Drone.Basic, model.Drone, [
            model.Drone.prototype.flyEast,
            model.Drone.prototype.flyWest,
            model.Drone.prototype.flySouth,
            model.Drone.prototype.flyNorth,
        ]);
        this.toolbox.addObject("rescuer", "RescueRobot");
        this.toolbox.addObject("drone", "Drone");

        this.toolbox.addControl("controls_repeat_ext");
        this.toolbox.addNumber(0);

        this.objectives = [
            {
                objective: `Write the flyHome method for the drone [${asset.Drone.Basic}]`,
                completed: false,
                predicate: (level) => {
                    return this.program.getMethodCode("Drone", "flyHome").indexOf("NotImplementedError") === -1;
                }
            },
            {
                objective: `Move the robot [${asset.Robot.Red}] to the drone [${asset.Drone.Basic}]`,
                completed: false,
                predicate: (level) => {
                    return this.rescuer.getX() == 5 && this.rescuer.getY() == 4;
                }
            },
            {
                objective: `Activate the drone [${asset.Drone.Basic}]`,
                completed: false,
                predicate: (level) => {
                    return this.drone.activated;
                }
            },
            {
                objective: `Fly the drone [${asset.Drone.Basic}] home`,
                completed: false,
                predicate: (level) => {
                    return this.drone.getX() == 7 && this.drone.getY() == 4;
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
                            name: "RescueRobot",
                            children: [],
                            methods: ["rescue"],
                            userMethods: [],
                        },
                    ],
                },
                {
                    name: "Drone",
                    methods: ["flyNorth", "flySouth", "flyEast", "flyWest"],
                    userMethods: ["flyHome"],
                    children: [],
                }
            ],
        };

        this.setUpFading();
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("outside", "assets/maps/small_world.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("robot", asset.Robot.Red);
        this.game.load.image("drone", asset.Drone.Basic);
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
        this.rescuer = new model.RescueRobot("rescuer", 7, 4, model.Direction.WEST,
                                             this.modelWorld, this.foreground, "robot");
        this.drone = new model.Drone("drone", 4, 4,
                                     this.modelWorld, this.flying, "drone");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);

        this.zoomCamera.position.x = 500;
    }

    update() {
        super.update();
        this.drone.update();
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
        Blockly.Blocks.oop.faded['controls_repeat_ext'] = true;
    }
}
