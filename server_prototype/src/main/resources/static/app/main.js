'use strict';

var MapComponent = require("views/map").MapComponent;

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

m.mount(document.body, GameWidget);
