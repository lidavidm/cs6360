import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class RobotRescueLevel1 extends BaseLevel {
    //public robot: model.Robot;
    public brokenRobot: model.Robot;
    //public NewRobot: model.Robot;

    initialize() {
        super.initialize();

        this.missionTitle = "Recyling";
        this.missionText = [
            "Now that you're back at base, get rid of the robot with that awkward turn left function.",
            "You can INSTANTIATE a new one with the 'new' block, using the new blue prints."
        ];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addControl("new");
        this.toolbox.addClasses(["BrokenRobot", "NewRobot"]);
        this.toolbox.addClass("NewRobot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
            model.Robot.prototype.mine,
        ]);

        this.toolbox.addClass("BrokenRobot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.selfDestruct,
        ]);

        this.toolbox.addObject("brokenRobot", "BrokenRobot");


        this.toolbox.addControl("controls_repeat_ext");
        this.toolbox.addNumber(0);

        this.objectives = [
            {
                objective: `Destroy the old robot [${asset.Robot.Basic}]`,
                completed: false,
                predicate: (level) => {
                    return this.brokenRobot.destructed;
                }
            },
            {
                objective: `Construct a new robot [${asset.Robot.Basic}]`,
                completed: false,
                predicate: (level) => {
                    for (let object of this.modelWorld.getObjectByLoc(17, 4)){
                        if (object !== null && object.getName() !== "brokenRobot"){
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
                    name: "BrokenRobot",
                    children: [],
                    methods: ["selfDestruct"],
                    userMethods: [],
                },
                {
                    name: "NewRobot",
                    children: [],
                    methods: ["moveForward", "turnRight", "turnLeft", "mine"],
                    userMethods: ["advance"],
                },
            ],
        };
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("outside", "assets/maps/outside.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("robot", asset.Robot.Basic);
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
        this.brokenRobot = new model.Robot("brokenRobot", 17, 4, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    instantiateObject(className: string, varName: string): model.WorldObject {
        if (!this.modelWorld.passable(17, 4)) {
            return null;
        }
        return new model.Robot(varName, 17, 4, model.Direction.WEST,
                               this.modelWorld, this.foreground, "robot");
    }
}
