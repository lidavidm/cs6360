import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class ScoutLevel extends BaseLevel {
    public landing_pad: model.ObjectiveCircle;

    initialize() {
        super.initialize();

        this.missionTitle = "Eye In The Sky";
        this.missionText = [
            "Time to start thinking about getting off this planet.",
            "Create a drone to inspect a potential rocket launch site in the southwest."
        ]

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat");
        this.toolbox.addControl("new");
        this.toolbox.addClasses(["Robot", "MineRobot", "FrackingRobot", "Drone"]);

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
        this.toolbox.addClass("Drone", asset.Drone.Basic, model.Drone, [
            model.Drone.prototype.flyEast,
            model.Drone.prototype.flyWest,
            model.Drone.prototype.flySouth,
            model.Drone.prototype.flyNorth,
        ]);

        this.objectives = [
            {
                objective: `Create a new drone [${asset.Drone.Basic}]`,
                completed: false,
                predicate: (level, initialized) => {
                    for (var d in this.modelWorld.objects) {
                        let obj = this.modelWorld.objects[d];
                        if ( initialized[obj.getID()] && obj instanceof model.Drone ) {
                            return true;
                        }
                    }
                    return false;
                }
            },
            {
                objective: `Send the drone [${asset.Drone.Basic}] to the potential launch site in the southwest`,
                completed: false,
                predicate: (level, initialized) => {
                    for (var d in this.modelWorld.objects) {
                        let obj = this.modelWorld.objects[d];
                        if (initialized[obj.getID()] &&
                            obj instanceof model.Drone &&
                            obj.getX() === 2 &&
                            obj.getY() === 6) {
                                return true;
                            }
                    }
                    return false;
                }
            },
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.ButtonBar,
                    "This level can be solved with 10 blocks!"),
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
        this.game.load.image("drone", asset.Drone.Basic);
    }

    create() {
        // Create the world objects here.
        super.create();

        this.zoomCamera.position.x = 1000;
        this.zoomCamera.position.y = 128;

        let map = this.game.add.tilemap("outside");
        map.addTilesetImage("cave2", "tiles");

        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        let layer2 = map.createLayer(
            "Tile Layer 2", this.game.width, this.game.height, this.background);

        this.initWorld(map);

        this.landing_pad = new model.ObjectiveCircle("landing_pad", 2, 6,
                                        this.modelWorld, this.foreground);

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
        Blockly.Blocks.oop.faded['controls_repeat'] = true;
        Blockly.Blocks.oop.faded['new'] = true;
    }

    blockLimit(context: EditorContext): number {
        if (context.className === MAIN) {
            return 10;
        }
        else {
            return null;
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
        else if (className === "Drone") {
            let newDrone = new model.Drone(varName, 7, 4, this.modelWorld, this.foreground, "drone");
            //this.drones.push(newDrone);
            newDrone.activate();
            return newDrone;
        }
        else {
            return null;
        }
    }
}
