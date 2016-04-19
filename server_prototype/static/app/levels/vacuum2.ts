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

// Goal: write a moveAndMine method
export class VacuumLevel2 extends BaseLevel {
    public modelWorld: model.World;
    public robot: model.Robot;
    public irons: model.Iron[];

    initialize() {
        super.initialize();

        this.missionTitle = "Refining Mining";
        this.missionText = [
            "Repeating 'moveForward' and 'mine' is getting kind of tedious. Try writing a new method."
        ];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addClass("SmallRobot", asset.Robot.Red, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.moveBackward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.mine,
        ]);
        this.toolbox.addObject("smallRobot", "SmallRobot");

        let headlessWorkspace = new Blockly.Workspace();
        this.objectives = [
            {
                objective: `Use moveAndMine`,
                completed: false,
                predicate: (level) => {
                    let impl = level.program.savegame.load({
                        className: MAIN,
                        method: ""
                    });
                    headlessWorkspace.clear();
                    if (impl.workspace) {
                        Blockly.Xml.domToWorkspace(headlessWorkspace, impl.workspace);
                        let allTopBlocks: any[] = [];
                        for (let block of headlessWorkspace.getTopBlocks()) {
                            while (block) {
                                allTopBlocks.push(block);
                                block = block.getNextBlock();
                            }
                        }
                        console.log(allTopBlocks);
                        for (var block of allTopBlocks) {
                            var method = block.getInputTargetBlock("METHOD").getFieldValue("METHOD_NAME");
                            if (method == "moveAndMine") {
                                return true;
                            }
                        }
                    }
                    return false;
                }
            },

            /*
             * removing this objective for now since moveAndMine is faded to a code editor now
             */
            // {
            //     objective: `Implement moveAndMine`,
            //     completed: false,
            //     predicate: (level) => {
            //         let impl = level.program.savegame.load({
            //             className: "SmallRobot",
            //             method: "moveAndMine"
            //         });
            //         headlessWorkspace.clear();
            //         if (impl.workspace) {
            //             Blockly.Xml.domToWorkspace(headlessWorkspace, impl.workspace);
            //             let allTopBlocks: any[] = [];
            //             for (let block of headlessWorkspace.getTopBlocks()) {
            //                 while (block) {
            //                     allTopBlocks.push(block);
            //                     block = block.getNextBlock();
            //                 }
            //             }
            //             console.log(allTopBlocks);
            //             if (allTopBlocks.length !== 2) {
            //                 return false;
            //             }
            //             if (allTopBlocks[0].type != 'tell' || allTopBlocks[1].type != 'tell') {
            //                 return false;
            //             }
            //             var object = Blockly.Python.valueToCode(allTopBlocks[0], "OBJECT", Blockly.Python.ORDER_NONE);
            //             var method = allTopBlocks[0].getInputTargetBlock("METHOD").getFieldValue("METHOD_NAME");
            //             if (object != 'self' || method != 'moveForward') {
            //                 return false;
            //             }
            //             var object = Blockly.Python.valueToCode(allTopBlocks[1], "OBJECT", Blockly.Python.ORDER_NONE);
            //             var method = allTopBlocks[1].getInputTargetBlock("METHOD").getFieldValue("METHOD_NAME");
            //             if (object != 'self' || method != 'mine') {
            //                 return false;
            //             }
            //             return true;
            //         }
            //         return false;
            //     }
            // },
            {
                objective: "Collect 5 iron",
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

        this.allTooltips = [[]];

        this.hierarchy = {
            name: "object",
            children: [
                {
                    name: "SmallRobot",
                    children: [],
                    methods: ["moveForward", "moveBackward", "turnRight", "mine"],
                    userMethods: ["temporaryLeft", "advance", "moveAndMine"],
                },
            ],
        };

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Toolbox, "moveAndMine should make the robot move one space and mine"),
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

        this.robot = new model.Robot("smallRobot", 17, 4, model.Direction.SOUTH,
                                     this.modelWorld, this.foreground, "robot");
        this.irons = [];
        for (var i = 0; i < 5; i++) {
            this.irons.push(new model.Iron("iron", 11 + i, 5,
                                   this.modelWorld, this.middle, "iron"));
        }

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
    }

    canUseCodeEditor(context: EditorContext): boolean {
        return (context.className === "SmallRobot" && context.method === "moveAndMine");
    }

    canUseBlockEditor(context: EditorContext): boolean {
        return !(context.className === "SmallRobot" && context.method === "moveAndMine");
    }
}
