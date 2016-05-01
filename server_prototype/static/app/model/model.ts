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

export function blocklyMethod(funcName: string, friendlyName: string, returnType?: string, args?: [string, string][]): PropertyDecorator {
    return function(target: any, propertyKey: string) {
        target[propertyKey].funcName = funcName;
        target[propertyKey].friendlyName = friendlyName;
        target[propertyKey].returnType = returnType || null;
        target[propertyKey].args = args || [];
    };
}

export const TILE_WIDTH = 16;
export const TILE_HEIGHT = 16;
export const ANIM_DURATION = 800;

export interface PropertyDiff {
    [property: string]: [any, any],
}

export enum DiffKind {
    // When a block starts executing.
    BeginningOfBlock,
    // When a block finishes executing.
    EndOfBlock,
    // When we have finished initializing world objects.
    EndOfInit,
    // When an error is raised.
    Error,
    // When a property is changed
    Property,
    // When an object is created on the fly
    Initialized,
}

export class Diff<T extends WorldObject> {
    kind: DiffKind;
    data: any;
    id: number;
    properties: PropertyDiff;

    static EndOfInit = new Diff(DiffKind.EndOfInit);

    constructor(kind: DiffKind, data?: any, id?: number, properties?: PropertyDiff) {
        this.kind = kind;
        this.data = data;
        this.id = id;
        this.properties = properties;
    }

    tween(object: T, duration=ANIM_DURATION): Phaser.Tween {
        return null;
    }

    apply(world: World, object: T) {
        Object.keys(this.properties).forEach((property) => {
            let change = this.properties[property];
            (<any> object)[property] = change[1];
        });
    }
}

class InitializedDiff extends Diff<any> {
    constructor(id: number) {
        super(DiffKind.Initialized, id, id);
    }

    tween(object: any, duration=ANIM_DURATION): Phaser.Tween {
        let p = object.getPhaserObject();
        if (p === null) return null;

        let width = p.width;
        let height = p.height;
        p.width = 0;
        p.height = 0;

        let tween = p.game.add.tween(p).to({
            alpha: 1,
            width: width,
            height: height,
        }, duration, Phaser.Easing.Bounce.InOut);
        tween.onComplete.add(() => {
            object.initialized = true;
        });
        return tween;
    }

    apply(world: World, object: any) {
        ;
    }
}

class MovementDiff<T extends WorldObject> extends Diff<T> {
    constructor(id: number, properties: PropertyDiff) {
        super(DiffKind.Property, null, id, properties);
    }

    tween(object: T, duration=ANIM_DURATION): Phaser.Tween {
        let p = object.getPhaserObject();
        if (p === null) return null;
        if (object instanceof PlatformPiece) {
            duration = 1;
        }
        let tween = p.game.add.tween(p.position).to({
            x: object.getX() * TILE_WIDTH + TILE_WIDTH / 2,
            y: object.getY() * TILE_HEIGHT + TILE_HEIGHT / 2,
        }, duration, Phaser.Easing.Quadratic.InOut);

        return tween;
    }

    apply(world: World, object: T) {
        world.removeObject(object);
        super.apply(world, object);
        world.addObject(object);
    }
}

class StuckDiff<T extends WorldObject> extends Diff<T> {
    constructor(id: number) {
        super(DiffKind.Property, null, id, {});
    }

    tween(object: T, duration=ANIM_DURATION): Phaser.Tween {
        let p = object.getPhaserObject();
        if (p === null) return null;

        let t1 = p.game.add.tween(p).to({
            x: p.position.x - 2,
            alpha: 0.5,
        }, duration / 3, Phaser.Easing.Bounce.Out);
        let t2 = p.game.add.tween(p).to({
            x: p.position.x + 2,
            alpha: 1,
        }, duration / 3, Phaser.Easing.Bounce.Out);
        let t3 = p.game.add.tween(p).to({
            x: p.position.x,
        }, duration / 3, Phaser.Easing.Bounce.Out);
        return t1.chain(t2.chain(t3));
    }

    apply(world: World, object: T) {
        ;
    }
}

interface HasOrientation extends WorldObject {
    orientation: Direction;
}

class OrientationDiff<T extends HasOrientation> extends Diff<T> {
    constructor(id: number, properties: PropertyDiff) {
        super(DiffKind.Property, null, id, properties);
    }

    tween(object: T, duration=ANIM_DURATION): Phaser.Tween {
        let p = object.getPhaserObject();
        if (p === null) return null;

        p.rotation = (p.rotation + 2 * Math.PI) % (2 * Math.PI);

        let rotation = 0;
        switch (object.orientation) {
        case Direction.NORTH:
            rotation = 3 * Math.PI/2;
            break;
        case Direction.SOUTH:
            rotation = Math.PI/2;
            break;
        case Direction.EAST:
            rotation = 0;
            break;
        case Direction.WEST:
            rotation = Math.PI;
            break;
        }

        if (Math.abs(p.rotation - rotation) > Math.PI) {
            if (rotation > p.rotation) {
                rotation -= 2 * Math.PI;
            }
            else {
                rotation += 2 * Math.PI;
            }
        }

        let tween = p.game.add.tween(p).to({
            rotation: rotation,
        }, duration / 2, Phaser.Easing.Linear.None);

        let obj = <any> object;
        if (obj.shadow) {
            let sx = 1;
            let sy = 1;

            switch (object.orientation) {
            case Direction.NORTH:
                sx = -1;
                sy = 1;
                break;
            case Direction.SOUTH:
                sx = 1;
                sy = -1;
                break;
            case Direction.EAST:
                sx = 1;
                sy = 1;
                break;
            case Direction.WEST:
                sx = -1;
                sy = -1;
                break;
            }

            let shadowTween = p.game.add.tween(obj.shadow).to({
                x: sx,
                y: sy,
            }, duration / 2, Phaser.Easing.Linear.None);
            tween.onStart.add(() => {
                shadowTween.start();
            });
        }

        return tween;
    }
}

class SelfDestructDiff extends Diff<Robot> {
    constructor(id: number) {
        super(DiffKind.Property, null, id, {});
    }

    tween(object: Robot, duration=ANIM_DURATION): Phaser.Tween {
        let p = object.getPhaserObject();

        let t1 = p.game.add.tween(p).to({
            x: p.position.x - 5,
            y: p.position.y - 5,
        }, duration / 2, Phaser.Easing.Bounce.In);
        let t2 = p.game.add.tween(p).to({
            x: p.position.x + 5,
            y: p.position.y + 5,
        }, duration / 2, Phaser.Easing.Bounce.In);
        let t3 = p.game.add.tween(p).to({
            x: p.position.x,
            y: p.position.y,
            alpha: 0,
        }, duration, Phaser.Easing.Bounce.In);
        return t1.chain(t2.chain(t3));
    }

    apply(world: World, object: Robot) {
        object.destructed = true;
    }
}

