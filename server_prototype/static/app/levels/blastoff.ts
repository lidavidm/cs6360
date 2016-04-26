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

    initialize() {
        super.initialize();

        this.missionTitle = "Lift Off!";
        this.missionText = [
            "Everything is ready! Assemble all your robots at the launch pad!",
        ];

        this.toolbox = new Toolbox(false, "class", false);
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat");
        this.toolbox.addControl("new");

        /*Add HeavyLifter Class*/

        this.toolbox.addClasses(["Robot", "MineRobot", "FrackingRobot", "RescueRobot", "Drone"])
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
        this.toolbox.addClass("RescueRobot", asset.Robot.Red, model.RescueRobot, [
            model.RescueRobot.prototype.rebootTarget,
        ]);
        this.toolbox.addClass("Drone", asset.Drone.Basic, model.Drone, [
            model.Drone.prototype.flyEast,
            model.Drone.prototype.flyWest,
            model.Drone.prototype.flySouth,
            model.Drone.prototype.flyNorth,
        ]);
        /*Heavy Lifter Type Here*/

        /*Add Sprites, predicates*/
        this.objectives = [
            {
                objective: `Create one of each robot`,
                completed: false,
                predicate: (level, initialized) => {
                    return false;
                }
            },
            {
                objective: `Move one of each robot to the launch pad`,
                completed: false,
                predicate: (level, initialized) => {
                    return false;
                }
            },
            {
                objective: `Lift off!`,
                completed: false,
                predicate: (level, initialized) => {
                    return false;
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
                            userMethods: [],
                        },
                        {
                            name: "RescueRobot",
                            children: [],
                            methods: ["rescue"],
                            userMethods: [],
                        }
                        /* Add HeavyLifter */
                    ],
                    methods: [],
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

        /* We need another color of robot! */

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

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    update() {
        super.update();
        this.drones.forEach( function(d) {
            d.update();
        });
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
        Blockly.Blocks.oop.faded['controls_repeat_ext'] = true;
        Blockly.Blocks.oop.faded['new'] = true;
    }

    instantiateObject(className: string, varName: string): model.WorldObject {
        if (!this.modelWorld.passable(7, 4)) {
            return null;
        }

        if (className == "Robot") {
            return new model.Robot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "robot");
        }
        else if (className = "MineRobot") {
            return new model.MineRobot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "mineRobot");
        }
        else if (className = "FrackingRobot") {
            return new model.FrackingRobot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "frackingRobot");
        }
        else if (className = "RescueRobot") {
            return new model.RescueRobot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "rescueRobot");
        }
        else if (className = "HeavyLifter") {
            /* Will need to add this! */
            //return new model.HeavyLifter(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "heavyLifter");
        }
        else if (className = "Drone") {
            let newDrone = new model.Drone(varName, 7, 4, this.modelWorld, this.foreground, "drone");
            this.drones.push(newDrone);
            newDrone.activate();
            return newDrone;
        }
        else {
            return null;
        }
    }

    /* Need block limit */
    blockLimit(context: EditorContext): number {
        return null;
    }

    canUseBlockEditor(context: EditorContext): boolean {
        return context.className !== MAIN;
    }
}
