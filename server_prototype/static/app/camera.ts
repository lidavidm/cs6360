/**
 * A faux camera that allows zooming and object tracking via adding
 * relevant objects to a group.
 */
export class ZoomCamera {
    game: Phaser.Game;
    public group: Phaser.Group;
    public position: Phaser.Point;
    public scale: Phaser.Point;

    bounds: Phaser.Rectangle;

    constructor(game: Phaser.Game) {
        this.game = game;
        this.group = game.add.group();
        this.position = new Phaser.Point(0, 0);
        this.scale = new Phaser.Point(1, 1);
        this.bounds = new Phaser.Rectangle(0, 0, game.width, game.height);
    }

    setBounds(width: number, height: number) {
        this.bounds.width = width;
        this.bounds.height = height;
    }

    update() {
        this.position.x = Math.max(this.position.x, 0);
        this.position.x = Math.min(this.position.x, this.bounds.width + this.game.width);
        this.position.y = Math.max(this.position.y, 0);
        this.position.y = Math.min(this.position.y, this.bounds.height + this.game.height);

        this.group.position.x = -this.position.x;
        this.group.position.y = -this.position.y;
        this.group.scale = this.scale;
    }
}
