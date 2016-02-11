var GameWidget = {
    controller: function(args) {
    },

    view: function(controller) {
        return m("html", [
            m("head", [
                m("title", "Test Game"),
                m("link", {
                    rel: "stylesheet",
                    type: "text/css",
                    href: "main.css",
                }),
            ]),
            m("body", [
                m(".container", [
                    m.component(EditorComponent),
                    m.component(MapComponent),
                ]),
            ]),
        ]);
    },
};

var EditorComponent = {
    controller: function(args) {
    },

    view: function(controller) {
        return m("div#editor", [
            m("div#workspace", "Blocks go here"),
            m("div#workbench", [
                "Blueprints/toolboxes go here",
                m.component(BlueprintComponent),
            ]),
        ]);
    },
};

var BlueprintComponent = {
    controller: function(args) {

    },

    view: function(controller) {
        return m(".blueprint", [
            m("header", [
                m("span.class", "Robot"),
                " can",
            ]),
            m(".methods", [
                m(".method", "moveForward"),
            ]),
        ]);
    }
};

var MapComponent = {
    controller: function(args) {
        var controller = {
            phaser: null,
            create: function() {
                var game = controller.phaser;

                var text = "test";
                var style = {
                    font: "24px Arial",
                    fill: "#FFFFFF",
                    align: "center",
                };

                game.add.text(game.world.centerX, 0, text, style);
            },
        };

        return controller;
    },

    view: function(controller) {
        return m("div#map", [
            m("div#worldMap", {
                config: function(element, isInitialized) {
                    if (!isInitialized) {
                        // TODO: figure out how to get this to scale properly
                        controller.phaser = new Phaser.Game(384, 612, Phaser.CANVAS, element, {
                            create: controller.create,
                        });
                    }
                },
            }),
            m("nav#gameControls", "Controls"),
        ]);
    },
};

m.mount(document, GameWidget);
