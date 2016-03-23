import * as model from "model/model";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

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
  </category>
</xml>
`;

export class BasicsLevel1 extends BaseLevel {
    public robot: model.Robot;
    public iron: model.Iron;

    init() {
        super.init();

        this.toolbox = new Toolbox(INITIAL_TOOLBOX);
        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
        ]);
        this.toolbox.addObject("robot", "Robot");

        this.objectives = [
            {
                objective: `Move the robot [${asset.Robot.Basic}] forward`,
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
            ],
        ];
    }

    preload() {
        super.preload();

        this.game.load.tilemap("prototype", "assets/maps/prototype.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("tiles", "assets/tilesets/cave.png");
        this.game.load.image("robot", asset.Robot.Basic);
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

        this.interpreter = new python.Interpreter("", this.modelWorld, this.toolbox);
        this.interpreter.instantiateAll();
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
