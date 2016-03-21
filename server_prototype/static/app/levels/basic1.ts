import * as model from "../model/model";
import {BaseLevel, Toolbox} from "../level";
import * as TooltipView from "../views/tooltip";
import * as python from "../execution/python";

//will need some changes
import {BasicsLevel2} from "./basic2";

// Just put the robot and action into the box?
// Reason: lots of scaffolding at first, break it down later?
const INITIAL_TOOLBOX = `
<xml style="display: none">
  <category name="Toolbox" colour="210">
    <block type="tell"></block>
  </category>
  <category name="Objects" colour="330">
    <block type="variables_get">
      <data>Robot</data>
      <field name="VAR">robot</field>
    </block>
  </category>
</xml>
`;

export class BasicsLevel1 extends BaseLevel {
    public robot: model.Robot;
    public iron: model.Iron;
    public iron2: model.Iron;

    init() {
        super.init();

        this.toolbox = new Toolbox(INITIAL_TOOLBOX);
        this.toolbox.addClass("Robot", "assets/sprites/robot_3Dblue.png", model.Robot);

        this.objectives = [
            {
                objective: "Move the robot",
                completed: false,
                predicate: (level) => {
                    return level.robot.getX() === 2 && level.robot.getY() === 1;
                }
            },
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Controls, "Load your code onto the robot and run it."),
                new TooltipView.Tooltip(TooltipView.Region.Toolbox, "Pick blocks from here…"),
                new TooltipView.Tooltip(TooltipView.Region.Workspace, "…and drop them here to control the robot."),
            ]
        ];
    }

    preload() {
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

        let robot = this.foreground.create(16, 16, "robot");
        robot.width = robot.height = 16;

        let iron = this.middle.create(80, 16, "iron");
        let iron2 = this.middle.create(160, 16, "iron");

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.initWorld(map);
        this.robot = new model.Robot("Robot", 1, 1, model.Direction.EAST,
                                     robot, this.modelWorld);
        this.iron = new model.Iron("iron", 5, 1, iron, this.modelWorld);
        this.iron2 = new model.Iron("iron2", 10, 1, iron2, this.modelWorld);

        this.modelWorld.log.recordInitEnd();

        this.interpreter = new python.Interpreter("", this.modelWorld);
        this.interpreter.instantiateObject("robot", "Robot", this.robot.getID());
    }

    nextLevel(): BasicsLevel2 {
        // Return the level that should be loaded after this one. Add
        // it to the state manager so that Phaser will begin
        // preloading it while the congratulations screen displays.
        let level = new BasicsLevel2();
        this.game.state.add("Next", level, true);
        return level;
    }
}
