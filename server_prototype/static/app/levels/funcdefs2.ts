import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class FuncDefsLevel2 extends BaseLevel {
    public robot: model.Robot;
    public iron: model.Iron;

    initialize() {
        super.initialize();

        this.missionTitle = "Restock";
        this.missionText = [
            "Your robot's mining functionality is back online!",
            "Pick up some iron on the way back to base.",
        ];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addClass("SmallRobot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.mine,
        ]);
        this.toolbox.addObject("smallRobot", "SmallRobot");

        this.toolbox.addControl("controls_repeat_ext");
        this.toolbox.addNumber(0);

        this.objectives = [
            {
                objective: `Pick up some Iron [${asset.Iron.Basic}].`,
                completed: false,
                predicate: (level) => {
                    return level.robot.lastPickedUp() != null;
                }
            },
            {
                objective: `Return to base.`,
                completed: false,
                predicate: (level) => {
                    return level.objectives[0].completed &&
                        level.robot.getX() === 17 && level.robot.getY() === 4;
                }
            },
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Toolbox,
                    "Use your new function to get to the iron!"),
                new TooltipView.Tooltip(TooltipView.Region.ButtonBar,
                    "Hint: save time by putting a loop repeatedly telling the robot to move forward inside a function"),
            ],
        ];

        this.hierarchy = {
            name: "object",
            children: [
                {
                    name: "SmallRobot",
                    children: [],
                    methods: ["moveForward", "turnRight", "mine"],
                    userMethods: ["temporaryLeft", "advance"],
                },
            ],
        };
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("outside", "assets/maps/outside.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("robot", asset.Robot.Basic);
        this.game.load.image("iron", "assets/sprites/iron.png");
    }

    create() {
        // Create the world objects here.
        super.create();

        let map = this.game.add.tilemap("outside");
        map.addTilesetImage("cave2", "tiles");

        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        let layer2 = map.createLayer(
            "Tile Layer 2", this.game.width, this.game.height, this.background);

        this.cursors = this.game.input.keyboard.createCursorKeys();

        this.initWorld(map);
        this.robot = new model.Robot("smallRobot", 2, 3, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");
        this.iron = new model.Iron("iron", 4, 5,
                                   this.modelWorld, this.middle, "iron");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }
}
