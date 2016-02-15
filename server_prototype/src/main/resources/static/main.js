'use strict';

function Block(data) {
    this.kind = m.prop(data.kind);
    this.subkind = m.prop(data.subkind || null);
    this.value = m.prop(data.value);
    /// Array of string or Block. String = a hole of type (string
    /// value), i.e. "method" means we want a method block here.
    this.children = m.prop(data.children || []);
}
Block.newControlFlow = function(subkind, children) {
    children = children || [];
    switch (subkind) {
    case "tell":
        children[0] = children[0] || "object";
        children[1] = children[1] || "method";
        break;
    default:
        throw "Error: invalid control flow subkind: " + subkind;
    }
    return new Block({
        kind: "control-flow-structure",
        subkind: subkind,
        value: null,
        children: children,
    });
};
// TODO: specify class as well
Block.newMethod = function(name) {
    return new Block({
        kind: "method",
        subkind: null,
        value: name,
    })
};

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
            blocks: m.prop([Block.newControlFlow("tell", [
                null,
                Block.newMethod("moveForward"),
            ])]),
            showTrash: m.prop(false),
            handleDrop: handleDrop,
            drake: null,
        };

        function makeBlock(el) {
            if (el.classList.contains("control-flow-structure")) {
                return Block.newControlFlow(el.dataset.subkind);
            }
            else if (el.classList.contains("primitive")) {
                return new Block({
                    kind: "primitive",
                    subkind: el.innerText,
                    value: null,
                });
            }
            else if (el.classList.contains("method")) {
                // TODO: set class based on source
                return Block.newMethod(el.textContent);
            }
            else if (el.classList.contains("boolean")) {
                return new Block({
                    kind: "boolean",
                    value: el.innerText == "true" ? true : false,
                });
            }
            return null;
        }

        function findBlock(target) {
            var indices = [parseInt(target.dataset.index, 10)];
            target = target.parentNode;
            while (target && target.id !== "block-editor" &&
                   target.id !== "workspace") {
                indices.push(parseInt(target.dataset.index, 10));
                target = target.parentNode;
            }

            indices.reverse();

            var blockObj = null;
            if (indices.length > 1) {
                blockObj = controller.blocks()[indices[0]];
            }
            for (var i = 1; i < indices.length - 1; i++) {
                blockObj = blockObj.children()[i];
            }

            return {
                block: blockObj,
                indices: indices,
            };
        }

        function handleDrop(el, target, source, sibling) {
            m.startComputation();
            if (source === target) {
                // TODO: reorder the list
            }
            else if (target === null) {

            }
            else if (target.classList.contains("block-trash")) {
                // target is the deletion zone, so the last index is
                // the index of the block, and blockObj is the parent
                // (or null)

                // Don't bother trying to delete the block if it
                // didn't come from the block editor
                if (!source.classList.contains("workbench-area")) {
                    var result = findBlock(source);
                    var lastIndex = result.indices[result.indices.length - 1];
                    if (result.block) {
                        // Deleting sub-block, put a hole back in
                        result.block.children()[lastIndex] = result.block.children()[lastIndex].kind();
                        console.log(result.block.children());
                    }
                    else {
                        controller.blocks().splice(lastIndex, 1);
                    }
                }
                controller.drake.remove();

                // TODO: remove from list
            }
            else {
                var block = makeBlock(el);

                if (block) {
                    if (target.id === "block-editor") {
                        if (block.kind() === "control-flow-structure") {
                            controller.blocks().push(block);
                        }
                        else {
                            // TODO: some sort of error message +
                            // visual indicator
                        }
                    }
                    else {
                        // target is a hole, so the last index is the
                        // index of the hole, and blockObj is the
                        // parent
                        var result = findBlock(target);
                        var indices = result.indices;
                        var blockObj = result.block;
                        var childIndex = result.indices[result.indices.length - 1];

                        // Make sure child is of correct type
                        var children = blockObj.children();
                        var blockType = children[childIndex] instanceof Block ?
                            children[childIndex].kind() :
                            children[childIndex];
                        if (block.kind() === blockType) {
                            blockObj.children()[childIndex] = block;
                        }
                        else {
                            // TODO: error + visual indicator
                        }
                    }
                }

                controller.drake.remove();
            }

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
                                    target.classList.contains("block-hole") ||
                                    target.classList.contains("block-trash"));
                        },
                        isContainer: function(el) {
                            return el.classList.contains("block-container") ||
                                el.classList.contains("block-hole") ||
                                el.classList.contains("block-acceptor");
                        }
                    });
                    controller.drake.containers.push(document.getElementById("workspace"));
                    controller.drake.containers.push(document.getElementById("workbench"));
                    controller.drake.on("drop", controller.handleDrop);
                    controller.drake.on("drag", function() {
                        m.startComputation();
                        controller.showTrash(true);
                        m.endComputation();
                    });
                    controller.drake.on("dragend", function() {
                        m.startComputation();
                        controller.showTrash(false);
                        m.endComputation();
                    });

                }
            },
        }, [
            m.component(WorkspaceComponent, {
                blocks: controller.blocks(),
                showTrash: controller.showTrash(),
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
        return m("div." + kind + ".block-hole", {
            key: index,
            "data-index": index,
        });
    },

    renderBlock: function(block, index, toplevel) {
        if (!block) return false;

        var config = {
            key: index,
            "data-index": index,
        };
        var blockEl = null;
        switch (block.kind()) {
        case "primitive":
            if (block.subkind() === "number") {
                blockEl = m("div.primitive", config, [
                    "Number: ",
                    m("input[type='number']")
                ]);
            }
            else if (block.subkind() === "text") {
                blockEl = m("div.primitive", config, [
                    "Text: ",
                    m("input[type='text']")
                ]);
            }
            break;
        case "control-flow-structure":
            if (block.subkind() === "tell") {
                blockEl = m("div.block.control-flow-structure", config, [
                    "tell ",
                    this.render(block.children()[0], 0, false),
                    " to ",
                    this.render(block.children()[1], 1, false)
                ]);
            }
            break;
        default:
            blockEl = m("div.block." + block.kind(),
                     config, block.value());
        }

        if (toplevel) {
            return blockEl;
        }
        return m(".block-hole.filled", config, blockEl);
    },

    render: function(blockOrHole, index, toplevel) {
        if (typeof blockOrHole === "string") {
            return this.renderHole(blockOrHole, index);
        }
        return this.renderBlock(blockOrHole, index, toplevel);
    },

    view: function(controller, args) {
        return m("div#workspace", [
            m(".block-acceptor#block-editor", args.blocks.map(function(block, index) {
                return WorkspaceComponent.render(block, index, true);
            })),
            m(".block-acceptor.block-trash", {
                style: {
                    display: args.showTrash ? "block" : "none",
                },
            }),
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
            m(".methods.block-container", [
                m(".method.block", "moveForward"),
                m(".method.block", "turnLeft"),
                m(".method.block", "selfDestruct"),
                m(".method.block", "reverse"),
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
                m(".control-flow-structure.block", {
                    "data-subkind": "if/else",
                }, "if..else.."),
                m(".control-flow-structure.block", {
                    "data-subkind": "forever",
                }, "forever"),
                m(".boolean.block", "true"),
                m(".boolean.block", "false"),
                m(".primitive.block", "text"),
                m(".primitive.block", "number"),
                m(".control-flow-structure.block", {
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