class HoldingDiff extends Diff<Robot> {
    constructor(id: number, properties: PropertyDiff) {
        super(DiffKind.Property, null, id, properties);
    }

    tween(object: Robot, duration=ANIM_DURATION): Phaser.Tween {
        let holder = object.getPhaserObject();
        let t1 = holder.game.add.tween(holder).to({
            rotation: holder.rotation + 8 * Math.PI,
        }, duration, Phaser.Easing.Quadratic.InOut);

        let holding = object.lastPickedUp();
        if (holding === null) return t1;
        let p = holding.getPhaserObject();

        let t2 = p.game.add.tween(p).to({
            width: p.width + 32,
            height: p.height + 32,
            alpha: 0,
        }, duration, Phaser.Easing.Quadratic.InOut);
        t2.onStart.add(() => {
            t1.start();
        });

        t1.onComplete.add(() => {
            holder.rotation -= 8 * Math.PI;
        });

        return t2;
    }
}

class VisibilityDiff extends Diff<Gate> {
    target_alpha: number;

    constructor(id: number, target_alpha: number) {
        super(DiffKind.Property, null, id);
        this.target_alpha = target_alpha;
    }

    tween(object: Gate, duration=(ANIM_DURATION/2)): Phaser.Tween {
        let p = object.getPhaserObject();
        let t = p.game.add.tween(p).to({
            alpha: this.target_alpha,
        }, duration, Phaser.Easing.Quadratic.InOut);
        return t;
    }

    apply(world: World, object: Gate) {
        if (this.target_alpha === 0) {
            object.opened = true;
        }
        else {
            object.opened = false;
        }
    }
}

export class Log {
    log: Diff<any>[];
    initialized: boolean;
    world: World;
    // Records whether objects created on the fly were initialized
    dynamicObjects: number[];

    constructor(world: World) {
        this.log = [];
        this.initialized = false;
        this.world = world;
        this.dynamicObjects = [];
    }

    /**
     * Clears log entries after the end of initialization, and removes
     * user-created objects.
     */
    reset() {
        for (let id of this.dynamicObjects) {
            let object = this.world.getObjectByID(id);
            object.getPhaserObject().destroy();
            this.world.removeObject(object);
        }
        this.dynamicObjects = [];
        let index = this.log.indexOf(Diff.EndOfInit);
        if (index >= 0) {
            this.log.splice(index + 1);
        }
    }

    record<T extends WorldObject>(diff: Diff<T>) {
        this.log.push(diff);
    }

    recordInitEnd() {
        this.initialized = true;
        this.log.push(Diff.EndOfInit);
    }

    recordInitialized(object: WorldObject) {
        if (this.initialized) {
            let id = object.getID();
            object.initialized = false;
            this.log.push(new InitializedDiff(id));
            this.dynamicObjects.push(id);
        }
    }

    recordBlockBegin(blockID: any) {
        this.log.push(new Diff(DiffKind.BeginningOfBlock, blockID));
    }

    recordBlockEnd(blockID: any) {
        this.log.push(new Diff(DiffKind.EndOfBlock, blockID));
    }

    replay(callback: (diff: Diff<any>, initialized: { [id: number]: boolean }) => Promise<{}>, replayInit=false): Promise<{}> {
        return new Promise((resolve, reject) => {
            let programCounter = 0;
            // Whether we are done with the reset steps.
            let reset = replayInit;

            let dynamicObjectsInitialized: {
                [id: number]: boolean,
            } = {};

            for (let id of this.dynamicObjects) {
                let object = this.world.getObjectByID(id);
                object.initialized = false;
            }

            let advanceStep = () => {
                programCounter++;
                if (programCounter < this.log.length) {
                    executor();
                }
                else {
                    resolve();
                }
            };

            let executor = () => {
                let diff = this.log[programCounter];

                let initialized = true;
                // If the object was created on the fly, update it
                // with the actual object ID
                if (this.dynamicObjects.indexOf(diff.id) > -1) {
                    if (typeof dynamicObjectsInitialized[diff.id] === "undefined") {
                        dynamicObjectsInitialized[diff.id] = false;
                    }
                    initialized = dynamicObjectsInitialized[diff.id];
                }

                switch (diff.kind) {
                case DiffKind.BeginningOfBlock:
                    break;
                case DiffKind.EndOfBlock:
                    break;
                case DiffKind.EndOfInit:
                    reset = true;
                    Object.keys(this.world.objects).forEach((id) => {
                        let object = this.world.getObjectByID(<any> id);
                        object.phaserReset();
                        // Make sure the object stays hidden
                        if (this.dynamicObjects.indexOf(parseInt(id, 10)) > -1) {
                            object.getPhaserObject().alpha = 0;
                        }
                    });
                    if (replayInit) {
                        resolve();
                        return;
                    }
                    break;
                case DiffKind.Error:
                    break;
                case DiffKind.Property:
                    let object = this.world.getObjectByID(diff.id);
                    diff.apply(this.world, object);
                    break;
                case DiffKind.Initialized:
                    let origID = diff.data;
                    dynamicObjectsInitialized[origID] = true;
                    let obj = this.world.getObjectByID(diff.id);
                    let p = obj.getPhaserObject();
                    p.alpha = 0;

                    initialized = true;
                }

                if (!initialized) {
                    advanceStep();
                }
                else if (reset) {
                    callback(diff, dynamicObjectsInitialized).then(advanceStep, () => {
                        resolve();
                        // aborted. do nothing.
                    });
                }
                else {
                    advanceStep();
                }
            };

            executor();
        });
    }
}

/**
 * Represents the enviornment of a single level.
 * Works in a 2D coordinate grid from 0 to maxX-1 and maxY-1
 * (0, 0) is in top left corner
 */
export class World {
    private maxX: number = 0;
    private maxY: number = 0;
    private nextID = 0;
    //things might be on top of each other.
    private map: WorldObject[][][];
    private tilemap: Phaser.Tilemap;
    //list of all objects by ID
    objects: { [id: number]: WorldObject} = {};
    objectsByName: { [name: string]: WorldObject } = {};

    game: Phaser.Game;
    log: Log;

    constructor(game: Phaser.Game, tilemap: Phaser.Tilemap) {
        this.game = game;
        this.log = new Log(this);

        this.maxX = tilemap.width;
        this.maxY = tilemap.height;
        this.map = [];
        for (let x = 0; x < this.maxX; x++) {
            let col: WorldObject[][] = [];
            for (let y = 0; y < this.maxY; y++) {
                let cell: WorldObject[] = [];
                col.push(cell);
            }
            this.map.push(col);
        }
        this.tilemap = tilemap;
    }

    getNewID() {
        return this.nextID++;
    }

    getMaxX() {
        return this.maxX;
    }

    getMaxY() {
        return this.maxY;
    }

