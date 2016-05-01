// Copyright 2016 David Li, Michael Mauer, Andy Jiang

// This file is part of Tell Me to Survive.

// Tell Me to Survive is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Tell Me to Survive is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with Tell Me to Survive.  If not, see <http://www.gnu.org/licenses/>.

import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class BlastOffLevel extends BaseLevel {
    /*whatever objects we need go here
    * probably robot and iron sheets
    */

    drones: model.Drone[] = [];
    public rocket: model.Rocket;
    readyForLaunch: boolean = false;
    launch_pad: model.LaunchPad;

    basic: model.Robot;
    miner: model.MineRobot;
    fracker: model.FrackingRobot;
    rescue: model.RescueRobot;
    lifter: model.HeavyLifter;

    initialize() {
        super.initialize();

        this.missionTitle = "Lift Off!";
        this.missionText = [
            "Everything is ready! Gather one of each robot near the launch pad! They'll combine to create your rocket ship!",
        ];

        this.toolbox = new Toolbox(false, "class", false);
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat");
        this.toolbox.addControl("new");

        this.toolbox.addClasses(["Robot", "MineRobot", "FrackingRobot", "RescueRobot", "Drone", "HeavyLifter"])
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
            model.Robot.prototype.moveBackward,
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
        this.toolbox.addClass("HeavyLifter", asset.Robot.Yellow, model.HeavyLifter, [
            model.HeavyLifter.prototype.pickUp,
            model.HeavyLifter.prototype.drop,
        ]);

        /*Add Sprites, predicates*/
        this.objectives = [
            {
                objective: `Create one of each robot:
                            [${asset.Robot.Basic}], [${asset.Robot.Red}],
                            [${asset.Robot.Blue}], [${asset.Robot.Pink}],
                            [${asset.Robot.Yellow}]`,
                completed: false,
                predicate: (level, initialized) => {

                    return this.basic &&
                           this.miner &&
                           this.fracker &&
                           this.rescue &&
                           this.lifter &&
                           initialized[this.basic.getID()] &&
                           initialized[this.miner.getID()] &&
                           initialized[this.fracker.getID()] &&
                           initialized[this.rescue.getID()] &&
                           initialized[this.lifter.getID()];
                }
            },
            {
                objective: `Move each robot to a circle by the launch pad [${asset.Misc.LaunchPad}]`,
                completed: false,
                predicate: (level, initialized) => {
                    if(this.basic &&
                       this.miner &&
                       this.fracker &&
                       this.rescue &&
                       this.lifter &&
                       initialized[this.basic.getID()] &&
                       initialized[this.miner.getID()] &&
                       initialized[this.fracker.getID()] &&
                       initialized[this.rescue.getID()] &&
                       initialized[this.lifter.getID()]) {
                           if (this.launch_pad.readyForLaunch()) {
                               console.log("All Robots Ready!");
                               this.launch_pad.absorbRobots();
                               this.rocket.build();
                               this.rocket.blastOff();
                               return true;
                           }
                           else {
                               return false;
                           }
                    }
                    else {
                        return false;
                    }

                }
            },
            {
                objective: `Lift off!`,
                completed: false,
                predicate: (level, initialized) => {
                    return this.rocket.completed;
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
                            children: [
                                {
                                    name: "FrackingRobot",
                                    children: [],
                                    methods: [],
                                    userMethods: [],
                                },
                            ],
                            methods: ["mine"],
                            userMethods: ["moveAndMine"],
                        },
                        {
                            name: "RescueRobot",
                            children: [],
                            methods: ["rescue"],
                            userMethods: [],
                        },
                        {
                            name: "HeavyLifter",
                            children: [],
                            methods: ["pickUp", "drop"],
                        },
                    ],
                    methods: ["moveForward", "turnRight", "turnLeft", "selfDestruct"],
                    userMethods: ["halfRectangle"],
                },
                {
                    name: "Drone",
                    methods: ["flyNorth", "flySouth", "flyEast", "flyWest"],
                    userMethods: ["flyHome"],
                    children: [],
                }
            ]
        };

        this.allTooltips = [[]];

        this.setUpFading();
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("outside", "assets/maps/small_world.json", null, Phaser.Tilemap.TILED_JSON);

        this.game.load.image("robot", asset.Robot.Basic);
        this.game.load.image("mineRobot", asset.Robot.Red);
        this.game.load.image("frackingRobot", asset.Robot.Blue);
        this.game.load.image("rescueRobot", asset.Robot.Pink);
        this.game.load.image("heavyLifter", asset.Robot.Yellow);
        this.game.load.image("drone", asset.Drone.Basic);

        this.game.load.image("rocket", asset.Misc.Rocket);
        this.game.load.image("flame", asset.Misc.Flame);

        this.game.load.image("launch_pad", asset.Misc.LaunchPad);

    }

    create() {
        super.create();

        let map = this.game.add.tilemap("outside");
        map.addTilesetImage("cave2", "tiles");

        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        let layer2 = map.createLayer(
            "Tile Layer 2", this.game.width, this.game.height, this.background);

        this.initWorld(map);

        /* Create Objects Here */
        this.rocket = new model.Rocket("rocket", 2, 6, this.modelWorld, this.foreground, "rocket", "flame");
        this.launch_pad = new model.LaunchPad("launch_pad", 2, 6,
                                        this.modelWorld, this.middle, "launch_pad");


        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    update() {
        super.update();
        this.rocket.update();
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
        Blockly.Blocks.oop.faded['controls_repeat'] = true;
        Blockly.Blocks.oop.faded['new'] = true;
    }

    instantiateObject(className: string, varName: string): model.WorldObject {
        if (!this.modelWorld.passable(7, 4)) {
            return null;
        }

        if (className == "Robot") {
            this.basic = new model.Robot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "robot");
            return this.basic;
        }
        else if (className === "MineRobot") {
            this.miner = new model.MineRobot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "mineRobot");
            return this.miner;
        }
        else if (className === "FrackingRobot") {
            this.fracker = new model.FrackingRobot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "frackingRobot");
            return this.fracker;
        }
        else if (className === "RescueRobot") {
            this.rescue = new model.RescueRobot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "rescueRobot");
            return this.rescue;
        }
        else if (className === "HeavyLifter") {
            this.lifter = new model.HeavyLifter(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "heavyLifter");
            return this.lifter;
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

    blockLimit(context: EditorContext): number {
        if (context.className !== MAIN) {
            return 6;
        }
        else {
            return null;
        }
    }

    canUseBlockEditor(context: EditorContext): boolean {
        return context.className !== MAIN &&
                !(context.className === "Robot" && context.method === "halfRectangle") &&
                !(context.className === "Drone" && context.method === "flyHome");
    }
}
