function blocklyMethod(funcName: string, friendlyName:string){
  return function (target:any, propertyKey:string, descriptor:PropertyDescriptor) {
      target.funcName = funcName;
      target.friendlyName = friendlyName;
  };
}

export class World {
  max_x:number = 0;
  max_y:number = 0;
  private nextID = 0;
  //things might be on top of each other.
  private map: WorldObject[][][];
  private tilemap: Phaser.Tilemap;

  constructor(max_x: number, max_y: number, tilemap: Phaser.Tilemap) {
    if (max_x < 0 || max_y < 0) {
      throw new RangeError("Invalid map size: (" + max_x + ", " + max_y + ")");
    }
    this.max_x = max_x;
    this.max_y = max_y;
    this.tilemap = tilemap;
  }

  getNewID() {
    return this.nextID++;
  }

  addObject(obj: WorldObject) {
    let x:number = obj.getX();
    let y:number = obj.getY();

    if (this.boundsOkay(x, y)) {
      this.map[obj.getX()][obj.getY()].push(obj);
    }
    else {
      throw new RangeError("Trying to add object at invalid location: (" + x + ", " + y + ")");
    }

  }

  getObject(x:number, y: number): WorldObject[] {
    if (this.boundsOkay(x, y)) {
        return this.map[x][y];
    }
    else {
      throw new RangeError("Trying to get object at invalid location: (" + x + ", " + y + ")");
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
    return ( x < this.max_x && y < this.max_y && x >= 0 && y >= 0);
  }
}

export abstract class WorldObject {
  protected name: string;
  protected id: number;
  protected x: number;
  protected y: number;

  protected world: World;

  constructor(name:string, id:number, x: number, y: number, world: World) {
      this.name = name;
      this.x = x;
      this.y = y;
      this.world = world;
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  //TODO check location/orientation
  setX(x: number) {
    this.world.removeObject(this);
    this.x = x;
    this.world.addObject(this);
  }

  setY(y: number) {
    this.world.removeObject(this);
    this.y = y;
    this.world.addObject(this);
  }

  setLoc(x: number, y: number) {
    this.world.removeObject(this);
    this.x = x;
    this.y = y;
    this.world.addObject(this);
  }
}

export enum Direction {
  NORTH,
  SOUTH,
  EAST,
  WEST
};

export class Robot extends WorldObject {
  sprite: Phaser.Sprite;
  orientation: Direction;

  //TODO: this needs to take in the robot's code i think?
  constructor(name: string, id: number, x: number, y: number,
              orientation: Direction, sprite: Phaser.Sprite, world: World) {
      super(name, id, x, y, world);
      this.orientation = orientation;
      this.sprite = sprite;
  }

  @blocklyMethod("moveForward", "Move forward")
  moveForward() {
    //TODO
    switch (this.orientation) {
      case Direction.NORTH:
        this.setLoc(this.x, this.y+1);
        break;
      case Direction.SOUTH:
        this.setLoc(this.x, this.y-1);
        break;
      case Direction.EAST:
        this.setLoc(this.x+1, this.y);
        break;
      case Direction.WEST:
        this.setLoc(this.x-1, this.y);
        break;
    }
  }

  @blocklyMethod("moveBackward", "Move backward")
  moveBackward() {
    //TODO
    switch (this.orientation) {
      case Direction.NORTH:
        this.setLoc(this.x, this.y-1);
        break;
      case Direction.SOUTH:
        this.setLoc(this.x, this.y+1);
        break;
      case Direction.EAST:
        this.setLoc(this.x-1, this.y);
        break;
      case Direction.WEST:
        this.setLoc(this.x+1, this.y);
        break;
    }
  }

  @blocklyMethod("pickUpUnderneath", "Pick up what's underneath me")
  pickUpUnderneath() {
    //TODO
  }
}

export class Resource extends WorldObject {

  //additionally this could have methods for picking up?

  constructor(name:string, id:number, x:number, y:number,
              sprite:Phaser.Sprite, world: World) {
    super(name, id, x, y, world);
  }
}
