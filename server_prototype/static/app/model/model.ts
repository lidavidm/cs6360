function blocklyMethod(funcName: string, friendlyName: string): PropertyDecorator {
    return function(target: any, propertyKey: string) {
        target[propertyKey].funcName = funcName;
        target[propertyKey].friendlyName = friendlyName;
    };
}

export const TILE_WIDTH = 16;
export const TILE_HEIGHT = 16;

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
    private objects: { [id: number] : WorldObject} = {};

    constructor(tilemap: Phaser.Tilemap) {
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

    private boundsOkay(x: number, y: number) {
        return ( x < this.maxX && y < this.maxY && x >= 0 && y >= 0);
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

        //TODO: Validation
        this.x = x;
        this.y = y;
        this.world = world;

        this.id = this.world.getNewID();

        this.world.addObject(this);
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

    /*These set functions probably don't need animations/promises on them because
    * they probably aren't called by the user to move something. They just drop
    * something in its place
    */
    setX(x: number) {
        if (x >= 0 && x < this.world.getMaxX()) {
            this.world.removeObject(this);
            this.x = x;
            this.world.addObject(this);
        }
        else {
            throw new RangeError("Trying to move object to invalid x coordinate: " + x);
        }
    }

    setY(y: number) {
        if (y >= 0 && y < this.world.getMaxY()) {
            this.world.removeObject(this);
            this.y = y;
            this.world.addObject(this);
        }
        else {
            throw new RangeError("Trying to move object to invalid y coordinate: " + y);
        }
    }

    setLoc(x: number, y: number) {
        if (y >= 0 && y < this.world.getMaxY() &&
            x >= 0 && x < this.world.getMaxX()){
            this.world.removeObject(this);
            this.x = x;
            this.y = y;
            this.world.addObject(this);
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
    WEST
};

/**
 * Superclass for any types of robots appearing in the world which can be
 * controlled by the player
 * Can optionally be constructed as holding something(s)
 */
export class Robot extends WorldObject {
    sprite: Phaser.Sprite;
    orientation: Direction;

    //This robot's "inventory". TODO: size restrictions etc?
    protected holding: WorldObject[];

    constructor(name: string, x: number, y: number,
                orientation: Direction, sprite: Phaser.Sprite, world: World,
                holding?: WorldObject[]) {
        super(name, x, y, world);
        this.orientation = orientation;
        this.sprite = sprite;
        if (holding) {
            this.holding = holding;
        }
        else {
            this.holding = [];
        }
    }

    inventory(): WorldObject[] {
        return this.holding;
    }

    @blocklyMethod("moveForward", "move forward")
    moveForward(): Promise<{}> {
        switch (this.orientation) {
        case Direction.NORTH:
            this.setLoc(this.x, this.y-1);
            break;
        case Direction.SOUTH:
            this.setLoc(this.x, this.y+1);
            break;
        case Direction.EAST:
            this.setLoc(this.x+1, this.y);
            break;
        case Direction.WEST:
            this.setLoc(this.x-1, this.y);
            break;
        }

        return new Promise((resolve, reject) => {
            var tween = this.sprite.game.add.tween(this.sprite).to({
                x: this.x * TILE_WIDTH,
                y: this.y * TILE_HEIGHT,
            }, 800, Phaser.Easing.Quadratic.InOut);
            tween.onComplete.add(() => {
                resolve();
            });
            tween.start();
        });
    }

    @blocklyMethod("moveBackward", "move backward")
    moveBackward(): Promise<{}> {
        switch (this.orientation) {
        case Direction.NORTH:
            this.setLoc(this.x, this.y+1);
            break;
        case Direction.SOUTH:
            this.setLoc(this.x, this.y-1);
            break;
        case Direction.EAST:
            this.setLoc(this.x-1, this.y);
            break;
        case Direction.WEST:
            this.setLoc(this.x+1, this.y);
            break;
        }

        // Copied from moveForward. Should be the same.
        return new Promise((resolve, reject) => {
            var tween = this.sprite.game.add.tween(this.sprite).to({
                x: this.x * TILE_WIDTH,
                y: this.y * TILE_HEIGHT,
            }, 800, Phaser.Easing.Quadratic.InOut);
            tween.onComplete.add(() => {
                resolve();
            });
            tween.start();
        });
    }

    /*
     * Tries to pick up one obeject on the same tile as this Robot. Which object
     * is unspecified. Returns a promise that is resolved once the target object's
     * pick up animation plays, or rejects if the object is not Iron
     */
    @blocklyMethod("pickUpUnderneath", "pick up what's underneath me")
    pickUpUnderneath(): Promise<{}> {
        let targets: WorldObject[] = this.world.getObjectByLoc(this.x, this.y);
        let target: WorldObject = null;

        for (let i = 0; i < targets.length; i++) {
            if (targets[i] !== this) {
                target = targets[i];
                break;
            }
        }
        //TODO: this will need to choose WHICH thing to pick up?
        if (target !== null) {
            this.holding.push(target);
        }

        return new Promise((resolve, reject) => {
            if (target === null) {
                reject("Nothing to pick up");
            }
            else if (!(target instanceof Iron)){
                reject("I can only pick up iron");
            }
            else {
                let spr = (<Iron>target).sprite;
                var tween = spr.game.add.tween(spr).to({
                    alpha: 0,
                    width: 64,
                    height: 64
                }, 800, Phaser.Easing.Quadratic.InOut);
                spr.game.add.tween(spr.position).to({
                    x: spr.position.x - 24,
                    y: spr.position.y - 24,
                }, 800, Phaser.Easing.Quadratic.InOut).start();

                tween.onComplete.add(() => {
                    this.world.removeObject(target);
                    spr.visible = false;
                    resolve();
                });
                tween.start();
            }
        });
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
}
