import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

// Just put the robot and action into the box?
// Reason: lots of scaffolding at first, break it down later?

export class BasicsLevel1 extends BaseLevel {
    public robot: model.Robot;
    public iron: model.Iron;

    private fallback: HTMLElement;

    initialize() {
        super.initialize();

        this.missionTitle = "First Night";

        this.toolbox = new Toolbox(true);
        this.toolbox.addControl("tell");
        this.toolbox.addControl("new");
        this.toolbox.addClasses(["Robot"]);
        let methods = this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.selfDestruct,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.pickUpUnderneath,
        ]);
        this.toolbox.addClass("Object", asset.Robot.Basic, model.WorldObject, []);

        let object = this.toolbox.addObject("robot", "Robot");

        this.fallback = this.toolbox.addControl("tell", false, [], [
            ["OBJECT", object.cloneNode(true)],
            ["METHOD", methods[0].cloneNode(true)],
        ]);

        let headlessWorkspace = new Blockly.Workspace();
        this.objectives = [
            {
                objective: `Implement turnLeft for the robot [${asset.Robot.Basic}]`,
                completed: false,
                predicate: (level) => {
                    let impl = level.program.savegame.load({
                        className: "Robot",
                        method: "turnLeft"
                    });
                    headlessWorkspace.clear();
                    if (impl.workspace) {
                        Blockly.Xml.domToWorkspace(headlessWorkspace, impl.workspace);

                        // What Blockly considers a "top block" is the
                        // first block in a stack of connected
                        // blocks. So if they're all connected,
                        // there's only one "top block".
                        let allTopBlocks: any[] = [];
                        for (let block of headlessWorkspace.getTopBlocks()) {
                            while (block) {
                                allTopBlocks.push(block);
                                block = block.getNextBlock();
                            }
                        }
                        console.log(allTopBlocks);
                        return allTopBlocks.length === 3;
                    }
                    return false;
                }
            },

            {
                objective: `Turn the robot [${asset.Robot.Basic}] north`,
                completed: false,
                predicate: (level) => {
                    return level.robot.orientation === model.Direction.NORTH;
                }
            },
        ];

        this.allTooltips = [
            [
                new TooltipView.Tooltip(TooltipView.Region.Controls, "Load your code onto the robot and run it."),
                new TooltipView.Tooltip(TooltipView.Region.Toolbox, "Pick blocks from here…"),
                new TooltipView.Tooltip(TooltipView.Region.Workspace, "…and drop them here to control the robot."),
                new TooltipView.Tooltip(TooltipView.Region.ButtonBar, "Edit methods here!"),
            ],
        ];

        this.hierarchy = {
            name: "Object",
            children: [
                {
                    name: "Robot",
                    children: [],
                    methods: ["moveForward", "turnRight"],
                    userMethods: ["turnLeft", "vacuum"],
                },
            ],
        };
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave.png");
        this.game.load.tilemap("prototype", "assets/maps/prototype.json", null, Phaser.Tilemap.TILED_JSON);
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
        this.iron = new model.Iron("iron", 2, 1,
                                   this.modelWorld, this.middle, "iron");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    fallbackWorkspace(context: EditorContext): HTMLElement {
        if (context.className === MAIN) {
            return Blockly.Xml.textToDom(`<xml>${this.fallback.outerHTML}</xml>`);
        }
        return super.fallbackWorkspace(context);
    }

    canUseCodeEditor(context: EditorContext): boolean {
        return (context.className === "Robot" && context.method === "turnLeft") ||
            context.className === MAIN;
    }

    canUseBlockEditor(context: EditorContext): boolean {
        return !(context.className === "Robot" && context.method === "vacuum");
    }

    instantiateObject(className: string, varName: string): model.WorldObject {
        if (this.modelWorld.getObjectByLoc(1, 2).length > 0) {
            return null;
        }
        return new model.Robot(varName, 1, 2, model.Direction.EAST,
                               this.modelWorld, this.foreground, "robot");
    }

}
