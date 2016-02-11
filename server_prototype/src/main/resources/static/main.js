'use strict';

function Block(data) {
    this.kind = m.prop(data.kind);
    this.subkind = m.prop(data.subkind || null);
    this.value = m.prop(data.value);
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
                        // TODO: only do this if source is not target;
                        // else, need to reorder block list
                        m.startComputation();
                        // TODO: separate the creation of the Block
                        // and deciding where to attach it (to the
                        // main block list or to a sublist)
                        if (el.classList.contains("control-flow-structure")) {
                            controller.blocks().push(new Block({
                                kind: "control-flow-structure",
                                subkind: el.dataset.subkind,
                                value: null,
                            }));
                        }
                        else if (el.classList.contains("primitive")) {
                             controller.blocks().push(new Block({
                                 kind: "primitive",
                                 subkind: el.innerText,
                                 value: null,
                            }));
                        }
                        // These are not legal
                        // else if (el.classList.contains("method")) {
                        //     controller.blocks().push(new Block({
                        //         kind: "method",
                        //         // TODO: subkind based on source
                        //         value: el.innerText,
                        //     }));
                        // }
                        // else if (el.classList.contains("boolean")) {
                        //     controller.blocks().push(new Block({
                        //          kind: "boolean",
                        //          value: el.innerText == "true" ? true : false,
                        //     }));
                        // }

                        drake.remove();
                        console.log(el, target, source, sibling);
                        m.endComputation();
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
        return m("div#workspace.block-acceptor", args.blocks.map(function(block, index) {
            switch (block.kind()) {
            case "primitive":
                if (block.subkind() === "number") {
                    return m("div.primitive", [
                        "Number: ",
                        m("input[type='number']")
                    ]);
                }
                else if (block.subkind() === "text") {
                    return m("div.primitive", [
                        "Text: ",
                        m("input[type='text']")
                    ]);
                }
                break;
            case "control-flow-structure":
                if (block.subkind() === "tell") {
                    return m("div.control-flow-structure", [
                        "tell ",
                        m("div.block-hole.value"),
                        " to ",
                        m("div.block-hole.method"),
                    ]);
                }
                break;
            default:
                return m("div", {
                    class: block.kind(),
                }, block.value());
            }
        }));
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
                m(".control-flow-structure.workbench-item", {
                    "data-subkind": "if/else",
                }, "if..else.."),
                m(".control-flow-structure.workbench-item", {
                    "data-subkind": "forever",
                }, "forever"),
                m(".boolean.workbench-item", "true"),
                m(".boolean.workbench-item", "false"),
                m(".primitive.workbench-item", "text"),
                m(".primitive.workbench-item", "number"),
                m(".control-flow-structure.workbench-item", {
                    "data-subkind": "tell",
                }, [
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
