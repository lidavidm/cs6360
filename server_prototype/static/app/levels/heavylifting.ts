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

export class HeavyLiftingLevel extends BaseLevel {

    pieces: model.PlatformPiece[] = [];
    lifter: model.HeavyLifter;
    landing_pad: model.ObjectiveCircle;

    initialize() {
        super.initialize();

        this.missionTitle = "Do You Even Lift";
        this.missionText = [
            "The iron you gathered has been turned into parts for a landing pad.",
            "Use the HeavyLifter robot to carry the parts to the launch site."
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
                objective: `Define a halfRectangle method for the Robot [${asset.Robot.Basic}] class`,
                completed: false,
                predicate: (level, initialized) => {
                    return this.program.getMethodCode("Robot", "halfRectangle").indexOf("NotImplementedError") === -1;
                }
            },
            {
                objective: `Create a HeavyLifter robot [${asset.Robot.Yellow}]`,
                completed: false,
                predicate: (level, initialized) => {
                    return this.lifter && initialized[this.lifter.getID()];
                }
            },
            {
                objective: `Carry all four pieces [${asset.Misc.Platform_3}] to the launch site`,
                completed: false,
                predicate: (level, initialized) => {
                    if (this.pieces.length === 0) {
                        return false;
                    }
                    let groundObjects = this.modelWorld.getObjectByLoc(2, 6);
                    let count = 0;
                    for (var o of groundObjects) {
                        if (o instanceof model.PlatformPiece) {
                            let p = o.getPhaserObject();
                            if (p.alpha === 1) {
                                count = count + 1;
                            }
                        }
                    }
                    return count === this.pieces.length;
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
                        },
                        {
                            name: "HeavyLifter",
                            children: [],
                            methods: ["pickUp", "drop"],
                        },
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
        this.game.load.image("mineRobot", asset.Robot.Red);
        this.game.load.image("frackingRobot", asset.Robot.Blue);
        this.game.load.image("rescueRobot", asset.Robot.Pink);
        this.game.load.image("heavyLifter", asset.Robot.Yellow);
        this.game.load.image("drone", asset.Drone.Basic);

        /* We need another color of robot! */
        this.game.load.image("platform_0", asset.Misc.Platform_0);
        this.game.load.image("platform_1", asset.Misc.Platform_1);
        this.game.load.image("platform_2", asset.Misc.Platform_2);
        this.game.load.image("platform_3", asset.Misc.Platform_3);
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

        let spriteList = ["platform_0", "platform_1", "platform_2", "platform_3"];

        /* Create Objects Here */
        this.pieces.push(new model.PlatformPiece("piece", 5, 4, this.modelWorld, this.middle, spriteList));
        this.pieces.push(new model.PlatformPiece("piece", 5, 4, this.modelWorld, this.middle, spriteList));
        this.pieces.push(new model.PlatformPiece("piece", 5, 4, this.modelWorld, this.middle, spriteList));
        this.pieces.push(new model.PlatformPiece("piece", 5, 4, this.modelWorld, this.middle, spriteList));

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

    instantiateObject(className: string, varName: string): model.WorldObject {
        if (!this.modelWorld.passable(7, 4)) {
            return null;
        }

        if (className == "Robot") {
            return new model.Robot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "robot");
        }
        else if (className === "MineRobot") {
            return new model.MineRobot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "mineRobot");
        }
        else if (className === "FrackingRobot") {
            return new model.FrackingRobot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "frackingRobot");
        }
        else if (className === "RescueRobot") {
            return new model.RescueRobot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "rescueRobot");
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

    /* Need block limit */
    blockLimit(context: EditorContext): number {
        return null;
    }

    canUseBlockEditor(context: EditorContext): boolean {
        return !(context.className === "Robot" && context.method === "halfRectangle");
    }
}
