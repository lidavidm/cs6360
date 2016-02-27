/**
 * A faux camera that allows zooming and object tracking via adding
 * relevant objects to a group.
 */
var ZoomCamera = (function() {
    // Based on https://gist.github.com/netcell/60097d0661ad2f74a258
    function ZoomCamera(game) {
        Phaser.Group.call(this, game);

        var world = game.world;

        this.scale.setTo(1, 1);
        this.position.setTo(0, 0);

        this.bounds = Phaser.Rectangle.clone(world.bounds);

        return this;
    }

    ZoomCamera.prototype = Object.create(Phaser.Group.prototype);
    ZoomCamera.prototype.constructor = ZoomCamera;

    ZoomCamera.prototype.zoomTo = function(scale, duration) {
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

    return ZoomCamera;
})();

module.exports = {
    ZoomCamera: ZoomCamera,
};
