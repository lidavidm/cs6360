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

        this.missionText = [
            "One of the surveilance drones just stopped. We need to reboot it or we'll lose visuals on your area.",
            "The drone will call self.flyHome() when it reboots."
        ];

        this.toolbox = new Toolbox(false, "class", false);
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat");
        this.toolbox.addControl("new");
        this.toolbox.addClasses(["Robot", "MineRobot", "FrackingRobot", "RescueRobot", "Drone"]);

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
        this.toolbox.addClass("RescueRobot", asset.Robot.Pink, model.RescueRobot, [
            model.RescueRobot.prototype.rebootTarget,
        ]);
        this.toolbox.addClass("Drone", asset.Drone.Basic, model.Drone, [
            model.Drone.prototype.flyEast,
            model.Drone.prototype.flyWest,
            model.Drone.prototype.flySouth,
            model.Drone.prototype.flyNorth,
        ]);

        this.toolbox.addObject("drone", "Drone", false);

        this.objectives = [
            {
                objective: `Write the flyHome method for the drone [${asset.Drone.Basic}]`,
                completed: false,
                predicate: (level) => {
                    return this.program.getMethodCode("Drone", "flyHome").indexOf("NotImplementedError") === -1;
                }
            },
            {
                objective: `Move a RescueRobot [${asset.Robot.Pink}] in front of the drone [${asset.Drone.Basic}]`,
                completed: false,
                predicate: (level, initialized) => {
                    return this.rescuer && initialized[this.rescuer.getID()] && this.rescuer.getX() == 5 && this.rescuer.getY() == 4;
                }
            },
            {
                objective: `Activate the drone [${asset.Drone.Basic}]`,
                completed: false,
                predicate: (level) => {
                    return this.drone && this.drone.activated;
                }
            },
            {
                objective: `Fly the drone [${asset.Drone.Basic}] home`,
                completed: false,
                predicate: (level) => {
                    return this.drone && this.drone.getX() == 7 && this.drone.getY() == 4;
                }
            },
        ];

        this.allTooltips = [[]];

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
                        {
                            name: "RescueRobot",
                            children: [],
                            methods: ["rebootTarget"],
                            userMethods: [],
                        },
                    ],
                    methods: ["moveForward", "turnRight", "turnLeft", "selfDestruct"],
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
        this.game.load.image("mineRobot", asset.Robot.Red);
        this.game.load.image("frackingRobot", asset.Robot.Blue);
        this.game.load.image("rescueRobot", asset.Robot.Pink);
        this.game.load.image("drone", asset.Drone.Basic);

    }

    setupCamera() {
        this.zoomCamera.position.x = 500;
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

        this.drone = new model.Drone("drone", 4, 4,
                                     this.modelWorld, this.flying, "drone");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
        Blockly.Blocks.oop.faded['controls_repeat'] = true;
        Blockly.Blocks.oop.faded['new'] = true;
    }

    canUseBlockEditor(context: EditorContext): boolean {
        return !(context.className === "Drone" && context.method === "flyHome");
    }

    blockLimit(context: EditorContext): number {
        if (context.className === MAIN) {
            return 9;
        }
        else {
            return 6;
        }
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
            return new model.FrackingRobot(varName, 7, 4,
                model.Direction.WEST, this.modelWorld, this.middle, "frackingRobot");
        }
        else if (className == "RescueRobot") {
            this.rescuer = new model.RescueRobot("rescuer", 7, 4, model.Direction.WEST,
                                                 this.modelWorld, this.foreground, "rescueRobot");
            return this.rescuer;
        }
        else if (className === "Drone") {
            let newDrone = new model.Drone(varName, 7, 4, this.modelWorld, this.foreground, "drone");
            newDrone.activate();
            return newDrone;
        }
        else {
            return null;
        }
    }

}
