// Copyright 2016 David Li, Michael Mauer, Andy Jiang

// This file is part of Tell Me to Survive.

// Tell Me to Survive is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Tell Me to Survive is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with Tell Me to Survive.  If not, see <http://www.gnu.org/licenses/>.

import * as PubSub from "pubsub";
import {SavedClasses} from "savegame";
import {EditorContext} from "model/editorcontext";
import * as python from "execution/python";
import {Program} from "execution/program";
import {Session} from "execution/session";
import {ObjectHierarchy} from "views/hierarchy";
import * as TooltipView from "views/tooltip";

export interface Objective<T> {
    objective: string,
    completed: boolean,
    predicate: (level: T, completed?: { [id: number]: boolean }) => boolean,
}

/**
 * An abstraction of the Blockly toolbox, i.e. what blocks and
 * categories to show to the user.
 */
export class Toolbox {
    private _tree: Document;
    private _inline: boolean;
    private _objectParent: Element;
    private _controlParent: Element;
    private _classParent: Element;
    private _classes: string[];
    private _objects: [string, string][];
    private _userObjects: {
        [name: string]: string
    };
    private _enableSuper: boolean;
    private _classText: string;

    private static INLINE_XML: string = `<xml></xml>`;
    private static CATEGORY_XML: string = `
<xml>
  <category name="Commands" colour="120">
  </category>
  <category name="Objects" colour="330">
  </category>
</xml>
`;

    constructor(inline=false, classText="blueprint", enableSuper=false) {
        let parser = new DOMParser();
        this._tree = parser.parseFromString(inline ? Toolbox.INLINE_XML : Toolbox.CATEGORY_XML, "text/xml");
        this._inline = inline;
        this._enableSuper = enableSuper;
        this._classes = [];
        this._objects = [];
        this._userObjects = {};
        this._objectParent = inline ? this._tree.documentElement : this._tree.querySelector("category[name='Objects']");
        this._controlParent = inline ? this._tree.documentElement : this._tree.querySelector("category[name='Commands']");
        this._classParent = null;
        this._classText = classText;
    }

