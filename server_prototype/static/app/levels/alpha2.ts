import * as model from "../model/model";
import {BaseLevel, Toolbox} from "../level";
import * as TooltipView from "../views/tooltip";

const TOOLBOX = `
<xml style="display: none">
  <category name="Toolbox" colour="210">
    <block type="controls_repeat_ext"></block>
    <block type="controls_if"></block>
    <block type="tell"></block>
  </category>
  <category name="Objects" colour="330">
    <block type="math_number"></block>
    <block type="variables_get">
      <field name="CLASS">Robot</field>
      <field name="VAR">robot</field>
    </block>
  </category>
</xml>
`;

export class Alpha2Level extends BaseLevel {
    public modelWorld: model.World;
    public robot: model.Robot;
    public iron: model.Iron;

    init() {
        super.init();

        this.toolbox = new Toolbox(TOOLBOX);
        this.toolbox.addClass("Robot", "assets/sprites/robot_3Dblue.png", model.Robot);

        this.objectives = [
            {
                objective: "Search for iron",
                completed: false,
                predicate: (level) => {
                    return level.robot.getX() === 5 && level.robot.getY() === 1;
                }
            },
            {
                objective: "Take the iron",
                completed: false,
                predicate: (level) => {
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
        super.preload();

        this.game.load.tilemap("prototype", "assets/maps/prototype.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("tiles", "assets/tilesets/cave.png");
        this.game.load.image("robot", "assets/sprites/robot_3Dblue.png");
        this.game.load.image("iron", "assets/sprites/iron.png");
    }

    create() {
        super.create();

        let map = this.game.add.tilemap("prototype");
        map.addTilesetImage("cave", "tiles");
        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        let robot = this.foreground.create(16, 16, "robot");
        robot.width = robot.height = 16;

        let iron = this.middle.create(80, 16, "iron");

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.modelWorld = new model.World(map);
        this.robot = new model.Robot("Robot", 1, 1, model.Direction.EAST,
                                     robot, this.modelWorld);
        this.iron = new model.Iron("iron", 5, 1, iron, this.modelWorld);
    }
}
