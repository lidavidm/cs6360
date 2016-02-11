'use strict';

function Block() {

}

var GameWidget = {
    controller: function(args) {
    },

    view: function(controller) {
        return m(".container", [
            m.component(EditorComponent),
            m.component(MapComponent),
        ]);
    },
};

var EditorComponent = {
    controller: function(args) {
        return {
            blocks: m.prop([]),
        };
    },

    view: function(controller) {
        return m("div#editor", {
            config: function(element, isInitialized) {
                if (!isInitialized) {
                    var drake = dragula({
                        copy: function(el, source) {
                            return source.classList.contains("block-container");
                        },
                        accepts: function(el, target, source, sibling) {
                            return target.classList.contains("block-acceptor");
                        },
                        isContainer: function(el) {
                            return el.classList.contains("block-container");
                        }
                    });
                    drake.containers.push(document.getElementById("workspace"));
                    drake.containers.push(document.getElementById("workbench"));
                    drake.on("drop", function(el, target, source, sibling) {
                        console.log(el, target, source, sibling);
                    });
                }
            },
        }, [
            m.component(WorkspaceComponent, {
                blocks: controller.blocks(),
            }),
            m("div#workbench", [
                m.component(ToolboxComponent),
                m.component(BlueprintComponent),
            ]),
        ]);
    },
};

var WorkspaceComponent = {
    controller: function(args) {

    },

    view: function(controller, args) {
        return m("div#workspace.block-acceptor", "Blocks go here");
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
            m(".methods.block-container", [
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
            m(".control-flow-structures.block-container", [
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

m.mount(document.body, GameWidget);
