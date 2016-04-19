import * as model from "model/model";
import {EditorContext, MAIN} from "model/editorcontext";
import {BaseLevel, Toolbox} from "level";
import * as TooltipView from "views/tooltip";
import * as python from "execution/python";
import * as asset from "asset";

export class BackToBase extends BaseLevel {
    public robot: model.Robot;

    private fallback: HTMLElement[];

    initialize() {
        super.initialize();

        this.missionTitle = "Doing Donuts";
        this.missionText = [
            "You've escaped the cave. Head back to base."
        ];

        this.toolbox = new Toolbox();
        this.toolbox.addControl("tell");
        this.toolbox.addControl("controls_repeat");

        this.toolbox.addClass("Robot", asset.Robot.Basic, model.Robot, [
            model.Robot.prototype.moveForward,
            model.Robot.prototype.turnRight,
            model.Robot.prototype.turnLeft,
        ]);

        this.toolbox.addObject("robot", "Robot");

        this.fallback = <HTMLElement[]> [
            this.toolbox.addControl("tell", false, [], []),
        ];

        this.objectives = [
            {
                objective: `Move the robot [${asset.Robot.Basic}] back to base [${asset.Misc.Base}]`,
                completed: false,
                predicate: (level) => {
                    return level.robot.getX() === 7 && level.robot.getY() === 4;
                }
            },
        ];

        this.allTooltips = [
            [],
        ];

        this.setUpFading();
    }

    preload() {
        super.preload();

        this.game.load.image("tiles", "assets/tilesets/cave2.png");
        this.game.load.tilemap("outside", "assets/maps/small_world.json", null, Phaser.Tilemap.TILED_JSON);
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

        this.initWorld(map);

        this.robot = new model.Robot("robot", 2, 3, model.Direction.SOUTH,
                                     this.modelWorld, this.foreground, "robot");

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
        return 10;
    }

    setUpFading() {
        Blockly.Blocks.oop.clearFaded();
        Blockly.Blocks.oop.faded['tell'] = true;
    }
}