    addObject(obj: WorldObject) {
        let x: number = obj.getX();
        let y: number = obj.getY();

        if (this.boundsOkay(x, y)) {
            this.map[x][y].push(obj);
            this.objects[obj.getID()] = obj;
            this.objectsByName[obj.getName()] = obj;
        }
        else {
            throw new RangeError("Trying to add object at invalid location: (" + x + ", " + y + ")");
        }
    }

    getObjectByLoc(x:number, y: number): WorldObject[] {
        if (this.boundsOkay(x, y)) {
            return this.map[x][y];
        }
        else {
            throw new RangeError("Trying to get object at invalid location: (" + x + ", " + y + ")");
        }
    }

    getObjectByID(id: number): WorldObject {
        let obj = this.objects[id];
        if (typeof obj !== "undefined") {
            return obj;
        }
        else {
            throw new Error(`No object with id ${id} found.`);
        }
    }

    getObjectByName(name: string): WorldObject {
        let obj = this.objectsByName[name];
        if (typeof obj !== "undefined") {
            return obj;
        }
        else {
            throw new Error(`No object with name ${name} found.`);
        }
    }

    removeObject(obj: WorldObject) {
        let x:number = obj.getX();
        let y:number = obj.getY();

        if (this.map[x][y].indexOf(obj) === -1) {
            return;
        }

        if (this.boundsOkay(x,y)) {
            this.map[x][y].splice(this.map[x][y].indexOf(obj), 1);
        }
        else {
            throw new RangeError("Trying to remove object at invalid location: (" + x + ", " + y + ")");
        }
    }

    passableTerrain(x: number, y: number): boolean {
        if (!this.boundsOkay(x, y)) return false;

        let tile = (<any> this.tilemap.layer).data[y][x];

        // Need explicit check because property may not be defined
        return tile.properties.passable !== "false";
    }

    passable(x: number, y: number): boolean {
        if (!this.passableTerrain(x, y)) return false;

        let objects = this.getObjectByLoc(x, y);
        for (let object of objects) {
            if (!object.passable()) {
                return false;
            }
        }

        return true;
    }

    private boundsOkay(x: number, y: number) {
        return x < this.maxX && y < this.maxY && x >= 0 && y >= 0;
    }
}

/**
 * Superclass for anything appearing in the world at some location.
 * All world objects have a name and a unique id.
 */
export abstract class WorldObject {
    protected name: string;
    protected id: number;
    protected x: number;
    protected y: number;

    protected world: World;

    protected phaserObject: Phaser.Group;

    // Flag used for objects created on the fly. Is always true unless
    // this object was created on the fly, in which case it is false
    // until we have reached the appropriate point in the log.
    public initialized: boolean;

    constructor(name: string, x: number, y: number, world: World) {
        // TODO: log a "created" event (in get ID?)
        this.name = name;
        this.world = world;
        this.id = this.world.getNewID();

        this.x = x;
        this.y = y;
        this.world.addObject(this);

        this.initialized = true;

        // Record ourselves in the log
        this.setLoc(x, y);
    }

    getPhaserObject(): any {
        return this.phaserObject;
    }

    /**
     * Reset the Phaser object of this world object.
     *
     * Intended to undo transformations after running user code.
     */
    phaserReset() {
    }

    getID(): number {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getX(): number {
        return this.x;
    }

    getY(): number {
        return this.y;
    }

    getWorld(): World {
        return this.world;
    }

    passable(): boolean {
        return true;
    }

    /*These set functions probably don't need animations/promises on them because
    * they probably aren't called by the user to move something. They just drop
    * something in its place
    */
    setX(x: number) {
        if (x >= 0 && x < this.world.getMaxX()) {
            let origX = this.x;
            this.world.removeObject(this);
            this.x = x;
            this.world.addObject(this);

            this.world.log.record(new MovementDiff(this.id, {
                x: [origX, x],
            }));
        }
        else {
            throw new RangeError("Trying to move object to invalid x coordinate: " + x);
        }
    }

    setY(y: number) {
        if (y >= 0 && y < this.world.getMaxY()) {
            let origY = this.y;

            this.world.removeObject(this);
            this.y = y;
            this.world.addObject(this);

            this.world.log.record(new MovementDiff(this.id, {
                y: [origY, y],
            }));
        }
        else {
            throw new RangeError("Trying to move object to invalid y coordinate: " + y);
        }
    }

    setLoc(x: number, y: number) {
        if (y >= 0 && y < this.world.getMaxY() &&
            x >= 0 && x < this.world.getMaxX()){
            let origX = this.x, origY = this.y;

            this.world.removeObject(this);
            this.x = x;
            this.y = y;
            this.world.addObject(this);

            this.world.log.record(new MovementDiff(this.id, {
                x: [origX, x],
                y: [origY, y],
            }));
        }
        else {
            throw new RangeError("Trying to move object to invalid location: (" + x + ", " + y + ")");
        }
    }
}

export enum Direction {
    NORTH,
    SOUTH,
    EAST,
    WEST,
};

function offsetDirection(x: number, y: number,
                         direction: Direction, distance=1):
[number, number] {
    switch (direction) {
    case Direction.NORTH:
        return [x, y - distance];
    case Direction.SOUTH:
        return [x, y + distance];
    case Direction.EAST:
        return [x + distance, y];
    case Direction.WEST:
        return [x - distance, y];
    }
};

/**
 * Superclass for any types of robots appearing in the world which can be
 * controlled by the player
 * Can optionally be constructed as holding something(s)
 */
export class Robot extends WorldObject {
    sprite: Phaser.Sprite;
    shadow: Phaser.Sprite;
    orientation: Direction;
    destructed: boolean;

    protected holdingIDs: number[];
    protected phaserObject: Phaser.Group;

    constructor(name: string, x: number, y: number, orientation: Direction,
                world: World, group: Phaser.Group, sprite: string) {
        super(name, x, y, world);
        this.destructed = false;
        this.phaserObject = world.game.add.group(group);
        this.phaserObject.position.x = TILE_WIDTH * x + TILE_WIDTH / 2;
        this.phaserObject.position.y = TILE_HEIGHT * y + TILE_WIDTH / 2;
        this.phaserObject.pivot.x = TILE_WIDTH / 2;
        this.phaserObject.pivot.y = TILE_HEIGHT / 2;
        this.shadow = this.phaserObject.create(1, 1, sprite);
        this.shadow.width = TILE_WIDTH;
        this.shadow.height = TILE_WIDTH;
        this.shadow.tint = 0x000000;
        this.shadow.alpha = 0.7;
        this.sprite = this.phaserObject.create(0, 0, sprite);
        this.sprite.width = TILE_WIDTH;
        this.sprite.height = TILE_HEIGHT;

        let circle = world.game.add.graphics(0, 0, this.phaserObject);
        circle.lineStyle(0.5, 0x22FF22, 0.5);
        circle.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);