    /**
     * Add the methods of a class to the toolbox.
     */
    addClass(className: string, image: string, classObject: any, methodList?: any[]): HTMLElement[] {
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
                    methods.push([method.friendlyName, method.funcName, method.returnType]);
                }
            });
        Blockly.Blocks.variables.addClass(className, image);
        Blockly.Blocks.setClassMethods(className, methods);

        let category = this._tree.createElement("category");
        if (this._inline) {
            category = this._tree.documentElement;
        }
        else {
            this._tree.documentElement.appendChild(category);
        }

        let method_type = "method_" + className;
        category.setAttribute("name", this._classText + " " + className);
        category.setAttribute("class", "blueprint");

        let method_blocks: HTMLElement[] = [];
        for (let method of methods) {
            let block = this._tree.createElement("block");
            block.setAttribute("type", method_type);
            let methodName = this._tree.createElement("field");
            methodName.setAttribute("name", "METHOD_NAME");
            methodName.textContent = method[1];
            block.appendChild(methodName);
            category.appendChild(block);
            method_blocks.push(block);
        }

        if (methods.length === 0) {
            let block = this._tree.createElement("block");
            block.setAttribute("type", "no_methods");
            block.setAttribute("disabled", "true");
            category.appendChild(block);
        }

        return method_blocks;
    }

    addUserMethod(className: string, methodName: string): HTMLElement {
        if (this._classes.indexOf(className) === -1) return null;

        let methodType = "method_" + className;
        let method = this._tree.createElement("block");
        method.setAttribute("type", methodType);
        let name = this._tree.createElement("field");
        name.setAttribute("name", "METHOD_NAME");
        name.textContent = methodName;
        method.appendChild(name);

        if (this._inline) {
            this._tree.documentElement.appendChild(method);
        }
        else {
            let category = this._tree.querySelector(`category[name="class ${className}"]`);
            if (!category) return null;
            category.appendChild(method);
        }

        // TODO: use some sanitizing function to generate a valid code name
        Blockly.Blocks.addUserMethod(className, [methodName, methodName, null]);
        return method;
    }

    addObject(name: string, className: string): HTMLElement {
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

        return block;
    }

    setUserObjects(objects: { [name: string]: string }): boolean {
        let changed = false;
        for (let name in objects) {
            let className = objects[name];
            if (className !== this._userObjects[name]) {
                changed = true;
            }

            if (this._classes.indexOf(className) < 0) {
                throw new ReferenceError(`Toolbox error: class ${className} does not exist.`);
            }
        }

        for (let name in this._userObjects) {
            if (this._userObjects[name] != objects[name]) {
                changed = true;
            }
        }

        this._userObjects = objects;
        return changed;
    }

    addControl(name: string, insert=true, fields?: [string, any][], values?: [string, any][], data?: string) {
        let block = this._tree.createElement("block");
        block.setAttribute("type", name);

        if (fields) {
            fields.forEach(([name, val]) => {
                let field = this._tree.createElement("field");
                field.setAttribute("name", name);
                if (val instanceof Element) {
                    field.appendChild(val);
                }
                else {
                    field.innerHTML = val;
                }
                block.appendChild(field);
            });
        }
        if (values) {
            values.forEach(([name, val]) => {
                let value = this._tree.createElement("value");
                value.setAttribute("name", name);
                if (val instanceof Element) {
                    value.appendChild(val);
                }
                else {
                    value.innerHTML = val;
                }
                block.appendChild(value);
            });
        }

        if (data) {
            let dataEl = this._tree.createElement("data");
            dataEl.textContent = data;
            block.appendChild(dataEl);
        }

        if (insert) {
            this._controlParent.appendChild(block);
        }
        return block;
    }

    addNumber(value=0): HTMLElement {
        let block = this._tree.createElement("block");
        block.setAttribute("type", "math_number");
        let field = this._tree.createElement("field");
        field.setAttribute("name", "NUM");
        field.textContent = value.toString();
        block.appendChild(field);

        this._objectParent.appendChild(block);

        return block;
    }

    addBooleans(): [HTMLElement, HTMLElement] {
        let trueBlock = this._tree.createElement("block");
        trueBlock.setAttribute("type", "logic_boolean");
        let field = this._tree.createElement("field");
        field.setAttribute("name", "BOOL");
        field.textContent = "TRUE";
        trueBlock.appendChild(field);

        this._objectParent.appendChild(trueBlock);

        let falseBlock = this._tree.createElement("block");
        falseBlock.setAttribute("type", "logic_boolean");
        field = this._tree.createElement("field");
        field.setAttribute("name", "BOOL");
        field.textContent = "FALSE";
        falseBlock.appendChild(field);

        this._objectParent.appendChild(falseBlock);

        return [trueBlock, falseBlock];

    }

    addClasses(classNames: string[]): HTMLElement[] {
        Blockly.Blocks.setClassObjects(classNames);
        if (!this._classParent) {
            let category = this._tree.createElement("category");
            category.setAttribute("name", "Classes");
            category.setAttribute("colour", "240");
            this._tree.documentElement.appendChild(category);
            this._classParent = category;
        }
        return classNames.map((className) => {
            let block = this._tree.createElement("block");
            block.setAttribute("type", "class");
            let field = this._tree.createElement("field");
            field.setAttribute("name", "CLASS_NAME");
            field.textContent = className;
            block.appendChild(field);

            this._classParent.appendChild(block);
            // this._objects.push([name, className]);

            return block;
        });
    }

    getClasses(): string[] {
        return this._classes;
    }

    getObjects(): [string, string][] {
        return this._objects;
    }

    private _addUserObjects(element: HTMLElement): HTMLElement {
        let objectParent = this._inline ? element : element.querySelector("category[name=Objects]");
        for (let name in this._userObjects) {
            let className = this._userObjects[name];
            let block = this._tree.createElement("block");
            block.setAttribute("type", "variables_get");
            let data = this._tree.createElement("data");
            data.textContent = className;
            block.appendChild(data);
            let field = this._tree.createElement("field");
            field.setAttribute("name", "VAR");
            field.textContent = name;
            block.appendChild(field);

            objectParent.appendChild(block);
        }

        return element;
    }

    /**
     * Get the XML representation of this toolbox.
     */
    xml(): HTMLElement {
        return this._addUserObjects(<HTMLElement> this._tree.documentElement.cloneNode(true));
    }

    methodXml(context: EditorContext, hierarchy: ObjectHierarchy): HTMLElement {
        let className = context.className;
        let clone = <HTMLElement> this._tree.documentElement.cloneNode(true);
        let objects = clone.querySelectorAll("block[type='variables_get']");
        Array.prototype.slice.call(objects).forEach(function(node: HTMLElement) {
            node.remove();
        });
        let block = this._tree.createElement("block");
        block.setAttribute("type", "variables_get");
        let data = this._tree.createElement("data");
        data.textContent = className;
        block.appendChild(data);
        let field = this._tree.createElement("field");
        field.setAttribute("name", "VAR");
        field.textContent = "self";
        block.appendChild(field);

        if (this._inline) {
            clone.appendChild(block);
        }
        else {
            clone.querySelector("category[name='Objects']").appendChild(block);
        }

        // Search for the parent class
        let queue = [[hierarchy, null]];
        let foundParent: ObjectHierarchy = null;
        while (queue.length > 0) {
            let [root, parent] = queue.pop();
            if (!root) break;
            if (root.name === className) {
                foundParent = parent;
                break;
            }

            if (root.children) {
                for (let child of root.children) {
                    queue.push([child, root]);
                }
            }
        }

        if (foundParent && this._enableSuper) {
            block = this._tree.createElement("block");
            block.setAttribute("type", "variables_get");
            data = this._tree.createElement("data");
            data.textContent = foundParent.name;
            block.appendChild(data);
            field = this._tree.createElement("field");
            field.setAttribute("name", "VAR");
            field.textContent = "super";
            block.appendChild(field);

            if (this._inline) {
                clone.appendChild(block);
            }
            else {
                clone.querySelector("category[name='Objects']").appendChild(block);
            }
        }

        // Remove the method that we're currently editing
        let nameNodes = clone.querySelectorAll("field[name='METHOD_NAME']");
        for (let i = 0; i < nameNodes.length; i++) {
            let name = nameNodes[i];
            if (name.textContent === context.method) {
                name.parentNode.parentNode.removeChild(name.parentNode);
            }
        }

        return this._addUserObjects(clone);
    }
}

