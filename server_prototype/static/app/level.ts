declare var Blockly: any;

import TooltipView = require("views/tooltip");
import PubSub = require("pubsub");
import * as python from "execution/python";
import {Session} from "execution/session";

export interface Objective<T> {
    objective: string,
    completed: boolean,
    predicate: (level: T) => boolean,
}

/**
 * An abstraction of the Blockly toolbox, i.e. what blocks and
 * categories to show to the user.
 */
export class Toolbox {
    private _tree: Document;
    private _objectParent: Element;
    private _classes: string[];
    private _objects: [string, string][];

    constructor(toolbox?: string) {
        var _parser = new DOMParser();
        if (toolbox) {
            this._tree = _parser.parseFromString(toolbox, "text/xml");
        }
        else {
            this._tree = _parser.parseFromString("<xml></xml>", "text/xml");
        }

        this._classes = [];
        this._objects = [];
        this._objectParent = this._tree.querySelector("category[name='Objects']");
    }

    /**
     * Add the methods of a class to the toolbox.
     */
    addClass(className: string, image: string, classObject: any, methodList?: any[]) {
        this._classes.push(className);

        let methods: [string, string][] = [];
        if (!methodList) {
            methodList = Object.getOwnPropertyNames(classObject.prototype)
                .sort()
                .map(function(property) {
                    return classObject.prototype[property];
                });
        }
        methodList
            .forEach(function(method) {
                if (method.friendlyName) {
                    methods.push([method.friendlyName, method.funcName]);
                }
            });
        Blockly.Blocks.variables.addClass(className, image);
        Blockly.Blocks.setClassMethods(className, methods);

        // TODO: broadcast event indicating toolbox has been updated

        let category = this._tree.createElement("category");
        let method_type = "method_" + className;
        category.setAttribute("name", "class " + className);
        category.setAttribute("class", "blueprint");

        for (let method of methods) {
            let block = this._tree.createElement("block");
            block.setAttribute("type", method_type);
            let methodName = this._tree.createElement("field");
            methodName.setAttribute("name", "METHOD_NAME");
            methodName.textContent = method[1];
            block.appendChild(methodName);
            category.appendChild(block);
        }
        this._tree.documentElement.appendChild(category);
    }

    addObject(name: string, className: string) {
        if (this._classes.indexOf(className) < 0) {
            throw new ReferenceError(`Toolbox error: class ${className} does not exist.`);
        }

        let block = this._tree.createElement("block");
        block.setAttribute("type", "variables_get");
        let data = this._tree.createElement("data");
        data.textContent = className;
        block.appendChild(data);
        let field = this._tree.createElement("field");
        field.setAttribute("name", "VAR");
        field.textContent = name;
        block.appendChild(field);

        this._objectParent.appendChild(block);
        this._objects.push([name, className]);
    }

    getObjects(): [string, string][] {
        return this._objects;
    }

    /**
     * Get the XML representation of this toolbox.
     */
    xml() {
        return this._tree.documentElement;
    }
}

import Camera = require("camera");
export class BaseLevel extends Phaser.State {
    public event: PubSub.PubSub;

    public objectives: Objective<this>[];
    public toolbox: Toolbox;

    protected allTooltips: TooltipView.Tooltip[][];
    private _tooltipIndex: number;

    protected cursors: any;
    protected zoomCamera: Camera.ZoomCamera;

    protected background: Phaser.Group;
    protected middle: Phaser.Group;
    protected foreground: Phaser.Group;
    protected overlay: Phaser.Group;

    protected modelWorld: model.World;
    protected code: string;
    protected interpreter: python.Interpreter

    protected grid: Phaser.TileSprite;

    /**
     * The event that should be fired if objectives are updated.
     */
    public static OBJECTIVES_UPDATED = "objectivesUpdated";
    public static NEXT_LEVEL_LOADED = "nextLevelLoaded";
    public static BLOCK_EXECUTED = "blockExecuted";

    constructor() {
        super();

        this._tooltipIndex = 0;
        this.objectives = [];
        this.event = new PubSub.PubSub();
        this.code = "";

        this.init();
    }

    init() {

    }

    initWorld(map: Phaser.Tilemap) {
        this.modelWorld = new model.World(this.game, map);
        this.zoomCamera.setBounds(map.widthInPixels, map.heightInPixels);
    }