        this.setOrientation(orientation);
        switch(orientation) {
        case Direction.NORTH:
            this.phaserObject.rotation = -Math.PI/2;
            break;
        case Direction.SOUTH:
            this.phaserObject.rotation = Math.PI/2;
            break;
        case Direction.EAST:
            this.phaserObject.rotation = 0;
            break;
        case Direction.WEST:
            this.phaserObject.rotation = Math.PI;
            break;
        }

        this.holdingIDs = [];
        this.hold(null);
    }

    setOrientation(orientation: Direction) {
        this.world.log.record(new OrientationDiff(this.id, {
            orientation: [this.orientation, orientation],
        }));
        this.orientation = orientation;
    }

    hold(object: WorldObject | number) {
        let orig = this.holdingIDs.slice(0);
        let newIDs = this.holdingIDs.slice(0);
        if (typeof object === "number") {
            newIDs.push(object);
        }
        else if (object === null) {
            // pass
        }
        else {
            newIDs.push(object.getID())
        }
        this.holdingIDs = newIDs.slice(0);
        this.world.log.record(new HoldingDiff(this.id, {
            holdingIDs: [orig, newIDs],
        }));
    }

    holding(object: WorldObject): boolean {
        for (var id of this.holdingIDs) {
            if (this.world.getObjectByID(id) === object) {
                return true;
            }
        }
        return false;
    }

    // Returns the last object that Robot picked up
    lastPickedUp(): WorldObject {
        if (this.holdingIDs.length === 0) {
            return null;
        }
        return this.world.getObjectByID(this.holdingIDs[this.holdingIDs.length - 1]);
    }

    passable(): boolean {
        return this.destructed;
    }

    phaserReset() {
        this.phaserObject.alpha = 1.0;
        this.destructed = false;
    }

    @blocklyMethod("selfDestruct", "self destruct")
    selfDestruct() {
        this.destructed = true;
        this.world.log.record(new SelfDestructDiff(this.id));
    }

    @blocklyMethod("moveForward", "move forward")
    moveForward() {
        let [x, y] = offsetDirection(this.x, this.y, this.orientation, 1);

        if (this.destructed) {
            throw new RangeError("Self destructed, can't move!");
        }
        else if (this.world.passable(x, y)) {
            this.setLoc(x, y);
        }
        else {
            this.world.log.record(new StuckDiff(this.getID()));
            throw new RangeError("Can't move forward! Tried: " + x + ", " + y);
        }
    }

    @blocklyMethod("canMoveForward", "can move forward", "Boolean")
    canMoveForward(): boolean {
        let [x, y] = offsetDirection(this.x, this.y, this.orientation, 1);
        return this.world.passable(x, y);
    }

    @blocklyMethod("moveBackward", "move backward")
    moveBackward() {
        let [x, y] = offsetDirection(this.x, this.y, this.orientation, -1);

        if (this.destructed) {
            throw new RangeError("Self destructed, can't move!");
        }
        else if (this.world.passable(x, y)) {
            this.setLoc(x, y);
        }
        else {
            this.world.log.record(new StuckDiff(this.getID()));
            throw new RangeError("Can't move backward! Tried: " + x + ", " + y);
        }
    }

    @blocklyMethod("turnRight", "turn right")
    turnRight() {
        if (this.destructed) {
            throw new RangeError("Self destructed, can't move!");
        }

        switch (this.orientation) {
        case Direction.NORTH:
            this.setOrientation(Direction.EAST);
            break;
        case Direction.EAST:
            this.setOrientation(Direction.SOUTH);
            break;
        case Direction.SOUTH:
            this.setOrientation(Direction.WEST);
            break;
        case Direction.WEST:
            this.setOrientation(Direction.NORTH);
            break;
        }
    }

    @blocklyMethod("turnLeft", "turn left")
    turnLeft() {
        if (this.destructed) {
            throw new RangeError("Self destructed, can't move!");
        }

        switch (this.orientation) {
        case Direction.NORTH:
            this.setOrientation(Direction.WEST);
            break;
        case Direction.EAST:
            this.setOrientation(Direction.NORTH);
            break;
        case Direction.SOUTH:
            this.setOrientation(Direction.EAST);
            break;
        case Direction.WEST:
            this.setOrientation(Direction.SOUTH);
            break;
        }
    }

    //todo: remove this method and make fracking robots extend MineRobot
    @blocklyMethod("mine", "mine")
    mine() {
        if (this.destructed) {
            throw new RangeError("Self destructed, can't pick up anything!");
        }

        let targets: WorldObject[] = this.world.getObjectByLoc(this.x, this.y);
        let target: WorldObject = null;

        for (let i = 0; i < targets.length; i++) {
            if (targets[i] !== this && targets[i] instanceof Iron) {
                target = targets[i];
                break;
            }
        }
        //TODO: this will need to choose WHICH thing to pick up?
        // if (target !== null && this.holdingID === null) {
        //     this.hold(target);
        // }
        this.hold(target);
    }
}

export class FrackingRobot extends Robot {
    mine() {
        if (this.destructed) {
            throw new RangeError("Self destructed, can't drill or pump!");
        }

        let targets: WorldObject[] = this.world.getObjectByLoc(this.x, this.y);

        for (let i = 0; i < targets.length; i++) {
            if (targets[i] instanceof FixedResource) {
                let target = <FixedResource> targets[i];
                target.mine();
                break;
            }
        }
    }
}

/**
 * Iron object (basic resource). Doesn't really do much right now
 * and will probably need to be refactored as gameplay elements are ironed out
 */
export class Iron extends WorldObject {
    sprite: Phaser.Sprite;

    phaserObject: Phaser.Group;

    constructor(name:string, x:number, y:number,
                world: World, group: Phaser.Group, sprite: string) {
        super(name, x, y, world);
        this.phaserObject = world.game.add.group(group);
        this.phaserObject.position.x = TILE_WIDTH * x + TILE_WIDTH / 2;
        this.phaserObject.position.y = TILE_HEIGHT * y + TILE_WIDTH / 2;
        this.phaserObject.pivot.x = TILE_WIDTH / 2;
        this.phaserObject.pivot.y = TILE_HEIGHT / 2;

        this.sprite = this.phaserObject.create(0, 0, sprite);
        this.sprite.width = TILE_WIDTH;
        this.sprite.height = TILE_HEIGHT;

        let circle = world.game.add.graphics(0, 0, this.phaserObject);
        circle.lineStyle(0.5, 0xFFA500, 0.5);
        circle.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);
        circle.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.63 * TILE_WIDTH);
    }

    passable(): boolean {
        return true;
    }

    phaserReset() {
        this.phaserObject.width = TILE_WIDTH;
        this.phaserObject.height = TILE_HEIGHT;
        this.phaserObject.alpha = 1.0;
    }
}

