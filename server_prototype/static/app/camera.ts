module Camera {
    /**
     * A faux camera that allows zooming and object tracking via adding
     * relevant objects to a group.
     */
    export class ZoomCamera extends Phaser.Group {
        // Based on https://gist.github.com/netcell/60097d0661ad2f74a258

        private bounds: Phaser.Rectangle;

        ZoomCamera(game: Phaser.Game) {
            var world = game.world;

            this.scale.setTo(1, 1);
            this.position.setTo(0, 0);

            this.bounds = Phaser.Rectangle.clone(world.bounds);

            return this;
        }

        zoomTo(scale: number, duration: number) {
            var bounds = this.bounds;
            var cameraBounds = this.game.camera.bounds;

            var positionScale = (1 - scale) / 2;

            var x = bounds.width * positionScale;
            var y = bounds.height * positionScale;
            var width = bounds.width * scale;
            var height = bounds.height * scale;

            if (duration) {

            }
            else {
                cameraBounds.x = x;
                cameraBounds.y = y;
                cameraBounds.width = width;
                cameraBounds.height = height;

                this.scale.setTo(scale);
            }
        };
    }
}
