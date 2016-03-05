/**
 * A faux camera that allows zooming and object tracking via adding
 * relevant objects to a group.
 */
export class ZoomCamera {
    public group: Phaser.Group;
    public position: Phaser.Point;
    public scale: Phaser.Point;

    constructor(game: Phaser.Game) {
        this.group = game.add.group();
        this.position = new Phaser.Point(0, 0);
        this.scale = new Phaser.Point(1, 1);
    }

    update() {
        this.group.position.x = -this.position.x;
        this.group.position.y = -this.position.y;
        this.group.scale = this.scale;
    }
}
