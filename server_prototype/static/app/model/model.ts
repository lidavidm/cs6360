function blocklyMethod(funcName: string, friendlyName:string){
  return function (target:any, propertyKey:string, descriptor:PropertyDescriptor) {
      target.funcName = funcName;
      target.friendlyName = friendlyName;
  };
}

export class World {
  x:number = 0;
  y:number = 0;
  private nextID = 0;
  //things might be on top of each other.
  private map: WorldObject[][][];
  private tilemap: Phaser.Tilemap;

  constructor(x: number, y: number, tilemap: Phaser.Tilemap) {
    this.x = x;
    this.y = y;
    this.tilemap = tilemap;
  }

  getNewID() {
    return this.nextID++;
  }

  addObject(obj: WorldObject) {
    this.map[obj.getX()][obj.getY()].push(obj);
  }

  getObject(x:number, y: number): WorldObject[] {
    return this.map[x][y];
  }

  removeObject(obj: WorldObject) {
    let x:number = obj.getX();
    let y:number = obj.getY();
    this.map[x][y].splice(this.map[x][y].indexOf(obj), 1);
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

export enum Direction{
  NORTH, SOUTH, EAST, WEST
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
  }

  @blocklyMethod("moveBackward", "Move backward")
  moveBackward() {
    //TODO
  }

  @blocklyMethod("pickUpUnderneath", "Pick up what's underneath me")
  pickUpUnderneath() {
    //TODO
  }
}
