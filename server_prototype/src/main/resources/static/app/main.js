'use strict';

var EditorComponent = require("views/editor").EditorComponent;
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

m.mount(document.body, GameWidget);
