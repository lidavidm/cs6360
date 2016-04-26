// Copyright 2016 David Li, Michael Mauer, Andy Jiang

// This file is part of Tell Me to Survive.

// Tell Me to Survive is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Tell Me to Survive is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with Tell Me to Survive.  If not, see <http://www.gnu.org/licenses/>.

import * as MainView from "main";
import * as PretestView from "views/pretest";
import * as PosttestView from "views/posttest";
import * as VictoryView from "views/victory";
import * as Logging from "logging";

interface TitleController {

}

export const TitleComponent: _mithril.MithrilComponent<TitleController> = {
    controller: function(): TitleController {
        return {};
    },

    view: function(controller: TitleController): _mithril.MithrilVirtualElement<TitleController> {
        let lastGame = window.localStorage["0"];
        let hasLastGame = !!lastGame;

        let startGame = () => {
            Logging.startGame();
            window.setTimeout(() => {
                if (hasLastGame) {
                    m.route("/game", {}, true);
                }
                else {
                    m.route("/pretest", {}, true);
                }
            }, 1250);

            document.querySelector(".titleContainer").classList.add("vanish");
        };

        return m(".titleContainer", [
            m("header", [
                m("h1", "tell me to survive"),
            ]),
            m("nav", [
                m("button.ui", {
                    onclick: function() {
                        startGame();
                    },
                }, hasLastGame ? "Continue" : "New Game"),
                m("button.ui.restart", {
                    onclick: function() {
                        delete window.localStorage["0"];
                        hasLastGame = false;
                        startGame();
                    },
                    disabled: hasLastGame ? "" : "disabled",
                }, "Restart"),
            ]),
            m("article", [
                m("p", ["Image credit: ", m("a", {
                    href: "http://www.nasa.gov/image-feature/jpl/pia19839/strata-at-base-of-mount-sharp",
                }, "NASA")]),
                m("p", [
                    "This application is free software, licensed under the GNU AGPLv3. See our ",
                    m("a", {
                        href: "https://github.com/lidavidm/cs6360"
                    }, "repository on Github"),
                    " for more details. Developed as a class project for CS 6360 (Spring 2016) at Cornell."
                ]),
                m("p", [
                    "Uses assets from the ",
                    m("a[href=http://opengameart.org/content/robot-pack]", "robot pack"),
                    " and the ",
                    m("a[href=http://kenney.nl/assets/roguelike-caves-dungeons]", "roguelike pack"),
                    ", with modifications, under the ",
                    m("a[href=https://creativecommons.org/publicdomain/zero/1.0/]", "CC0 license"),
                    ". The images of Mars and Earth are from NASA and are ",
                    m("a[href=http://www.nasa.gov/multimedia/guidelines/index.html]", "uncopyrighted"),
                    ". The ",
                    m("a[href=http://opengameart.org/content/cave-tileset-0]", "cave tileset"),
                    " and the ",
                    m("a[href=http://opengameart.org/content/denzis-scifi-tilesets]", "scifi tileset"),
                    " are used, with modifications, under the ",
                    m("a[href=https://creativecommons.org/licenses/by/3.0/us/]", "CC-BY-3.0 license"),
                    ".",
                ]),
            ])
        ]);
    }
};

Logging.initialize();
m.route(document.body, "/", {
    "/": TitleComponent,
    "/pretest": PretestView.Component,
    "/posttest": PosttestView.Component,
    "/game": MainView.MainComponent,
    "/victory": VictoryView.Component,
});
