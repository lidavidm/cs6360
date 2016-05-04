import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class MovementLevel1 extends BaseLevel {
    public robot: model.Robot;
    public gate: model.Gate;

    private fallback: HTMLElement[];

    initialize() {
        super.initialize();

        this.missionTitle = "Test Drive";

        this.toolbox = new Toolbox();

        let tells = this.toolbox.addControl("tell");

        let methods = this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
        ]);

        let object = this.toolbox.addObject("robot", "Robot");

        let fallbackObject = <HTMLElement> object.cloneNode(true);
        let fallbackMethod = <HTMLElement> methods[0].cloneNode(true);
        let fallbackTell = <HTMLElement> this.toolbox.addControl("tell", false, [], []);

        fallbackObject.setAttribute("x", "220");
        fallbackObject.setAttribute("y", "100");
        fallbackMethod.setAttribute("x", "350");
        fallbackMethod.setAttribute("y", "100");

        fallbackTell.setAttribute("x", "250");
        fallbackTell.setAttribute("y", "0");

        this.fallback = <HTMLElement[]> [
            fallbackTell,
            fallbackObject,
            fallbackMethod,
        ];

        this.objectives = [
            {
                objective: `Move the robot [${asset.Robot.Basic}] forward`,
                completed: false,
                predicate: (level) => {
                    return level.robot.getX() === 2 && level.robot.getY() === 2;
                }
            },
        ];

        this.allTooltips = [
            [
                // Leaving these around just in case
                // However, I think they are unneccessary
                // new TooltipView.Tooltip(TooltipView.Region.Controls,
                //     "Load your code onto the robot and run it."),
                // new TooltipView.Tooltip(TooltipView.Region.Workspace,
                //     "A command has already been prepped for you!"),
            ],
        ];

        this.missionText = [
            "This is Mission Control! The volcano erupted in the middle of your mining trip!",
            "Test if your robot is still online by telling it to move forward."
        ];
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("lava", "assets/maps/lava.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("robot", asset.Robot.Basic);
        this.game.load.image("gate", asset.Gate.Basic);
    }

    create() {
        // Create the world objects here.
        super.create();

        let map = this.game.add.tilemap("lava");

        map.addTilesetImage("cave2", "tiles");

        let layer = map.createLayer(
            "Tile Layer 1", this.game.width, this.game.height, this.background);

        let layer2 = map.createLayer(
            "Tile Layer 2", this.game.width, this.game.height, this.background);

        this.initWorld(map);

        this.robot = new model.Robot("robot", 1, 2, model.Direction.EAST,
                                     this.modelWorld, this.foreground, "robot");
        this.gate = new model.Gate("gate", 7, 8, this.modelWorld,
                                   this.foreground, "gate");

        this.modelWorld.log.recordInitEnd();
        this.program.instantiateGlobals(this.modelWorld, this.toolbox);
    }

    fallbackWorkspace(context: EditorContext): HTMLElement {
        if (context.className === MAIN) {
            let doc = this.fallback.map((node) => {
                return node.outerHTML;
            }).join("\n");
            return Blockly.Xml.textToDom(`<xml>${doc}</xml>`);
        }
        return super.fallbackWorkspace(context);
    }

    blockLimit(context: EditorContext): number {
        return 3;
    }
}
