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

import * as model from "../model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "../level";
import * as TooltipView from "../views/tooltip";
import * as asset from "asset";

export class IronLevel extends BaseLevel {
    public modelWorld: model.World;
    public robot: model.MineRobot;
    public other_robot: model.Robot;
    public irons: model.Iron[];

    initialize() {
        super.initialize();

        this.missionTitle = "Raw Materials";
        this.missionText = [
            "Gather more iron so we can build some new robots. You might find it convenient to define a moveAndMine method."
        ];

        this.toolbox = new Toolbox(false, "class", false);
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat");
        this.toolbox.addControl("new");
        this.toolbox.addClasses(["Robot", "MineRobot"])

        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
        ]);
        this.toolbox.addClass("MineRobot", asset.Robot.Red, model.MineRobot, [
            model.MineRobot.prototype.mine,
        ]);

        this.toolbox.addObject("miner", "MineRobot");
        this.toolbox.addObject("robot", "Robot");

        this.objectives = [
            {
                objective: `Write the moveAndMine method for the MineRobot [${asset.Robot.Red}]`,
                completed: false,
                predicate: (level) => {
                    return this.program.getMethodCode("MineRobot", "moveAndMine").indexOf("NotImplementedError") === -1;
                }
            },
            {
                objective: `Collect all the iron [${asset.Iron.Basic}] (5)`,
                completed: false,
                predicate: (level) => {
                    if (this.robot){
                        for (var iron of this.irons){
                            if (!this.robot.holding(iron)){
                                return false
                            }
                        }
                        return true;
                    }
                    else {
                        return false;
                    }
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
                            children: [],
                            methods: ["mine"],
                            userMethods: ["moveAndMine"]
                        },
                    ],
                    methods: ["moveForward", "turnRight", "turnLeft"],
                },
            ],
        };

        this.setUpFading();

        this.allTooltips = [[]];
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("outside", "assets/maps/small_world.json", null, Phaser.Tilemap.TILED_JSON);

        this.game.load.image("robot", asset.Robot.Basic);
        this.game.load.image("mineRobot", asset.Robot.Red);

        this.game.load.image("iron", asset.Iron.Basic);
    }

    setupCamera() {
        this.zoomCamera.position.x = 115;
        this.zoomCamera.position.y = 125;
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

        this.robot = new model.MineRobot("miner", 7, 6, model.Direction.SOUTH,
                                     this.modelWorld, this.foreground, "mineRobot");
        this.other_robot = new model.Robot("robot", 8, 4, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");
        this.irons = [];
        this.irons.push(new model.Iron("iron", 6, 6,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 5, 6,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 4, 6,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 3, 6,
                                   this.modelWorld, this.middle, "iron"));
        this.irons.push(new model.Iron("iron", 3, 7,
                                   this.modelWorld, this.middle, "iron"));

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
    }

    blockLimit(context: EditorContext): number {
        if (context.className === MAIN) {
            return 13;
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
        else {
            return null;
        }
    }
}
