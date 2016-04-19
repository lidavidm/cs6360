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

export class HierarchyLevel2 extends BaseLevel {
    public robot: model.Robot;
    public iron: model.Iron;

    initialize() {
        super.initialize();

        this.missionTitle = "Reinforcements";
        this.missionText = [
            "Time to build another robot!",
            "Use the 'new' block to CONSTRUCT an additional Robot.",
        ];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addControl("new");
        this.toolbox.addClasses(["Robot"]);
        this.toolbox.addClass("SmallRobot", asset.Robot.Red, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.moveBackward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.mine,
        ]);
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
            model.Robot.prototype.mine,
        ]);

        this.toolbox.addObject("smallRobot", "SmallRobot");

        this.toolbox.addControl("controls_repeat_ext");
        this.toolbox.addNumber(0);

        this.objectives = [
            {
                objective: `Build a normal Robot [${asset.Robot.Basic}]`,
                completed: false,
                predicate: (level) => {
                    for (let object of this.modelWorld.getObjectByLoc(17, 4)){
                        if (object !== null && object.initialized){
                            return true;
                        }
                    }
                    return false;
                }
            },
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Toolbox,
                    "Use the blue prints object to create a new robot!"),
                new TooltipView.Tooltip(TooltipView.Region.ButtonBar,
                    "Get overviews of the blue prints in the object heirarchy."),
            ],
        ];

        this.hierarchy = {
            name: "object",
            children: [
                {
                    name: "Robot",
                    children: [
                        {
                            name: "SmallRobot",
                            children: [],
                            methods: ["moveForward", "moveBackward", "turnRight", "mine"],
                            userMethods: ["advance", "moveAndMine", "vacuum"],
                        },
                    ],
                    methods: ["moveForward", "turnRight", "turnLeft", "mine"],
                    userMethods: [],
                },
            ],
        };

        this.setUpFading();
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("outside", "assets/maps/outside.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("robot", asset.Robot.Red);
        this.game.load.image("robot2", asset.Robot.Basic);
        this.game.load.image("iron", asset.Iron.Basic);
    }

    create() {
        // Create the world objects here.
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
        this.robot = new model.Robot("smallRobot", 17, 3, model.Direction.NORTH,
                                     this.modelWorld, this.foreground, "robot");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    instantiateObject(className: string, varName: string): model.WorldObject {
        if (!this.modelWorld.passable(17, 4)) {
            return null;
        }
        return new model.Robot(varName, 17, 4, model.Direction.WEST,
                               this.modelWorld, this.foreground, "robot2");
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
        Blockly.Blocks.oop.faded['controls_repeat_ext'] = true;
    }
}
