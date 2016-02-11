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
                m.component(ToolboxComponent),
                m.component(BlueprintComponent),
            ]),
        ]);
    },
};

var BlueprintComponent = {
    controller: function(args) {

    },

    view: function(controller) {
        return m(".blueprint.workbench-area", [
            m("header", [
                m("span.class", "Robot"),
                " can",
            ]),
            m(".methods", [
                m(".method.workbench-item", "moveForward"),
                m(".method.workbench-item", "turnLeft"),
                m(".method.workbench-item", "selfDestruct"),
                m(".method.workbench-item", "reverse"),
            ]),
        ]);
    }
};

var ToolboxComponent = {
    controller: function(args) {

    },

    view: function(controller) {
        return m(".toolbox.workbench-area", [
            m("header", "Toolbox"),
            m(".control-flow-structures", [
                m(".control-flow-structure.workbench-item", "if..else.."),
                m(".control-flow-structure.workbench-item", "forever"),
                m(".boolean.workbench-item", "true"),
                m(".boolean.workbench-item", "false"),
                m(".primitive.workbench-item", "text"),
                m(".primitive.workbench-item", "number"),
                m(".control-flow-structure.workbench-item", [
                    "tell ",
                    m("span.object", "object"),
                    " to ",
                    m("span.method", "do something"),
                ]),
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
