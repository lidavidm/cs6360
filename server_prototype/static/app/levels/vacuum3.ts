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
        this.toolbox.addControl("controls_repeat");
        this.toolbox.addClass("SmallRobot", asset.Robot.Red, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.moveBackward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.mine,
        ]);
        this.toolbox.addObject("smallRobot", "SmallRobot");
        this.toolbox.addNumber();

        let headlessWorkspace = new Blockly.Workspace();
        this.objectives = [
            {
                objective: `Define a 'vacuum' method`,
                completed: false,
                predicate: (level) => {
                    let impl = level.program.savegame.load({
                        className: "SmallRobot",
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
                    name: "SmallRobot",
                    children: [],
                    methods: ["moveForward", "moveBackward", "turnRight", "mine"],
                    userMethods: ["temporaryLeft", "advance", "moveAndMine", "vacuum"],
                },
            ],
        };

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Toolbox, "One idea is to implement vacuum so that it mines a line of ten iron."),
            ]
        ];

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

        this.robot = new model.Robot("smallRobot", 17, 5, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");
        this.irons = [];
        for (var i = 0; i < 10; i++) {
            this.irons.push(new model.Iron("iron", 18, 6 + i,
                                   this.modelWorld, this.middle, "iron"));
        }

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
        Blockly.Blocks.oop.faded['controls_repeat'] = true;
    }
}
