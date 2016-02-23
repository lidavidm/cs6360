'use strict';

var GameWidget = {
    controller: function(args) {
        var controller = {
            executing: m.prop(false),
        };

        return controller;
    },

    view: function(controller) {
        return m(".container", [
            m.component(MapComponent, {
                executing: controller.executing,
            }),
            m.component(EditorComponent, {
                executing: controller.executing,
            }),
        ]);
    },
};

var EditorComponent = {
    controller: function(args) {

    },

    view: function(controller, args) {
        console.log("Editor", args.executing());
        return m("div#editor", {
            class: args.executing() ? "executing" : "",
            config: function(element, isInitialized) {
                if (isInitialized) {
                    // https://groups.google.com/forum/#!topic/blockly/WE7x-HPh81A
                    // According to above link, window resize event is
                    // needed for Blockly to resize itself
                    window.dispatchEvent(new Event("resize"));
                    return;
                }

                var workspace = Blockly.inject(element, {
                    toolbox: document.getElementById("toolbox").textContent,
                    trashcan: true,
                });
            },
        });
    },
};

var MapComponent = {
    controller: function(args) {
        var controller = {
            phaser: null,
            preload: preload,
            create: create,
            update: update,
            render: render,
        };

        var game = null;
        var cursors = null;

        function preload() {
            game = controller.phaser;

            game.load.tilemap("prototype", "assets/maps/prototype.json", null, Phaser.Tilemap.TILED_JSON);
            game.load.image("tiles", "assets/tilesets/cave.png");

            game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
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
                        // TODO: figure out how to get this to scale properly
                        controller.phaser = new Phaser.Game("100", "100", Phaser.CANVAS, element, {
                            preload: controller.preload,
                            create: controller.create,
                            update: controller.update,
                            render: controller.render,
                        });
                    }
                },
            }),
            m("div#objectives", m("ul", [
                m("h2", "Objectives"),
                m("li", "Get our proposal done"),
                m("li", "Make this game"),
            ])),
            m("nav#gameControls", [
                m("button", {
                    onclick: function() {
                        console.log("click");
                        args.executing(true);
                    }
                }, "Run"),
            ]),
        ]);
    },
};

m.mount(document.body, GameWidget);
