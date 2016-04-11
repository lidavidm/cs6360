import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class HierarchyLevel3 extends BaseLevel {
    public robot: model.Robot;
    public robot2: model.Robot;
    public iron: model.Iron;
    public iron2: model.Iron;
    public iron3: model.Iron;
    public iron4: model.Iron;

    initialize() {
        super.initialize();

        this.missionTitle = "Generation Gap";
        this.missionText = [
            "Use both of your robots to pick up some Iron! (feel free to make more, too!)",
            "Note that the new one can't use advance because a SUPERCLASS doesn't have access to SUBCLASS information.",
        ];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addControl("new");
        this.toolbox.addClasses(["Robot"]);
        this.toolbox.addClass("SmallRobot", asset.Robot.Red, model.Robot, [
            model.Robot.prototype.moveForward,
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
        this.toolbox.addObject("robot", "Robot");

        this.toolbox.addControl("controls_repeat_ext");
        this.toolbox.addNumber(0);

        this.objectives = [
            {
                objective: `Collect 1 Iron with smallRobot [${asset.Robot.Red}]`,
                completed: false,
                predicate: (level) => {
                    return this.robot.lastPickedUp() !== null;
                }
            },
            {
                objective: `Collect 1 Iron with robot [${asset.Robot.Basic}]`,
                completed: false,
                predicate: (level) => {
                    return this.robot2.lastPickedUp() !== null;
                }
            },
            {
                objective: `Collect 4 Iron [${asset.Iron.Basic}] total.`,
                completed: false,
                predicate: (level) => {
                    for (let object of this.modelWorld.getObjectByLoc(13, 3)){
                        if (object !== null && object.getName() === "iron"){
                            return false;
                        }
                    }
                    for (let object of this.modelWorld.getObjectByLoc(14, 5)){
                        if (object !== null && object.getName() === "iron2"){
                            return false;
                        }
                    }
                    for (let object of this.modelWorld.getObjectByLoc(18, 8)){
                        if (object !== null && object.getName() === "iron3"){
                            return false;
                        }
                    }
                    for (let object of this.modelWorld.getObjectByLoc(16, 10)){
                        if (object !== null && object.getName() === "iron4"){
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
                    name: "Robot",
                    children: [
                        {
                            name: "SmallRobot",
                            children: [],
                            methods: ["moveForward", "turnRight", "mine"],
                            userMethods: ["advance"],
                        },
                    ],
                    methods: ["moveForward", "turnRight", "turnLeft", "mine"],
                    userMethods: [],
                },
            ],
        };
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
        this.robot2 = new model.Robot("robot", 17, 4, model.Direction.WEST,
                                    this.modelWorld, this.foreground, "robot2");

        this.iron = new model.Iron("iron", 13, 3,
                                   this.modelWorld, this.middle, "iron");
        this.iron2 = new model.Iron("iron1", 14, 5,
                                   this.modelWorld, this.middle, "iron");
        this.iron3 = new model.Iron("iron2", 18, 8,
                                   this.modelWorld, this.middle, "iron");
        this.iron4 = new model.Iron("iron3", 16, 10,
                                  this.modelWorld, this.middle, "iron");


        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    instantiateObject(className: string, varName: string): model.WorldObject {
        if (!this.modelWorld.passable(17, 4)) {
            return null;
        }

        let sprite: string;

        if ( className === "SmallRobot" ){
            sprite = "robot";
        }
        else{
            sprite = "robot2";
        }

        return new model.Robot(varName, 17, 4, model.Direction.WEST,
                               this.modelWorld, this.foreground, "robot");
    }
}
