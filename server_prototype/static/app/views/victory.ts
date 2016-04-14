import PubSub = require("pubsub");

import {DEFAULT_PROGRESSION} from "progression";
import {Savegame} from "savegame";

interface VictoryController extends _mithril.MithrilController {
    savegame: Savegame,
    code: _mithril.MithrilProperty<string>,
    codeList: _mithril.MithrilProperty<boolean>,
}

export const Component: _mithril.MithrilComponent<VictoryController> = <any> {
    controller: function(): VictoryController {
        let savegame = Savegame.parse(window.localStorage["0"]);

        return {
            savegame: savegame,
            code: m.prop(""),
            codeList: m.prop(false),
        };
    },

    view: function(controller: VictoryController): _mithril.MithrilVirtualElement<VictoryController> {
        return m("div#victory",
                 m(".victory-container", [
                     m(".victory-background"),
                     m("header", m("h1", "Victory")),
                     m("article", [
                         m("p", [
                             m("span", "Congratulations, Commander. "),
                             "Thanks to your hard work, we saved the Mars Mission from failing. For those critical few hours, the future of Mars colonization depended on your talent, and without you, all would have been lost."
                         ]),
                         m("p", [
                             "We're approaching Earth, T-minus 15 minutes."
                         ]),
                         m("p", [
                             "Welcome home, commander."
                         ]),
                         m("h2", "See Your Code"),
                         m(".clearfix"),
                         m("ul.view-code", DEFAULT_PROGRESSION.levels.map(([name, levelProto]) => {
                             let level = new levelProto;
                             level.program.update(controller.savegame);

                             // Instantiate globals
                             level.program.classes = level.toolbox.getClasses();
                             let i = 0;
                             for (let [name, className] of level.toolbox.getObjects()) {
                                 level.program.instantiateGlobal(name, className, i);
                                 i++;
                             }

                             level.loadHierarchy(controller.savegame.loadAll());
                             controller.savegame.currentLevel = name;
                             let code = [level.program.getClassCode(), level.program.getMainCode(true)].join("\n");
                             return m("li", {
                                 onclick: () => {
                                     controller.code(code);
                                     console.log(controller.code());
                                 },
                             }, level.missionTitle);
                         })),
                         controller.code() ? m("pre.view-code", controller.code()) : null,
                     ])
                 ]));
    }
}
