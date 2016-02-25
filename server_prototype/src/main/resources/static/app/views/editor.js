var EditorComponent = {
    controller: function(args) {
        var controller = {
            toolbox: m.prop(document.getElementById("toolbox").textContent),
            workspace: null,
        };

        return controller;
    },

    view: function(controller, args) {
        console.log("Editor", args.executing());
        if (controller.workspace) {
            controller.workspace.options.readOnly = args.executing();
        }
        return m("div#editor", {
            class: args.executing() ? "executing" : "",
            config: function(element, isInitialized) {
                if (isInitialized) {
                    // https://groups.google.com/forum/#!topic/blockly/WE7x-HPh81A
                    // According to above link, window resize event is
                    // needed for Blockly to resize itself
                    window.dispatchEvent(new Event("resize"));

                    // Hide the toolbox if we're running code
                    if (args.executing()) {
                        document.querySelector(".blocklyTreeRoot")
                            .style.display = "none";
                    }
                    else {
                        document.querySelector(".blocklyTreeRoot")
                            .style.display = "block";
                    }
                    return;
                }

                controller.workspace = Blockly.inject(element, {
                    toolbox: controller.toolbox(),
                    trashcan: true,
                });
            },
        });
    },
};

module.exports = {
    EditorComponent: EditorComponent,
};
