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

export class MakeMiner extends BaseLevel {
    public robot: model.Robot;
    public miner: model.MineRobot;
    public iron: model.Iron;

    private fallback: HTMLElement[];

    initialize() {
        super.initialize();

        this.missionTitle = "Specialist";
        this.missionText = [
            "MineRobot is a more specialized SUBCLASS of Robot.",
            "Make one from the blueprints and try mining some iron.",
        ];

        this.toolbox = new Toolbox(false, "class", false);
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat");

        let create = this.toolbox.addControl("new");

        let classes = this.toolbox.addClasses(["Robot", "MineRobot"])

        let fallbackCreate = <HTMLElement> create.cloneNode(true);
        let fallbackClass = <HTMLElement> classes[1].cloneNode(true);

        fallbackCreate.setAttribute("x", "220");
        fallbackCreate.setAttribute("y", "100");
        fallbackClass.setAttribute("x", "250");
        fallbackClass.setAttribute("y", "140");

        this.fallback = <HTMLElement[]> [
            fallbackCreate,
            fallbackClass
        ];

        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
        ]);
        this.toolbox.addClass("MineRobot", asset.Robot.Red, model.MineRobot, [
            model.MineRobot.prototype.mine,
        ]);

        this.toolbox.addObject("robot", "Robot");

        this.objectives = [
            {
                objective: `Make a MineRobot [${asset.Robot.Red}].`,
                completed: false,
                predicate: (level, initialized) => {
                    return this.miner && initialized[this.miner.getID()];
                }
            },
            {
                objective: `Try gathering Iron [${asset.Iron.Basic}]!`,
                completed: false,
                predicate: (level, initialized) => {
                    return this.miner && initialized[this.miner.getID()] && this.miner.lastPickedUp() !== null;
                }
            },
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
                            userMethods: []
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
        this.zoomCamera.position.x = 300;
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
        this.robot = new model.Robot("robot", 8, 4, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");
        this.iron = new model.Iron("iron", 7, 6,
                                    this.modelWorld, this.middle, "iron");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    instantiateObject(className: string, varName: string): model.WorldObject {
        if (!this.modelWorld.passable(7, 4)) {
            return null;
        }
        if (className === "Robot") {
            return new model.Robot(varName, 7, 4, model.Direction.WEST, this.modelWorld, this.middle, "robot");
        }
        else if (className === "MineRobot") {
            this.miner = new model.MineRobot(varName, 7, 4, model.Direction.SOUTH,
                                   this.modelWorld, this.foreground, "mineRobot");
            return this.miner;
        }

        else {
            return null;
        }
    }

    fallbackWorkspace(context: EditorContext): HTMLElement {
        if (context.className === MAIN) {
            let doc = this.fallback.map((node) => {
                return node.outerHTML;
            }).join("\n");
            return Blockly.Xml.textToDom(`<xml>${doc}</xml>`);
        }
        return super.fallbackWorkspace(context);
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
    }

    blockLimit(context: EditorContext): number {
        return 9;
    }
}