import Camera = require("camera");
export class BaseLevel extends Phaser.State {
    public event: PubSub.PubSub;

    /**
     * The effective class hierarchy to use for this level.
     */
    public hierarchy: ObjectHierarchy;
    /**
     * The objectives to complete for this level.
     */
    public objectives: Objective<this>[];
    /**
     * The program (codegen helper).
     */
    public program: Program;
    /**
     * The Blockly toolbox helper.
     */
    public toolbox: Toolbox;
    /**
     * The description of the mission presented at the beginning.
     */
    public missionText: string[];
    /**
     * The title of the mission presented at the beginning.
     */
    public missionTitle: string;
    /**
     * A flag controlling whether the player can add arbitrary
     * methods. Defaults to false. A level can "predefine" custom user
     * methods in its object hierarchy, by setting the userMethods
     * array.
     *
     * @property
     * @see views/hierarchy/ObjectHierarchy
     */
    public allowArbitraryUserMethods: boolean;

    protected allTooltips: TooltipView.Tooltip[][];
    private _tooltipIndex: number;

    protected cursors: any;
    protected zoomCamera: Camera.ZoomCamera;

    protected background: Phaser.Group;
    protected middle: Phaser.Group;
    protected foreground: Phaser.Group;
    protected flying: Phaser.Group;
    protected overlay: Phaser.Group;

    protected modelWorld: model.World;
    protected interpreter: python.Interpreter

    protected grid: Phaser.TileSprite;

