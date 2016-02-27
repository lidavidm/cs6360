var camera = require("../camera");

var MapComponent = {
    controller: function(args) {
        var controller = {
            phaser: null,
            preload: preload,
            create: create,
            update: update,
            render: render,
            scale: scale,
        };

        var game = null;
        var camera = null;
        var cursors = null;

        function preload() {
            game = controller.phaser;

            game.load.tilemap("prototype", "assets/maps/prototype.json", null, Phaser.Tilemap.TILED_JSON);
            game.load.image("tiles", "assets/tilesets/cave.png");

            game.scale.scaleMode = Phaser.ScaleManager.RESIZE;

            camera = new camera.ZoomCamera(game);
        }

        function create() {
            var map = game.add.tilemap("prototype");
            map.addTilesetImage("cave", "tiles");
            var layer = map.createLayer("Tile Layer 1");
            layer.resizeWorld();

            cursors = game.input.keyboard.createCursorKeys();
        }

        function update() {
            if (!game.input.activePointer.withinGame) return;

            if (cursors.up.isDown) {
                game.camera.y -= 4;
            }
            else if (cursors.down.isDown) {
                game.camera.y += 4;
            }
            else if (cursors.left.isDown) {
                game.camera.x -= 4;
            }
            else if (cursors.right.isDown) {
                game.camera.x += 4;
            }
        }

        function render() {
            game.debug.cameraInfo(game.camera, 32, 32);
        }

        function scale(zoomed) {
            if (zoomed) {
                game.world.scale.setTo(2, 2);
            }
            else {
                game.world.scale.setTo(1, 1);
            }
        }

        return controller;
    },

    view: function(controller, args) {
        var style = "";
        if (args.executing()) {
            style = ".executing";
        }

        return m("div#map" + style, [
            m("div#worldMap", {
                config: function(element, isInitialized) {
                    if (!isInitialized) {
                        controller.phaser = new Phaser.Game("100", "100", Phaser.CANVAS, element, {
                            preload: controller.preload,
                            create: controller.create,
                            update: controller.update,
                            render: controller.render,
                        });
                    }
                },
            }),
            // TODO: move this to separate views
            m("div#objectives", m("ul", [
                m("h2", "Objectives"),
                m("li", "Get our proposal done"),
                m("li", "Make this game"),
            ])),
            m("nav#gameControls", [
                m("button", {
                    onclick: function() {
                        console.log("click");
                        args.executing(!args.executing());
                        controller.scale(args.executing());
                    }
                }, "Run"),
            ]),
        ]);
    },
};

module.exports = {
    MapComponent: MapComponent,
};
