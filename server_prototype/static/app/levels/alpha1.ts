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
import * as python from "../execution/python";

export class Alpha1Level extends BaseLevel {
    // Any model objects you need (besides the world, which is defined
    // as modelWorld. NOTE: this.world is the Phaser world!)
    public robot: model.Robot;
    public iron: model.Iron;

    initialize() {
        super.initialize();

        // Create the toolbox and add the class. The toolbox object
        // scrapes the methods from the class - just specify the name
        // and the image to use to symbolize it
        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addControl("new");
        this.toolbox.addControl("controls_repeat");
        this.toolbox.addControl("controls_if");
        this.toolbox.addControl("logic_compare");
        this.toolbox.addControl("logic_operation");
        this.toolbox.addControl("logic_negate");
        this.toolbox.addControl("math_arithmetic");
        this.toolbox.addControl("math_single");

        this.toolbox.addClass("Robot", "assets/sprites/robot_3Dblue.png", model.Robot);
        this.toolbox.addObject("robot", "Robot");
        this.toolbox.addClasses(["Robot", "number"]);
        this.toolbox.addNumber(4);
        this.toolbox.addBooleans();

        this.hierarchy = {
            name: "object",
            children: [
                {
                    name: "Robot",
                    methods: [ "turnLeft", "turnRight", "moveForward", "moveBackward", ],
                    userMethods: [ "test", ],
                },
            ]
        };

        // Define the objectives. The predicate is checked after
        // executing each block. It will be run if and only if the
        // objective is not completed; once completed the predicate
        // won't be rechecked (so an objective, once completed, cannot
        // become uncompleted unless the user resets the level)
        this.objectives = [
            {
                objective: "Move the robot to the iron",
                completed: false,
                predicate: (level) => {
                    return level.robot.getX() === 5 && level.robot.getY() === 1;
                }
            },
            {
                objective: "Take the iron",
                completed: false,
                predicate: (level) => {
                    console.log("Robot is holding: ", level.robot.lastPickedUp());
                    return level.robot.holding(level.iron);
                }
            },
            {
                objective: "Move the robot back to base",
                completed: false,
                predicate: (level) => {
                    return level.objectives[1].completed &&
                        level.robot.getX() === 1 && level.robot.getY() === 1;
                }
            },
        ];

        // List of lists of tooltips.
        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Map, "Use the arrow keys to look around the map and see what's going on."),
                new TooltipView.Tooltip(TooltipView.Region.Objectives, "Here's what Mission Control said to do."),
                new TooltipView.Tooltip(TooltipView.Region.Controls, "Load your code onto the robot and run it."),
                new TooltipView.Tooltip(TooltipView.Region.Toolbox, "Pick blocks from here…"),
                new TooltipView.Tooltip(TooltipView.Region.Workspace, "…and drop them here to control the robot."),
            ]
        ];
    }

    preload() {
        // Preload any Phaser assets you need. See the methods of
        // Phaser.Loader (this.game.load):
        // http://phaser.io/docs/2.4.6/Phaser.Loader.html
        super.preload();

        this.game.load.tilemap("prototype", "assets/maps/prototype.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("tiles", "assets/tilesets/cave.png");
        this.game.load.image("robot", "assets/sprites/robot_3Dblue.png");
        this.game.load.image("iron", "assets/sprites/iron.png");
    }

    create() {
        // Create the world objects here.
        super.create();

        let map = this.game.add.tilemap("prototype");
        map.addTilesetImage("cave", "tiles");
        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.initWorld(map);
        this.robot = new model.Robot("robot", 1, 1, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");


        this.iron = new model.Iron("iron", 5, 1,
                                   this.modelWorld, this.middle, "iron");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    canUseBlockEditor(context: EditorContext): boolean {
        return context.className !== MAIN;
    }

    canUseCodeEditor(context: EditorContext): boolean {
        return context.className === MAIN;
    }
}
