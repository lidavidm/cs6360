/**
 * A faux camera that allows zooming and object tracking via adding
 * relevant objects to a group.
 */
var ZoomCamera = (function() {
    // Based on https://gist.github.com/netcell/60097d0661ad2f74a258
    function ZoomCamera(game) {
        Phaser.Group.call(this, game);
    }

    ZoomCamera.prototype = Object.create(Phaser.Group.prototype);
    ZoomCamera.prototype.constructor = ZoomCamera;

    return ZoomCamera;
})();
