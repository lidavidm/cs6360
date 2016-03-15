import * as model from "../model/model";
import {BaseLevel, Toolbox} from "../level";
import * as TooltipView from "../views/tooltip";
import * as python from "../execution/python";

import {Alpha2Level} from "./alpha2";

export class Alpha1Level extends BaseLevel {
    public modelWorld: model.World;
    public robot: model.Robot;
    public iron: model.Iron;
    public interpreter: python.Interpreter

    init() {
        super.init();

        let initialToolbox = document.getElementById("toolbox").textContent;
        this.toolbox = new Toolbox(initialToolbox);
        this.toolbox.addClass("Robot", "assets/sprites/robot_3Dblue.png", model.Robot);

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

        this.modelWorld.log.recordInitEnd();
    }

    run() {
        super.run();

        // this.robot.moveForward();
        // this.modelWorld.log.recordBlockEnd();
        // this.robot.moveForward();
        // this.modelWorld.log.recordBlockEnd();
        // this.robot.moveForward();
        // this.modelWorld.log.recordBlockEnd();
        // this.robot.moveForward();
        // this.modelWorld.log.recordBlockEnd();
        // this.robot.pickUpUnderneath();
        // this.modelWorld.log.recordBlockEnd();
        // this.robot.moveBackward();
        // this.modelWorld.log.recordBlockEnd();
        // this.robot.moveBackward();
        // this.modelWorld.log.recordBlockEnd();
        // this.robot.moveBackward();
        // this.modelWorld.log.recordBlockEnd();
        // this.robot.moveBackward();
        // this.modelWorld.log.recordBlockEnd();

        var initCode = `class Robot:
    def __init__(self, id):
        self.id = id
    def moveForward(self):
        methodCall(self.id, "moveForward", [])
    def moveBackward(self):
        methodCall(self.id, "moveBackward", [])
    def pickUpUnderneath(self):
        methodCall(self.id, "pickUpUnderneath", [])`

        var code = `robot.moveForward()
recordBlockEnd()
robot.moveForward()
recordBlockEnd()
robot.moveForward()
recordBlockEnd()
robot.moveForward()
recordBlockEnd()
robot.pickUpUnderneath()
recordBlockEnd()
robot.moveBackward()
recordBlockEnd()
robot.moveBackward()
recordBlockEnd()
robot.moveBackward()
recordBlockEnd()
robot.moveBackward()
recordBlockEnd()`

        this.interpreter = new python.Interpreter(initCode, code, this.modelWorld);
        this.interpreter.instantiateObject('robot', 'Robot', 0);
        this.interpreter.run();

        console.log(this.modelWorld.log);
        let reset = false;
        this.modelWorld.log.replay((diff) => {
            console.log(diff);
            return new Promise((resolve, reject) => {
                if (typeof diff === "number") {
                    if (diff === model.SpecialDiff.EndOfInit) {
                        reset = true;
                    }
                    else if (diff === model.SpecialDiff.EndOfBlock) {
                        console.log("Block end");
                        m.startComputation();
                        for (let objective of this.objectives) {
                            if (!objective.completed) {
                                objective.completed = objective.predicate(this);
                            }
                        }

                        this.event.broadcast(BaseLevel.OBJECTIVES_UPDATED);
                        m.endComputation();
                    }
                    resolve();
                }
                else if (reset) {
                    let object = this.modelWorld.getObjectByID(diff.id);
                    let tween = diff.tween(object);
                    if (!tween) {
                        resolve();
                        return;
                    }
                    tween.onComplete.add(() => {
                        resolve();
                    });
                    tween.start();
                }
                else {
                    resolve();
                }
            });
        });
    }

    nextLevel(): Alpha2Level {
        let level = new Alpha2Level();
        this.game.state.add("Next", level, true);
        return level;
    }
}