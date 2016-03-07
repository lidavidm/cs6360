interface MapController extends _mithril.MithrilController {
    phaser: Phaser.Game,
    preload: () => void,
    create: () => void,
    update: () => void,
    render: () => void,
    scale: (zoomed: boolean) => void,
}

import Camera = require("camera");
import Objectives = require("views/objectives");
import Controls = require("views/controls");

/**
 * The map component handles interactions with Phaser and contains the
 * execution controls and objectives.
 */
export const Component: _mithril.MithrilComponent<MapController> = <any> {
    controller: function(): MapController {
        var controller: MapController = {
            phaser: null,
            preload: preload,
            create: create,
            update: update,
            render: render,
            scale: scale,
        };

        var game: Phaser.Game = null;
        var cursors: any = null;

        // Creating our own groups and scaling them fixes an issue
        // where scaling the world and moving the camera would create
        // an undesired parallax effect
        var camera: Camera.ZoomCamera = null;
        var bg: Phaser.Group = null;
        var fg: Phaser.Group = null;

        function preload() {
            game = controller.phaser;

            game.load.tilemap("prototype", "assets/maps/prototype.json", null, Phaser.Tilemap.TILED_JSON);
            game.load.image("tiles", "assets/tilesets/cave.png");
            game.load.image("robot", "assets/sprites/robot_3Dblue.png");

            game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
        }

        function create() {
            camera = new Camera.ZoomCamera(game);
            bg = game.add.group(camera.group);
            fg = game.add.group(camera.group);

            var map = game.add.tilemap("prototype");
            map.addTilesetImage("cave", "tiles");
            var layer = map.createLayer(
                "Tile Layer 1", game.width, game.height, bg);

            var robot = fg.create(16, 16, "robot");
            robot.width = robot.height = 16;

            cursors = game.input.keyboard.createCursorKeys();
        }

        function update() {
            if (!game.input.activePointer.withinGame) return;

            if (cursors.up.isDown) {
                camera.position.y -= 4;
            }
            else if (cursors.down.isDown) {
                camera.position.y += 4;
            }
            else if (cursors.left.isDown) {
                camera.position.x -= 4;
            }
            else if (cursors.right.isDown) {
                camera.position.x += 4;
            }

            camera.update();
        }

        function render() {
        }

        function scale(zoomed: boolean) {
            if (zoomed) {
                camera.scale.set(2, 2);
            }
            else {
                camera.scale.set(1, 1);
            }
        }

        return controller;
    },

    view: function(controller: MapController, args: any) {
        var style = "";
        if (args.executing()) {
            style = ".executing";
        }

        return m("div#sidebar" + style, [
            m("div#worldMap", {
                config: function(element: HTMLElement, isInitialized: boolean) {
                    if (!isInitialized) {
                        controller.phaser = new Phaser.Game("100", "100", Phaser.CANVAS, element, {
                            preload: controller.preload,
                            create: controller.create,
                            update: controller.update,
                            render: controller.render,
                        });
                    }
                },
            }),
            m.component(Objectives.Component, [
                [false, "Move the robot to the iron"],
                [false, "Take the iron"],
                [false, "Move the robot back to base"],
            ]),
            m.component(Controls.Component, {
                executing: args.executing,
                scale: controller.scale,
            }),
        ]);
    },
};