export class MineRobot extends Robot {
    /*
     * Tries to pick up one object on the same tile as this Robot. Which object
     * is unspecified. Returns a promise that is resolved once the target object's
     * pick up animation plays, or rejects if the object is not Iron
     */
    @blocklyMethod("mine", "mine")
    mine() {
        if (this.destructed) {
            throw new RangeError("Self destructed, can't pick up anything!");
        }

        let targets: WorldObject[] = this.world.getObjectByLoc(this.x, this.y);
        let target: WorldObject = null;

        for (let i = 0; i < targets.length; i++) {
            if (targets[i] !== this && targets[i] instanceof Iron) {
                target = targets[i];
                break;
            }
        }
        this.hold(target);
    }
}

export class Gate extends WorldObject {
    sprite: Phaser.Sprite;
    phaserObject: Phaser.Group;

    opened = false;

    constructor(name:string, x:number, y:number, world:World, group:Phaser.Group, sprite:string) {
        super(name, x, y, world);
        this.phaserObject = world.game.add.group(group);
        this.phaserObject.position.x = TILE_WIDTH * x + TILE_WIDTH / 2;
        this.phaserObject.position.y = TILE_HEIGHT * y + TILE_WIDTH / 2;
        this.phaserObject.pivot.x = TILE_WIDTH / 2;
        this.phaserObject.pivot.y = TILE_HEIGHT / 2;

        this.sprite = this.phaserObject.create(0, 0, sprite);
        this.sprite.width = TILE_WIDTH;
        this.sprite.height = TILE_HEIGHT;

        this.close();
    }

    passable() {
        return this.opened;
    }

    phaserReset() {
        this.phaserObject.alpha = 1.0;
        this.opened = false;
    }

    @blocklyMethod("open", "open")
    open() {
        this.opened = true;
        this.world.log.record(new VisibilityDiff(this.id, 0));
    }

    @blocklyMethod("close", "close")
    close() {
        this.opened = false
        this.world.log.record(new VisibilityDiff(this.id, 1));
    }
}

class RebootDiff<T extends HasOrientation> extends Diff<T> {
    constructor(id: number) {
        super(DiffKind.Property, null, id, {});
    }

    tween(object: T, duration: number): Phaser.Tween {
        let p = object.getPhaserObject();
        let [x, y] = offsetDirection(p.position.x, p.position.y, object.orientation, 8);
        let t1 = p.game.add.tween(p.position).to({
            x: x,
            y: y,
        }, duration / 2, Phaser.Easing.Quadratic.InOut);
        let t2 = p.game.add.tween(p.position).to({
            x: p.position.x,
            y: p.position.y,
        }, duration / 2, Phaser.Easing.Quadratic.InOut);
        t1.chain(t2);
        return t1;
    }
}

export class RescueRobot extends Robot {
    @blocklyMethod("rebootTarget", "rebootTarget")
    rebootTarget(): number {
        let [x, y] = offsetDirection(this.x, this.y, this.orientation, 1);
        let objects = this.world.getObjectByLoc(x, y);
        for (let object of objects) {
            if (object instanceof Drone) {
                this.world.log.record(new RebootDiff(this.getID()));
                object.activate();
                return object.getID();
            }
        }
        throw "No drone to reboot in front of me!";
    }
}

class DroneActivatedDiff extends Diff<Drone> {
    constructor(drone: Drone) {
        super(DiffKind.Property, null, drone.getID(), {
            activated: [false, true],
        });
    }

    tween(object: Drone, duration: number): Phaser.Tween {
        let p = object.getPhaserObject();
        return p.game.add.tween(object.sprite.position).to({
            y: -6,
        }, duration, Phaser.Easing.Quadratic.InOut);
    }
}

export class ObjectiveCircle extends WorldObject {
    constructor(name: string, x: number, y: number,
                world: World, group: Phaser.Group) {
        super(name, x, y, world);
        this.phaserObject = world.game.add.group(group);
        this.phaserObject.position.x = TILE_WIDTH * x + TILE_WIDTH / 2;
        this.phaserObject.position.y = TILE_HEIGHT * y + TILE_WIDTH / 2;
        this.phaserObject.pivot.x = TILE_WIDTH / 2;
        this.phaserObject.pivot.y = TILE_HEIGHT / 2;
        let circle = world.game.add.graphics(0, 0, this.phaserObject);
        circle.lineStyle(0.5, 0x10DE16, 0.5);
        circle.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);
        circle.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.63 * TILE_WIDTH);
    }
}

export class Drone extends WorldObject {
    sprite: Phaser.Sprite;
    shadow: Phaser.Sprite;
    activated: boolean;

    protected phaserObject: Phaser.Group;

    constructor(name: string, x: number, y: number,
                world: World, group: Phaser.Group, sprite: string) {
        super(name, x, y, world);
        this.activated = false;
        this.phaserObject = world.game.add.group(group);
        this.phaserObject.position.x = TILE_WIDTH * x + TILE_WIDTH / 2;
        this.phaserObject.position.y = TILE_HEIGHT * y + TILE_WIDTH / 2;
        this.phaserObject.pivot.x = TILE_WIDTH / 2;
        this.phaserObject.pivot.y = TILE_HEIGHT / 2;
        this.shadow = this.phaserObject.create(0, 2, sprite);
        this.shadow.width = TILE_WIDTH;
        this.shadow.height = TILE_WIDTH;
        this.shadow.tint = 0x000000;
        this.shadow.alpha = 0.7;
        this.sprite = this.phaserObject.create(0, 2, sprite);
        this.sprite.width = TILE_WIDTH;
        this.sprite.height = TILE_HEIGHT;

        let circle = world.game.add.graphics(0, 0, this.phaserObject);
        circle.lineStyle(0.5, 0x2222FF, 0.5);
        circle.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);
    }

    passable(): boolean {
        return this.activated;
    }

    phaserReset() {
        this.phaserObject.alpha = 1.0;
        this.sprite.position.y = 2;
        this.activated = false;
    }

    activate() {
        this.activated = true;
        this.world.log.record(new DroneActivatedDiff(this));
    }

    private _deltaY = -0.05;
    update() {
        if (this.activated) {
            this.sprite.position.y += this._deltaY;
            this.shadow.position.y += 0.5 * this._deltaY;
            if (this.sprite.position.y < -6) {
                this._deltaY = 0.05;
            }
            if (this.sprite.position.y > -3) {
                this._deltaY = -0.05;
            }
        }
    }

    @blocklyMethod("flyEast", "fly east")
    flyEast() {
        let [x, y] = offsetDirection(this.x, this.y, Direction.EAST, 1);

        if (!this.activated) {
            throw new RangeError("Can't fly, not activated! Rescue me first.");
        }
        else if (this.world.passableTerrain(x, y)) {
            this.setLoc(x, y);
        }
        else {
            this.world.log.record(new StuckDiff(this.id));
            throw new RangeError("Can't fly east! Tried: " + x + ", " + y);
        }
    }


    @blocklyMethod("flyNorth", "fly north")
    flyNorth() {
        let [x, y] = offsetDirection(this.x, this.y, Direction.NORTH, 1);

        if (!this.activated) {
            throw new RangeError("Can't fly, not activated! Rescue me first.");
        }
        else if (this.world.passableTerrain(x, y)) {
            this.setLoc(x, y);
        }
        else {
            this.world.log.record(new StuckDiff(this.id));
            throw new RangeError("Can't fly north! Tried: " + x + ", " + y);
        }
    }

    @blocklyMethod("flyWest", "fly west")
    flyWest() {
        let [x, y] = offsetDirection(this.x, this.y, Direction.WEST, 1);

        if (!this.activated) {
            throw new RangeError("Can't fly, not activated! Rescue me first.");
        }
        else if (this.world.passableTerrain(x, y)) {
            this.setLoc(x, y);
        }
        else {
            this.world.log.record(new StuckDiff(this.id));
            throw new RangeError("Can't fly west! Tried: " + x + ", " + y);
        }
    }

    @blocklyMethod("flySouth", "fly south")
    flySouth() {
        let [x, y] = offsetDirection(this.x, this.y, Direction.SOUTH, 1);

        if (!this.activated) {
            throw new RangeError("Can't fly, not activated! Rescue me first.");
        }
        else if (this.world.passableTerrain(x, y)) {
            this.setLoc(x, y);
        }
        else {
            this.world.log.record(new StuckDiff(this.id));
            throw new RangeError("Can't fly south! Tried: " + x + ", " + y);
        }
    }
}

