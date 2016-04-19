import * as MainView from "main";
import * as VictoryView from "views/victory";

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
            window.setTimeout(() => {
                m.route("/game");
            }, 1250)

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

m.route(document.body, "/", {
    "/": TitleComponent,
    // "/cinematic": CinematicComponent,
    "/game": MainView.MainComponent,
    "/victory": VictoryView.Component,
});