    /**
     * The event that should be fired if objectives are updated.
     */
    public static OBJECTIVES_UPDATED = "objectivesUpdated";
    public static NEXT_LEVEL_LOADED = "nextLevelLoaded";
    public static BLOCK_EXECUTED = "blockExecuted";
    public static BLOCK_ERROR = "blockError";
    public static WORKSPACE_UPDATED = "workspaceUpdated";
    public static TOOLBOX_UPDATED = "toolboxUpdated";
    public static CONTEXT_CHANGED = "contextChanged";

    constructor() {
        super();

        this._tooltipIndex = 0;
        this.hierarchy = null;
        this.objectives = [];
        this.event = new PubSub.PubSub();

        this.missionTitle = "Mission";
        this.missionText = ["This is the default mission text. If you're seeing this, please report it to the developers.", "This is part 2 of the mission text."];

        this.allowArbitraryUserMethods = false;

        this.initialize();
        this.program = new Program(this.hierarchy, this.blockLimit.bind(this));
    }

    initialize() {
    }

    initWorld(map: Phaser.Tilemap) {
        this.modelWorld = new model.World(this.game, map);
        this.zoomCamera.setBounds(map.widthInPixels, map.heightInPixels);
        this.interpreter = new python.Interpreter(this, this.modelWorld);
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
        this.flying = this.game.add.group(this.zoomCamera.group);
        this.overlay = this.game.add.group(this.zoomCamera.group);
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.zoomCamera.scale.set(3, 3);
        this.zoomCamera.update();

        this.grid = this.overlay.add(this.game.add.tileSprite(0, 0, this.game.width, this.game.height, "grid"));
    }

    /** Level design methods - meant to be overridden! **/

    /**
     * Provide default blocks for a method/main. Fall back to super()
     * if you don't care/don't know.
     */
    fallbackWorkspace(context: EditorContext): HTMLElement {
        return Blockly.Xml.textToDom("<xml></xml>");
    }

    /**
     * Decide whether a particular method/main can use the code editor.
     */
    canUseCodeEditor(context: EditorContext): boolean {
        return false;
    }

    /**
     * Decide whether a particular method/main can use the block editor.
     */
    canUseBlockEditor(context: EditorContext): boolean {
        return true;
    }

    /**
     * Return the limit on the number of blocks, or null if there is
     * no limit.
     */
    blockLimit(context: EditorContext): number {
        return null;
    }

    /**
     * If the code spawns a new object, do so, providing the
     * appropriate sprite, layer, and initial location.
     */
    instantiateObject(className: string, varName: string): model.WorldObject {
        return null;
    }

    /**
     * Load user methods from the hierarchy.
     */
    loadHierarchy(savedClasses: SavedClasses) {
        let classList = this.toolbox.getClasses();

        let flatHierarchy = Object.create(null);
        let traverseHierarchy = (root: ObjectHierarchy) => {
            flatHierarchy[root.name] = root;
            if (root.children) {
                root.children.forEach(traverseHierarchy);
            }
        };
        if (this.hierarchy) {
            traverseHierarchy(this.hierarchy);
        }

        for (let className in savedClasses) {
            let userMethods: string[] = [];
            if (flatHierarchy[className]) {
                if (!flatHierarchy[className].userMethods) {
                    flatHierarchy[className].userMethods = [];
                }
                userMethods = flatHierarchy[className].userMethods;
            }

            if (classList.indexOf(className) > -1) {
                for (let method in savedClasses[className]) {
                    if (userMethods.indexOf(method) === -1) {
                        userMethods.push(method);
                    }
                }
            }
        }

        for (let className in flatHierarchy) {
            let userMethods = flatHierarchy[className].userMethods || [];
            for (let method of userMethods) {
                this.toolbox.addUserMethod(className, method);
                if (!savedClasses[className]) {
                    savedClasses[className] = {};
                }
                if (!savedClasses[className][method]) {
                    savedClasses[className][method] = Blockly.Xml.textToDom("<xml></xml>");
                }
            }
        }

        Blockly.Blocks.oop.setHierarchy(this.hierarchy);
    }