class ResourceMinedDiff extends Diff<FixedResource> {
    constructor(resource: FixedResource, tintA: number, tintB: number, mined: boolean) {
        super(DiffKind.Property, null, resource.getID(), {
            tint: [tintA, tintB],
            mined: [!mined, mined],
        });
    }

    tween(object: FixedResource, duration=ANIM_DURATION): Phaser.Tween {
        let p = object.getPhaserObject();
        object.mask.tint = this.properties["tint"][1];
        if (this.properties["mined"][1]) {
            return p.game.add.tween(object.circle).to({
                alpha: 0,
            }, duration / 2, Phaser.Easing.Quadratic.InOut);
        }
        else {
            return p.game.add.tween(object.circle).to({
                alpha: 1,
            }, duration / 2, Phaser.Easing.Quadratic.InOut);
        }
    }

    apply(world: World, object: FixedResource) {
        object.mask.tint = this.properties["tint"][0];
        object.mined = this.properties["mined"][1];
    }
}


export class FixedResource extends WorldObject {
    sprite: Phaser.Sprite;
    phaserObject: Phaser.Group;
    mask: Phaser.Sprite;
    circle: Phaser.Group;
    tintColor: number;

    mined: boolean;

    constructor(name: string, x: number, y: number, tintColor: number,
                world: World, group: Phaser.Group, sprite: string) {
        super(name, x, y, world);
        this.phaserObject = world.game.add.group(group);
        this.phaserObject.position.x = TILE_WIDTH * x + TILE_WIDTH / 2;
        this.phaserObject.position.y = TILE_HEIGHT * y + TILE_WIDTH / 2;
        this.phaserObject.pivot.x = TILE_WIDTH / 2;
        this.phaserObject.pivot.y = TILE_HEIGHT / 2;

        this.sprite = this.phaserObject.create(0, 0, sprite);
        this.sprite.width = TILE_WIDTH;
        this.sprite.height = TILE_HEIGHT;

        this.mask = this.phaserObject.create(0, 0, sprite);
        this.mask.width = TILE_WIDTH;
        this.mask.height = TILE_HEIGHT;
        this.mask.tint = 0x000000;
        this.mask.alpha = 1.0;

        this.mined = false;

        this.tintColor = tintColor;
        world.log.record(new ResourceMinedDiff(this, 0x000000, 0x000000, false));

        this.circle = world.game.add.group(this.phaserObject);
        let circle = world.game.add.graphics(0, 0, this.circle);
        circle.lineStyle(0.5, tintColor, 0.5);
        circle.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);
        circle.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.63 * TILE_WIDTH);
    }

    passable(): boolean {
        return true;
    }

    mine() {
        this.mask.tint = 0x000000;
        this.world.log.record(new ResourceMinedDiff(this, this.mask.tint, 0x000000, true));
        this.mined = true;
        this.circle.alpha = 0;
    }

    fill() {
        this.mask.tint = this.tintColor;
        this.world.log.record(new ResourceMinedDiff(this, this.mask.tint, this.tintColor, false));
        this.mined = false;
        this.circle.alpha = 1;
    }

    phaserReset() {
        this.phaserObject.alpha = 1.0;
        this.circle.alpha = this.mined ? 0.0 : 1.0;
    }
}

export class LinkedResource extends FixedResource {
    other: FixedResource;

    constructor(name: string, x: number, y: number, tintColor: number,
                world: World, group: Phaser.Group, sprite: string,
                other: FixedResource) {
        super(name, x, y, tintColor, world, group, sprite);
        this.other = other;
    }

    mine() {
        this.other.fill();
        super.mine();
    }

    fill() {
        super.fill();
    }
}

export class Rocket extends WorldObject {
    sprite: Phaser.Sprite;
    flame: Phaser.Sprite;
    shadow: Phaser.Sprite;
    crop: Phaser.Rectangle;
    completed: boolean = false;

    constructor(name: string, x: number, y: number,
                world: World, group: Phaser.Group, sprite: string, flameSprite: string) {
        super(name, x, y, world);
        this.phaserObject = world.game.add.group(group);
        this.phaserObject.position.x = TILE_WIDTH * x + TILE_WIDTH / 2;
        this.phaserObject.position.y = TILE_HEIGHT * y + TILE_WIDTH / 2;
        this.phaserObject.pivot.x = TILE_WIDTH / 2;
        this.phaserObject.pivot.y = TILE_HEIGHT / 2;

        // this.shadow = this.phaserObject.create(1, -42, sprite);
        // this.shadow.width = TILE_WIDTH;
        // this.shadow.height = 60;
        // this.shadow.tint = 0x000000;
        // this.shadow.alpha = 0.7;
        // this.shadow.pivot.x = 8;
        // this.shadow.pivot.y = 0;
        // window["test"] = this.shadow;
        // this.shadow.rotation = Math.PI / 6;
        let circle = world.game.add.graphics(0, 0, this.phaserObject);
        this.sprite = this.phaserObject.create(0, -44 + 60, sprite);
        this.sprite.width = 16;
        this.sprite.height = 60;

        circle.lineStyle(0.5, 0xFF2222, 0.5);
        circle.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);

        this.crop = new Phaser.Rectangle(0, 393, 105, 393);
        this.sprite.crop(this.crop);

        this.flame = this.phaserObject.create(0, 16, flameSprite);
        this.flame.alpha = 0;

        this.phaserObject.alpha = 0;

