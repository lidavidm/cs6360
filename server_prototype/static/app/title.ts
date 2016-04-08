import * as MainView from "main";

enum TitleState {
    TitleScreen,
    Text,
}

interface TitleController {
    state: _mithril.MithrilProperty<TitleState>,
    textIndex: _mithril.MithrilProperty<number>,
}

const TEXTS = [
    m("h1", "Isn't it beautiful?"),
    m("h1", "…"),
    m("h1", "Something's wrong."),
];

const CLASSES = [
    "",
    "",
    ".wrong",
];

export const TitleComponent: _mithril.MithrilComponent<TitleController> = {
    controller: function(): TitleController {
        return {
            state: m.prop(TitleState.TitleScreen),
            textIndex: m.prop(0),
        };
    },

    view: function(controller: TitleController): _mithril.MithrilVirtualElement<TitleController> {
        let lastGame = window.localStorage["0"];
        let hasLastGame = !!lastGame;

        let transitionMain = () => {
            document.querySelector(".titleContainer").addEventListener("transitionend", () => {
                m.route("/game");
            });

            document.querySelector(".titleContainer").classList.add("vanish");
        };

        let startGame = () => {
            if (!hasLastGame) {
                let title = document.querySelector(".titleContainer");
                title.addEventListener("transitionend", () => {
                    window.setTimeout(() => {
                        m.startComputation();
                        controller.state(TitleState.Text);
                        m.endComputation();
                    }, 2000);
                });

                title.classList.add("to-story");
            }
            else {
                transitionMain();
            }
        };

        switch (controller.state()) {
        case TitleState.TitleScreen:
            return m(".titleContainer", [
                m("header", [
                    m("h1.non-story", "tell me to survive"),
                ]),
                m("nav.non-story", [
                    m("button.ui", {
                        onclick: function() {
                            startGame();
                        },
                    }, hasLastGame ? "Continue" : "New Game"),
                    m("button.ui.restart", {
                        onclick: function() {
                            delete window.localStorage["0"];
                            m.route("/game");
                        },
                        disabled: hasLastGame ? "" : "disabled",
                    }, "Restart"),
                ]),
                m("article.non-story", [
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
        case TitleState.Text:
            return m(".titleContainer.story" + CLASSES[controller.textIndex()], {
                onclick: function() {
                    controller.textIndex(controller.textIndex() + 1);
                    if (controller.textIndex() >= TEXTS.length) {
                        transitionMain();
                    }
                },
            }, [
                m("header"),
                m("article", [
                    TEXTS[controller.textIndex()],
                    m("p.hint", "Click to advance"),
                ]),
            ]);
        }

    }
};

m.route(document.body, "/", {
    "/": TitleComponent,
    // "/cinematic": CinematicComponent,
    "/game": MainView.MainComponent,
});
