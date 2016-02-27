// https://blockly-demo.appspot.com/static/demos/blockfactory/index.html#y95qk2
Blockly.Blocks["method"] = {
    init: function() {
        this.jsonInit({
            "id": "method",
            "message0": "%1",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "METHOD_NAME",
                    "options": [
                        [
                            "turn left",
                            "turnLeft"
                        ],
                        [
                            "move forward",
                            "moveForward"
                        ],
                        [
                            "self destruct",
                            "selfDestruct"
                        ]
                    ]
                }
            ],
            "inputsInline": true,
            "output": null,
            "colour": 260,
            "tooltip": "",
            "helpUrl": "http://www.example.com/"
        });
    },
};

// https://blockly-demo.appspot.com/static/demos/blockfactory/index.html#85mctt
Blockly.Blocks["tell"] = {
    init: function() {
        this.jsonInit({
            "id": "tell",
            "message0": "tell %1 %2 to %3 %4",
            "args0": [
                {
                    "type": "input_dummy"
                },
                {
                    "type": "input_value",
                    "name": "object"
                },
                {
                    "type": "input_dummy"
                },
                {
                    "type": "input_value",
                    "name": "method"
                }
            ],
            "inputsInline": true,
            "previousStatement": null,
            "nextStatement": null,
            "colour": 120,
            "tooltip": "",
            "helpUrl": "http://www.example.com/"
        });
    },
}