        this.setLoc(x, y);
    }

    build() {
        this.world.log.record(new BuildRocketDiff(this));
    }

    blastOff() {
        this.world.log.record(new BlastOffDiff(this));
        this.world.log.record(new FinishDiff(this));
    }

    private t = 3;
    update() {
        this.sprite.updateCrop();
        this.flame.tint = 0x111111 * this.t;
        this.t++;
        if (this.t > 0xF) {
            this.t = 3;
        }
    }

    phaserReset() {
        this.phaserObject.alpha = 0;
        this.sprite.position.y = -44 + 60;
        this.flame.alpha = 0;
        this.flame.position.y = 16;
        this.crop = new Phaser.Rectangle(0, 393, 105, 393);
        this.sprite.crop(this.crop);
    }
}

class FinishDiff extends Diff<Rocket> {
    constructor(rocket: Rocket) {
        super(DiffKind.Property, null, rocket.getID(), {});
    }

    apply(world: World, object: Rocket) {
        object.completed = true;
    }
}

class BuildRocketDiff extends Diff<Rocket> {
    constructor(rocket: Rocket) {
        super(DiffKind.Property, null, rocket.getID(), {});
    }

    tween(object: Rocket, duration: number): Phaser.Tween {
        let p = object.getPhaserObject();
        let t1 = p.game.add.tween(p).to({
            alpha: 1,
        }, duration, Phaser.Easing.Quadratic.InOut);
        let t2 = p.game.add.tween(object.crop).to({
            y: 0,
        }, duration, Phaser.Easing.Quadratic.InOut);
        let t3 = p.game.add.tween(object.sprite.position).to({
            y: -44,
        }, duration, Phaser.Easing.Quadratic.InOut);
        t1.chain(t2);
        t2.onStart.add(function() {
            t3.start();
        });
        return t1;
    }
}

class BlastOffDiff extends Diff<Rocket> {
    constructor(rocket: Rocket) {
        super(DiffKind.Property, null, rocket.getID(), {});
    }

    tween(object: Rocket, duration: number): Phaser.Tween {
        let p = object.getPhaserObject();
        let t1 = p.game.add.tween(object.flame).to({
            alpha: 1,
        }, duration / 3, Phaser.Easing.Quadratic.InOut);

        let t2 = p.game.add.tween(object.sprite.position).to({
            y: -300,
        }, duration * 5, Phaser.Easing.Quadratic.InOut);
        let t3 = p.game.add.tween(object.flame.position).to({
            y: -300 + 16,
        }, duration * 5, Phaser.Easing.Quadratic.InOut);

        t2.onStart.add(function() {
            t3.start();
        });

        t1.chain(t2);
        return t1;
    }
}

class PickUpDiff extends Diff<HeavyLifter> {
    constructor(id: number, properties: PropertyDiff) {
        super(DiffKind.Property, null, id, properties);
    }

    tween(object: HeavyLifter, duration=ANIM_DURATION): Phaser.Tween {
        let lifter = object.getPhaserObject();
        let t1 = lifter.game.add.tween(lifter).to({
            rotation: lifter.rotation + 8 * Math.PI,
        }, duration, Phaser.Easing.Quadratic.InOut);

        let groundObjects = object.getWorld().getObjectByLoc(object.getX(), object.getY());
        let count: number = 0;
        for (var o of groundObjects) {
            if (o instanceof PlatformPiece) {
                count = count + 1;
            }
        }

        for (var o of groundObjects) {
            if (o instanceof PlatformPiece) {
                o.setSpriteIndex(count - 1);
            }
        }

        let lifted = object.getLastPicked();
        if (lifted === null) return t1;
        let p = lifted.getPhaserObject();

        t1.onComplete.add(() => {
            lifter.rotation -= 8 * Math.PI;
            p.alpha = 0;
        });

        return t1;
    }

    apply(world: World, object: HeavyLifter) {
        super.apply(world, object);
        if (object.getLastPicked() !== null) {
            world.removeObject(object.getLastPicked());
        }
    }
}

class DropDiff extends Diff<HeavyLifter> {
    constructor(id: number, properties: PropertyDiff) {
        super(DiffKind.Property, null, id, properties);
    }

    tween(object: HeavyLifter, duration=ANIM_DURATION): Phaser.Tween {
        let holder = object.getPhaserObject();
        let t1 = holder.game.add.tween(holder).to({
            rotation: holder.rotation + 8 * Math.PI,
        }, duration, Phaser.Easing.Quadratic.InOut);

        let groundObjects = object.getWorld().getObjectByLoc(object.getX(), object.getY());
        let count: number = 0;
        // at this point, the most recently dropped piece is already in groundObjects
        for (var o of groundObjects) {
            if (o instanceof PlatformPiece) {
                count = count + 1;
            }
        }

        for (var o of groundObjects) {
            if (o instanceof PlatformPiece) {
                o.setSpriteIndex(count - 1);
            }
        }

        let dropped = object.getLastDropped();
        if (dropped === null) return t1;
        let p = dropped.getPhaserObject();
        p.position.x = object.getX() * TILE_WIDTH + TILE_WIDTH/2;
        p.position.y = object.getY() * TILE_HEIGHT + TILE_HEIGHT/2;

        t1.onComplete.add(() => {
            holder.rotation -= 8 * Math.PI;
            p.alpha = 1;
        });

        return t1;
    }

    apply(world: World, object: HeavyLifter) {
        super.apply(world, object);
    }
}

export class PlatformPiece extends WorldObject {
    sprites: Phaser.Sprite[];
    phaserObject: Phaser.Group;
    spriteIndex: number;
    initialIndex: number;

    constructor(name:string, x:number, y:number,
                world: World, group: Phaser.Group, sprites: string[]) {
        super(name, x, y, world);
        this.sprites = [];
        this.phaserObject = world.game.add.group(group);
        this.phaserObject.position.x = TILE_WIDTH * x + TILE_WIDTH / 2;
        this.phaserObject.position.y = TILE_HEIGHT * y + TILE_WIDTH / 2;
        this.phaserObject.pivot.x = TILE_WIDTH / 2;
        this.phaserObject.pivot.y = TILE_HEIGHT / 2;
        for (var i = 0; i < sprites.length; i++) {

            let sprite = this.phaserObject.create(0, 0, sprites[i]);
            sprite.width = TILE_WIDTH;
            sprite.height = TILE_HEIGHT;
            this.sprites.push(sprite);
        }

        let groundObjects: WorldObject[] = world.getObjectByLoc(x, y);
        let pieces: PlatformPiece[] = [];
        for (var o of groundObjects) {
            if (o instanceof PlatformPiece) {
                pieces.push(o)
            }
        }
        this.initialIndex = pieces.length - 1
        for (var p of pieces) {
            p.setSpriteIndex(this.initialIndex);
            p.initialIndex = this.initialIndex;
        }

        let circle = world.game.add.graphics(0, 0, this.phaserObject);
        circle.lineStyle(0.5, 0xFFA500, 0.5);
        circle.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);
        circle.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.63 * TILE_WIDTH);
    }

    passable(): boolean {
        return true;
    }

    phaserReset() {
        this.phaserObject.width = TILE_WIDTH;
        this.phaserObject.height = TILE_HEIGHT;
        this.phaserObject.alpha = 1.0;

        this.setSpriteIndex(this.initialIndex);
    }

    setSpriteIndex(i: number) {
        this.spriteIndex = i;
        for (var k = 0; k < this.sprites.length; k++) {
            if (k === this.spriteIndex) {
                this.sprites[k].alpha = 1;
            } else {
                this.sprites[k].alpha = 0;
            }
        }
    }
}

