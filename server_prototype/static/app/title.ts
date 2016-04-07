import * as MainView from "main";

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
            document.querySelector(".titleContainer").addEventListener("transitionend", () => {
                m.route("/game");
            });

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
            ])
        ]);
    }
};

m.route(document.body, "/", {
    "/": TitleComponent,
    // "/cinematic": CinematicComponent,
    "/game": MainView.MainComponent,
});