    preload() {
        // Resize the game when the layout changes
        this.game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
        // Let the game update even when it has no input focus
        this.game.stage.disableVisibilityChange = true;
        this.game.load.image("grid", "assets/sprites/grid.png");
    }

    create() {
        this.zoomCamera = new Camera.ZoomCamera(this.game);
        this.background = this.game.add.group(this.zoomCamera.group);
        this.middle = this.game.add.group(this.zoomCamera.group);
        this.foreground = this.game.add.group(this.zoomCamera.group);
        this.overlay = this.game.add.group(this.zoomCamera.group);
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.zoom(true);
        this.zoomCamera.update();

        this.grid = this.overlay.add(this.game.add.tileSprite(0, 0, this.game.width, this.game.height, "grid"));
    }

    update() {
        this.zoomCamera.update();

        if (!this.game.input.activePointer.withinGame) return;

        // TODO: update the grid offset to match the camera (so that
        // we don't have to create a grid that covers the entire map,
        // which hurts performance)

        if (this.cursors.up.isDown) {
            this.zoomCamera.position.y -= 4;
        }
        else if (this.cursors.down.isDown) {
            this.zoomCamera.position.y += 4;
        }
        else if (this.cursors.left.isDown) {
            this.zoomCamera.position.x -= 4;
        }
        else if (this.cursors.right.isDown) {
            this.zoomCamera.position.x += 4;
        }
    }

    render() {
    }

    isComplete(): boolean {
        for (let objective of this.objectives) {
            if (!objective.completed) {
                return false;
            }
        }
        return true;
    }

    nextTooltips() {
        this._tooltipIndex =
            (this._tooltipIndex + 1) % this.allTooltips.length;
    }

    setTooltipIndex(index: number) {
        if (index < 0 || index >= this.allTooltips.length) {
            throw new RangeError(`Invalid tooltip index: ${index}`);
        }

        this._tooltipIndex = index;
    }

    setCode(code: string) {
        this.code = code;
    }

    tooltips(): TooltipView.Tooltip[] {
        return this.allTooltips[this._tooltipIndex];
    }

    run(): Session {
        return new Session(this.interpreter, this.modelWorld.log, this.code, this.runDiff.bind(this));
    }

    runReset(): Promise<{}> {
        this.modelWorld.log.reset();
        // TODO: clean reset world by recreating map array?
        this.objectives.forEach((objective) => {
            objective.completed = false;
        });

        return new Promise((resolve, reject) => {
            this.modelWorld.log.replay((diff) => {
                return new Promise((resolve, reject) => {
                    // 1, not 0, because 0 is false to JS, i.e. it's
                    // the same as not passing the duration -.-
                    this.runDiff(diff, resolve, reject, 1);
                });
            }, true).then(() => {
                console.log("Done with reset");
                resolve();
            });
        });
    }

    runDiff(diff: model.Diff<any>, resolve: () => void, reject: () => void, animDuration?: number) {
        switch (diff.kind) {
        case model.DiffKind.BeginningOfBlock:
            this.event.broadcast(BaseLevel.BLOCK_EXECUTED, diff.data);
            resolve();
            break;

        case model.DiffKind.EndOfBlock:
            m.startComputation();
            let objectiveCompleted = false;

            for (let objective of this.objectives) {
                if (!objective.completed) {
                    objective.completed = objective.predicate(this);
                    objectiveCompleted = objectiveCompleted || objective.completed;
                }
            }

            if (objectiveCompleted) {
                setTimeout(() => {
                    this.event.broadcast(BaseLevel.OBJECTIVES_UPDATED);
                    resolve();
                }, 1500);
            }
            else {
                resolve();
            }
            m.endComputation();
            break;

        case model.DiffKind.EndOfInit:
            resolve();
            break;

        case model.DiffKind.Error:
            alert(diff.data);
            reject();
            break;

        case model.DiffKind.Property:
            let object = this.modelWorld.getObjectByID(diff.id);
            let tween = diff.tween(object, animDuration);
            if (!tween) {
                resolve();
                return;
            }
            tween.onComplete.add(() => {
                resolve();
            });
            tween.start();
            break;
        }
    }

    zoom(zoomed: boolean) {
        if (zoomed) {
            this.zoomCamera.scale.set(2, 2);
        }
        else {
            this.zoomCamera.scale.set(1, 1);
        }
    }
}

import model = require("model/model");
