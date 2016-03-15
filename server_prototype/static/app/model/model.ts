function blocklyMethod(funcName: string, friendlyName: string): PropertyDecorator {
    return function(target: any, propertyKey: string) {
        target[propertyKey].funcName = funcName;
        target[propertyKey].friendlyName = friendlyName;
    };
}

export const TILE_WIDTH = 16;
export const TILE_HEIGHT = 16;
export const ANIM_DURATION = 800;

export interface SerializedObject {

}

export interface Serializable {
    serialize(): SerializedObject;
    deserialize(state: SerializedObject): void;
}

export interface PropertyDiff {
    [property: string]: [any, any],
}

export enum SpecialDiff {
    // When a block finishes executing.
    EndOfBlock,
    // When we have finished initializing world objects.
    EndOfInit,
}

export interface ObjectDiff<T extends WorldObject> {
    id: number,
    properties: PropertyDiff,

    tween: (object: T) => Phaser.Tween;
    apply: (world: World, object: T) => void;
}

export type Diff<T extends WorldObject> = ObjectDiff<T> | SpecialDiff;

abstract class BaseObjectDiff<T extends WorldObject> implements ObjectDiff<T> {
    id: number;
    properties: PropertyDiff;

    constructor(id: number, properties: PropertyDiff) {
        this.id = id;
        this.properties = properties;
    }

    tween(object: T): Phaser.Tween {
        return null;
    }

    apply(world: World, object: T) {
        Object.keys(this.properties).forEach((property) => {
            let change = this.properties[property];
            (<any> object)[property] = change[1];
            console.log("Setting (id: " + object.getID() + ")." + property + " to " + change[1]);
        });
    }
}

class MovementDiff<T extends WorldObject> extends BaseObjectDiff<T> {
    constructor(id: number, properties: PropertyDiff) {
        super(id, properties);
    }

    tween(object: T): Phaser.Tween {
        let p = object.phaserObject();
        if (p === null) return null;
        return p.game.add.tween(p).to({
            x: object.getX() * 16,
            y: object.getY() * 16,
        }, 800, Phaser.Easing.Quadratic.InOut);
    }

    apply(world: World, object: T) {
        world.removeObject(object);
        super.apply(world, object);
        world.addObject(object);
    }
}

class OrientationDiff<T extends WorldObject> extends BaseObjectDiff<T> {
    constructor(id: number, properties: PropertyDiff) {
        super(id, properties);
    }

    tween(object: T): Phaser.Tween {
        return null;
    }
}

class HoldingDiff extends BaseObjectDiff<Robot> {
    constructor(id: number, properties: PropertyDiff) {
        super(id, properties);
    }

    tween(object: Robot): Phaser.Tween {
        let holding = object.holding();
        if (holding === null) return;

        let p = holding.phaserObject();
        if (p === null) return;

        return p.game.add.tween(p).to({
            x: p.position.x - 16,
            y: p.position.y - 16,
            width: p.width + 32,
            height: p.height + 32,
            alpha: 0,
        }, 800, Phaser.Easing.Quadratic.InOut);
    }
}

export class Log {
    log: Diff<any>[];
    world: World;

    constructor(world: World) {
        this.log = [];
        this.world = world;
    }

    /**
     * Clears log entries after the end of initialization.
     */
    reset() {
        this.log.splice(this.log.indexOf(SpecialDiff.EndOfInit) + 1);
    }

    record<T extends WorldObject>(diff: ObjectDiff<T>) {
        this.log.push(diff);
    }

    recordInitEnd() {
        this.log.push(SpecialDiff.EndOfInit);
    }

    recordBlockEnd(block_id?: any) {
        // TODO: record the block ID
        this.log.push(SpecialDiff.EndOfBlock);
    }

