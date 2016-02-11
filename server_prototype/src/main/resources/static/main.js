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
            m("h1", "Editor"),
        ]);
    },
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

                game.add.text(game.world.centerX - 300, 0, text, style);
            },
        };

        return controller;
    },

    view: function(controller) {
        return m("div#map", {
            config: function(element, isInitialized) {
                if (!isInitialized) {
                    controller.phaser = new Phaser.Game(426, 720, Phaser.CANVAS, element, {
                        create: controller.create,
                    });
                }
            },
        });
    },
};

m.mount(document, GameWidget);
