'use strict';

function Block(data) {
    this.kind = m.prop(data.kind);
    this.subkind = m.prop(data.subkind || null);
    this.value = m.prop(data.value);
    this.children = m.prop(data.children || []);
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
        var controller = {
            blocks: m.prop([]),
            handleDrop: handleDrop,
            drake: null,
        };

        function handleDrop(el, target, source, sibling) {
            // TODO: only do this if source is not target;
            // else, need to reorder block list
            m.startComputation();
            if (source === target) {
                // TODO: reorder the list
            }
            else if (target === null) {

            }
            else {
                var block;
                if (el.classList.contains("control-flow-structure")) {
                    block = new Block({
                        kind: "control-flow-structure",
                        subkind: el.dataset.subkind,
                        value: null,
                    });
                }
                else if (el.classList.contains("primitive")) {
                    block = new Block({
                        kind: "primitive",
                        subkind: el.innerText,
                        value: null,
                    });
                }
                else if (el.classList.contains("method")) {
                    block = new Block({
                        kind: "method",
                        // TODO: subkind based on source
                        value: el.innerText,
                    });
                }

                if (block) {
                    if (target.id === "workspace") {
                        if (block.kind() === "control-flow-structure") {
                            controller.blocks().push(block);
                        }
                        else {
                            // TODO: some sort of error message +
                            // visual indicator
                        }
                    }
                    else {
                        var indices = [];
                        var childIndex = parseInt(target.dataset.childIndex, 10);
                        target = target.parentNode;
                        while (target.id !== "workspace") {
                            indices.push(parseInt(target.dataset.key, 10));
                            target = target.parentNode;
                        }

                        var blockObj = controller.blocks()[indices.length - 1];
                        for (var i = indices.length - 2; i >= 0; i--) {
                            blockObj = blockObj.children()[i];
                        }
                        blockObj.children()[childIndex] = block;
                    }
                }

                controller.drake.remove();
            }
            // These are not legal
            // else if (el.classList.contains("boolean")) {
            //     controller.blocks().push(new Block({
            //          kind: "boolean",
            //          value: el.innerText == "true" ? true : false,
            //     }));
            // }

            m.endComputation();
        }

        return controller;
    },

    view: function(controller) {
        return m("div#editor", {
            config: function(element, isInitialized) {
                if (!isInitialized) {
                    controller.drake = dragula({
                        copy: function(el, source) {
                            return source.classList.contains("block-container");
                        },
                        accepts: function(el, target, source, sibling) {
                            return (
                                (el.classList.contains("control-flow-structure") &&
                                 target.classList.contains("block-acceptor")) ||
                                target.classList.contains("block-hole"));
                        },
                        isContainer: function(el) {
                            return el.classList.contains("block-container") ||
                                el.classList.contains("block-hole");
                        }
                    });
                    controller.drake.containers.push(document.getElementById("workspace"));
                    controller.drake.containers.push(document.getElementById("workbench"));
                    controller.drake.on("drop", controller.handleDrop);
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

    renderHole: function(kind, index) {
        return m("div.block-hole." + kind, {
            key: index,
            "data-child-index": index,
        });
    },

    renderBlock: function(block, index) {
        if (!block) return false;

        var config = {
            key: index,
            "data-key": index,
        };
        switch (block.kind()) {
        case "primitive":
            if (block.subkind() === "number") {
                return m("div.primitive", config, [
                    "Number: ",
                    m("input[type='number']")
                ]);
            }
            else if (block.subkind() === "text") {
                return m("div.primitive", config, [
                    "Text: ",
                    m("input[type='text']")
                ]);
            }
            break;
        case "control-flow-structure":
            if (block.subkind() === "tell") {
                return m("div.workspace-block.control-flow-structure", config, [
                    "tell ",
                    WorkspaceComponent.renderBlock(block.children()[0], 0) ||
                        WorkspaceComponent.renderHole("value", 0),
                    " to ",
                    WorkspaceComponent.renderBlock(block.children()[1], 1) ||
                        WorkspaceComponent.renderHole("method", 1)
                ]);
            }
            break;
        default:
            return m("div.workspace-block." + block.kind(),
                     config, block.value());
        }
    },

    view: function(controller, args) {
        return m("div#workspace.block-acceptor", args.blocks.map(function(block, index) {
            return WorkspaceComponent.renderBlock(block, index);
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
