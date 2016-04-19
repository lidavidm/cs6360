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

    centerOn(position: Phaser.Point, width: number, height: number): Phaser.Tween {
        let x = this.scale.x * position.x, y = this.scale.y * position.y;
        width = this.scale.x * width;
        height = this.scale.y * height;

        if (x - 32 < this.position.x || y - 32 < this.position.y ||
            x + width + 32 > this.position.x + this.game.width ||
            y + height + 32 > this.position.y + this.game.height) {
            return this.game.add.tween(this.position).to({
                x: x - this.game.width / 2,
                y: y - this.game.height / 2,
            }, 300, Phaser.Easing.Quadratic.InOut);
        }
        else {
            return null;
        }
    }

    update() {
        this.position.x = Math.max(this.position.x, 0);
        this.position.x = Math.min(this.position.x, this.bounds.width * this.scale.x - this.game.width);
        this.position.y = Math.max(this.position.y, 0);
        this.position.y = Math.min(this.position.y, this.bounds.height * this.scale.y - this.game.height);

        this.group.position.x = -this.position.x;
        this.group.position.y = -this.position.y;
        this.group.scale = this.scale;
    }
}
