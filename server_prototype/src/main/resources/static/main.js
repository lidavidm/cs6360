'use strict';

var GameWidget = {
    controller: function(args) {
        var controller = {
            mapMode: m.prop("minimap"),
        };

        return controller;
    },

    view: function(controller) {
        return m(".container", [
            m.component(MapComponent, {
                mode: controller.mapMode(),
            }),
            m.component(EditorComponent),
        ]);
    },
};

var EditorComponent = {
    controller: function(args) {

    },

    view: function(controller) {
        return m("div#editor", {
            config: function(element, isInitialized) {
                if (isInitialized) {
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
            create: create,
        };

        function create() {
            var game = controller.phaser;

            var text = "test";
            var style = {
                font: "24px Arial",
                fill: "#FFFFFF",
                align: "center",
            };

            game.add.text(game.world.centerX, 0, text, style);
        }

        return controller;
    },

    view: function(controller, args) {
        var style = "expanded";
        if (args.mode === "minimap") {
            style = "minimap";
        }

        return m("div#map." + style, [
            m("div#worldMap", {
                config: function(element, isInitialized) {
                    if (!isInitialized) {
                        // TODO: figure out how to get this to scale properly
                        controller.phaser = new Phaser.Game(256, 612, Phaser.CANVAS, element, {
                            create: controller.create,
                        });
                    }
                },
            }),
            m("nav#gameControls", "Controls"),
        ]);
    },
};

m.mount(document.body, GameWidget);