    replay(callback: (diff: Diff<any>) => Promise<{}>, replayInit=false): Promise<{}> {
        return new Promise((resolve, reject) => {
            let programCounter = 0;
            // Whether we are done with the reset steps.
            let reset = replayInit;

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

                if (typeof diff === "number") {
                    switch (diff) {
                    case SpecialDiff.EndOfBlock:
                        break;
                    case SpecialDiff.EndOfInit:
                        reset = true;
                        Object.keys(this.world.objects).forEach((id) => {
                            this.world.getObjectByID(<any> id).phaserReset();
                        });
                        break;
                    }
                }
                else {
                    let object = this.world.getObjectByID(diff.id);
                    diff.apply(this.world, object);
                }

                if (reset) {
                    callback(diff).then(advanceStep, () => {
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
    objects: { [id: number] : WorldObject} = {};

    log: Log;

    constructor(tilemap: Phaser.Tilemap) {
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
        let x:number = obj.getX();
        let y:number = obj.getY();

        if (this.boundsOkay(x, y)) {
            this.map[x][y].push(obj);
            this.objects[obj.getID()] = obj;
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

    getObjectByID(id: number) {
        let obj = this.objects[id];
        if (typeof obj !== "undefined") {
            return obj;
        }
        else {
            throw new Error("Attempting to find invalid object id.");
        }
    }

    removeObject(obj: WorldObject) {
        let x:number = obj.getX();
        let y:number = obj.getY();

        if (this.boundsOkay(x,y)) {
            this.map[x][y].splice(this.map[x][y].indexOf(obj), 1);
        }
        else {
            throw new RangeError("Trying to remove object at invalid location: (" + x + ", " + y + ")");
        }
    }

    passable(x: number, y: number) {
        let tile = (<any> this.tilemap.layer).data[x][y];

        // Need explicit check because property may not be defined
        if (tile.properties.passable === "false") {
            return false;
        }

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

    constructor(name:string, x: number, y: number, world: World) {
        this.name = name;
        this.world = world;
        this.id = this.world.getNewID();

        this.x = x;
        this.y = y;
        this.world.addObject(this);

        // Record ourselves in the log
        this.setLoc(x, y);
    }

    phaserObject(): any {
        return null;
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

    getX(): number {
        return this.x;
    }

    getY(): number {
        return this.y;
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
    orientation: Direction;

    protected holdingID: number;

    constructor(name: string, x: number, y: number,
                orientation: Direction, sprite: Phaser.Sprite, world: World) {
        super(name, x, y, world);
        this.sprite = sprite;

        this.setOrientation(orientation);
        this.holdingID = null;
        this.hold(null);
    }

    phaserObject(): Phaser.Sprite {
        return this.sprite;
    }

    setOrientation(orientation: Direction) {
        this.world.log.record(new OrientationDiff(this.id, {
            orientation: [this.orientation, orientation],
        }));
        this.orientation = orientation;
    }

    hold(object: WorldObject | number) {
        let origID = this.holdingID;
        if (typeof object === "number") {
            this.holdingID = object;
        }
        else if (object === null) {
            this.holdingID = null;
        }
        else {
            this.holdingID = object.getID();
        }
        this.world.log.record(new HoldingDiff(this.id, {
            holdingID: [origID, this.holdingID],
        }));
    }

    holding(): WorldObject {
        if (this.holdingID === null) return null;
        return this.world.getObjectByID(this.holdingID);
    }

    passable(): boolean {
        return false;
    }

    @blocklyMethod("moveForward", "move forward")
    moveForward() {
        let [x, y] = offsetDirection(this.x, this.y, this.orientation, 1);

        if (this.world.passable(x, y)) {
            this.setLoc(x, y);
        }
        else {
            throw new RangeError("Can't move forward! Tried: " + x + ", " + y);
        }
    }

    @blocklyMethod("moveBackward", "move backward")
    moveBackward() {
        let [x, y] = offsetDirection(this.x, this.y, this.orientation, -1);

        if (this.world.passable(x, y)) {
            this.setLoc(x, y);
        }
        else {
            throw new RangeError("Can't move backward! Tried: " + x + ", " + y);
        }
    }

    /*
     * Tries to pick up one obeject on the same tile as this Robot. Which object
     * is unspecified. Returns a promise that is resolved once the target object's
     * pick up animation plays, or rejects if the object is not Iron
     */
    @blocklyMethod("pickUpUnderneath", "pick up what's underneath me")
    pickUpUnderneath() {
        let targets: WorldObject[] = this.world.getObjectByLoc(this.x, this.y);
        let target: WorldObject = null;

        for (let i = 0; i < targets.length; i++) {
            if (targets[i] !== this) {
                target = targets[i];
                break;
            }
        }
        //TODO: this will need to choose WHICH thing to pick up?
        if (target !== null && this.holdingID === null) {
            this.hold(target);
        }
    }
}

/**
 * Iron object (basic resource). Doesn't really do much right now
 * and will probably need to be refactored as gameplay elements are ironed out
 */
export class Iron extends WorldObject {
    sprite: Phaser.Sprite;

    constructor(name:string, x:number, y:number,
                sprite:Phaser.Sprite, world: World) {
        super(name, x, y, world);
        this.sprite = sprite;
    }

    passable(): boolean {
        return true;
    }

    phaserObject(): Phaser.Sprite {
        return this.sprite;
    }

    phaserReset() {
        this.sprite.width = TILE_WIDTH;
        this.sprite.height = TILE_HEIGHT;
        this.sprite.alpha = 1.0;
    }
}