    lastX: number = null;
    lastY: number = null;

    update() {
        this.zoomCamera.update();

        // TODO: update the grid offset to match the camera (so that
        // we don't have to create a grid that covers the entire map,
        // which hurts performance)

        if (this.game.input.mousePointer.isUp) {
            this.lastX = this.lastY = null;
        }
        else if (this.game.input.mousePointer.isDown) {
            if (this.lastX !== null) {
                let dx = this.game.input.mousePointer.position.x - this.lastX;
                let dy = this.game.input.mousePointer.position.y - this.lastY;
                this.zoomCamera.position.x -= dx / 1.5;
                this.zoomCamera.position.y -= dy / 1.5;
            }
            this.lastX = this.game.input.mousePointer.position.x;
            this.lastY = this.game.input.mousePointer.position.y;
        }

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

    isCodeValid(): boolean {
        return this.program.isCodeValid();
    }

    tooltips(): TooltipView.Tooltip[] {
        return this.allTooltips[this._tooltipIndex] || [];
    }

    run(speed: _mithril.MithrilProperty<number>): Session {
        return new Session(this.interpreter, this.modelWorld.log, this.program, this.runDiff.bind(this, speed));
    }

    runReset(): Promise<{}> {
        this.modelWorld.log.reset();
        // TODO: clean reset world by recreating map array?
        this.objectives.forEach((objective) => {
            objective.completed = false;
        });

        return new Promise((resolve, reject) => {
            this.modelWorld.log.replay((diff, initialized) => {
                return new Promise((resolve, reject) => {
                    this.runDiff(m.prop(0), diff, initialized, resolve, reject, true);
                });
            }, true).then(() => {
                resolve();
            });
        });
    }

    private checkObjectives(initialized: { [id: number]: boolean }, resolve: () => void) {
        m.startComputation();
        let objectiveCompleted = false;

        for (let objective of this.objectives) {
            if (!objective.completed) {
                objective.completed = objective.predicate(this, initialized);
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
    }

    runDiff(speed: _mithril.MithrilProperty<number>, diff: model.Diff<any>, initialized: { [id: number]: boolean }, resolve: () => void, reject: () => void, resetting=false) {
        switch (diff.kind) {
        case model.DiffKind.BeginningOfBlock:
            this.event.broadcast(BaseLevel.BLOCK_EXECUTED, diff.data);
            resolve();
            break;

        case model.DiffKind.EndOfBlock:
            resolve();
            break;

        case model.DiffKind.EndOfInit:
            if (!resetting) {
                this.checkObjectives(initialized, resolve);
            }
            break;

        case model.DiffKind.Error:
            this.event.broadcast(BaseLevel.BLOCK_ERROR, diff.data);
            reject();
            break;

        case model.DiffKind.Initialized:
        case model.DiffKind.Property:
            let object = this.modelWorld.getObjectByID(diff.id);
            if (resetting) {
                var tween = diff.tween(object, 1);
            } else {
                var tween = diff.tween(object, 800 * 1 / speed());
            }
            if (!tween) {
                if (!resetting) {
                    this.checkObjectives(initialized, resolve);
                } else {
                    resolve();
                }
                return;
            }
            let lastTween = tween;
            // Wait for the last tween in a series of chained tweens
            // to complete
            while (lastTween.chainedTween) {
                lastTween = lastTween.chainedTween;
            }
            lastTween.onComplete.add(() => {
                if (!resetting) {
                    this.checkObjectives(initialized, resolve);
                } else {
                    resolve();
                }
            });

            // Tween camera to center on object
            let p = object.getPhaserObject();
            let cameraTween = this.zoomCamera.centerOn(
                p.position,
                p.width,
                p.height);
            if (!resetting && cameraTween !== null) {
                cameraTween.onComplete.add(() => {
                    tween.start();
                });
                cameraTween.start();
            }
            else {
                tween.start();
            }
            break;
        }
    }
}

import model = require("model/model");
