import * as model from "../model/model";
import {BaseLevel, Toolbox} from "../level";
import * as TooltipView from "../views/tooltip";
import * as python from "../execution/python";

import {Alpha2Level} from "./alpha2";

// Define the toolbox here. See documentation at
// https://developers.google.com/blockly/installation/toolbox
// This does NOT include methods - see below
const INITIAL_TOOLBOX = `
<xml style="display: none">
  <category name="Toolbox" colour="210">
    <block type="controls_repeat_ext"></block>
    <block type="tell"></block>
  </category>
  <category name="Objects" colour="330">
    <block type="math_number"></block>
    <block type="variables_get">
      <data>Robot</data>
      <field name="VAR">robot</field>
    </block>
  </category>
</xml>
`;

export class Alpha1Level extends BaseLevel {
    // Any model objects you need (besides the world, which is defined
    // as modelWorld. NOTE: this.world is the Phaser world!)
    public robot: model.Robot;
    public iron: model.Iron;

    init() {
        super.init();

        // Create the toolbox and add the class. The toolbox object
        // scrapes the methods from the class - just specify the name
        // and the image to use to symbolize it
        this.toolbox = new Toolbox(INITIAL_TOOLBOX);
        this.toolbox.addClass("Robot", "assets/sprites/robot_3Dblue.png", model.Robot);
        this.toolbox.addObject("robot", "Robot");

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
                    console.log("Robot is holding: ", level.robot.holding());
                    return level.robot.holding() === level.iron;
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

        // The only reason why this isn't created for you is because
        // of its dependence on the world.
        this.interpreter = new python.Interpreter("", this.modelWorld, this.toolbox);
        this.interpreter.instantiateAll();
    }

    nextLevel(): Alpha2Level {
        // Return the level that should be loaded after this one. Add
        // it to the state manager so that Phaser will begin
        // preloading it while the congratulations screen displays.
        let level = new Alpha2Level();
        this.game.state.add("Next", level, true);
        return level;
    }
}