export class HeavyLifter extends Robot {

    lastPicked: WorldObject = null;
    lastDropped: WorldObject = null;

    @blocklyMethod("pickUp", "pickUp")
    pickUp() {
        if (this.destructed) {
            throw new RangeError("Self destructed, can't pick up anything!");
        }

        let targets: WorldObject[] = this.world.getObjectByLoc(this.getX(), this.getY());
        let target: WorldObject = null;

        for (let i = 0; i < targets.length; i++) {
            if (targets[i] !== this && targets[i] instanceof PlatformPiece) {
                target = targets[i];
                break;
            }
        }

        let oldLastPicked = this.lastPicked;
        this.lastPicked = target;

        let orig = this.holdingIDs.slice(0);
        let newIDs = this.holdingIDs.slice(0);
        if (target !== null) {
            newIDs.push(target.getID());
            this.world.removeObject(target);
        }
        this.holdingIDs = newIDs.slice(0);
        this.world.log.record(new PickUpDiff(this.id, {
            holdingIDs: [orig, newIDs],
            lastPicked: [oldLastPicked, this.lastPicked]
        }));
    }

    @blocklyMethod("drop", "drop")
    drop() {
        if (this.destructed) {
            throw new RangeError("Self destructed, can't do anything!");
        }

        if (this.holdingIDs.length === 0) {
            throw "This robot is not holding anything.";
        }

        let orig = this.holdingIDs.slice(0);
        let newIDs = this.holdingIDs.slice(1);

        let dropped: WorldObject = this.world.getObjectByID(orig[0]);
        dropped.setLoc(this.getX(), this.getY());
        let oldLastDropped = this.lastDropped;
        this.lastDropped = dropped;
        this.holdingIDs = newIDs.slice(0);

        this.world.log.record(new DropDiff(this.id, {
            holdingIDs: [orig, newIDs],
            lastDropped: [oldLastDropped, this.lastDropped]
        }));
    }

    getLastPicked(): WorldObject {
        return this.lastPicked;
    }

    getLastDropped(): WorldObject {
        return this.lastDropped;
    }
}

export class LaunchPad extends WorldObject {
    sprite: Phaser.Sprite;
    phaserObject: Phaser.Group;

    constructor(name:string, x:number, y:number, world:World, group:Phaser.Group, sprite:string) {
        super(name, x, y, world);

        this.phaserObject = world.game.add.group(group);
        this.phaserObject.position.x = TILE_WIDTH * x + TILE_WIDTH / 2;
        this.phaserObject.position.y = TILE_HEIGHT * y + TILE_WIDTH / 2;
        this.phaserObject.pivot.x = TILE_WIDTH / 2;
        this.phaserObject.pivot.y = TILE_HEIGHT / 2;

        this.sprite = this.phaserObject.create(0, 0, sprite);
        this.sprite.width = TILE_WIDTH;
        this.sprite.height = TILE_HEIGHT;

        let c_circ = world.game.add.graphics(0, 0, this.phaserObject);
        c_circ.lineStyle(1, 0xA4B4C6, 1);
        c_circ.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);

        let n_circ = world.game.add.graphics(0, TILE_HEIGHT, this.phaserObject);
        n_circ.lineStyle(1, 0xA96A50, 1);
        n_circ.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);

        let s_circ = world.game.add.graphics(0, -1*TILE_HEIGHT, this.phaserObject);
        s_circ.lineStyle(1, 0xABA938, 1);
        s_circ.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);

        let e_circ = world.game.add.graphics(-1*TILE_WIDTH, 0, this.phaserObject);
        e_circ.lineStyle(1, 0xF287DC, 1);
        e_circ.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);

        let w_circ = world.game.add.graphics(TILE_WIDTH, 0, this.phaserObject);
        w_circ.lineStyle(1, 0x397EAC, 1);
        w_circ.drawCircle(TILE_WIDTH / 2, TILE_HEIGHT / 2, 1.41 * TILE_WIDTH);
    }

    private surroundings(): WorldObject[] {
        let surroundings: WorldObject[] = [];

        let c = this.world.getObjectByLoc(this.x, this.y);
        let n = this.world.getObjectByLoc(this.x, this.y-1);
        let s = this.world.getObjectByLoc(this.x, this.y+1);
        let e = this.world.getObjectByLoc(this.x+1, this.y);
        let w = this.world.getObjectByLoc(this.x-1, this.y);

        return surroundings.concat(c).concat(n).concat(s).concat(e).concat(w);
    }

    readyForLaunch() {
        let unique: string[] = [];
        for (let r of this.surroundings()) {
            let myType = "";

            if (r instanceof Robot) {
                if (r instanceof FrackingRobot) {
                    myType = "Fracking";
                }
                else if (r instanceof MineRobot) {
                    myType = "Mining";
                }
                else if (r instanceof RescueRobot) {
                    myType = "Rescue";
                }
                else if (r instanceof HeavyLifter) {
                    myType = "Lifter";
                }
                else {
                    myType = "Basic";
                }

                if (myType !== "" && unique.indexOf(myType) < 0) {
                    unique.push(myType);
                }

            }
        }

        return unique.length >= 5;
    }

    absorbRobots() {
        for (let r of this.surroundings()) {
            if (r instanceof Robot) {
                this.world.log.record(new AbsorbRobotDiff(r, this.x, this.y));
            }
        }
    }
}

export class AbsorbRobotDiff extends Diff<Robot> {
    new_x: number;
    new_y: number;

    constructor(robot: Robot, new_x: number, new_y: number) {
        super(DiffKind.Property, null, robot.getID(), {});
        this.new_x = new_x;
        this.new_y = new_y;
    }

    tween(object: Robot, duration=ANIM_DURATION): Phaser.Tween {
        let p = object.getPhaserObject();

        let t = p.game.add.tween(p).to({
            width: 0,
            height: 0,
            x: this.new_x * TILE_WIDTH + TILE_WIDTH / 2,
            y: this.new_y * TILE_HEIGHT + TILE_HEIGHT / 2,
            alpha: 0,
        }, duration, Phaser.Easing.Quadratic.InOut);

        return t;
    }
}
