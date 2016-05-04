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

import {Savegame} from "savegame";
import {EditorContext, MAIN} from "model/editorcontext";

const LOGGING_SERVER = "https://logging.lidavidm.me";

function loggingUrl(endpoint: string): string {
    return LOGGING_SERVER + "/" + endpoint;
}

enum Action {
    Savegame = 0,
    Workspace = 1,
    ContextSwitch = 2,
    Execute = 3,
    Exception = 4,
    FinishTest = 5,
    SavedClass = 6,
    SavedLevel = 7,
}

var global_state = {
    session_id: "",
    dynamic_quest_id: "",
    session_seq_id: 0,
    quest_seq_id: 0,
    uuid: "",
    level: -100,
};

function request(endpoint: string, data: {
    [param: string]: any,
}): _mithril.Thennable<any> {
    data["game_id"] = 4;
    data["version_id"] = 0;
    return m.request({
        method: "GET",
        url: loggingUrl(endpoint),
        data: data,
    });
}

export function initialize() {
    let uuid = window.localStorage["uuid"];
    if (uuid) {
        console.log("Saved UUID:", uuid);
        global_state.uuid = uuid;
        request("page_load.php", {
            client_timestamp: Date.now(),
        }).then(function(response: any) {
            global_state.session_id = response.session_id;
            global_state.session_seq_id = 0;
        });
    }
    else {
        request("page_load.php", {
            client_timestamp: Date.now(),
        }).then(function(response: any) {
            console.log("New UUID: ", response.user_id);
            global_state.uuid = response.user_id;
            window.localStorage["uuid"] = global_state.uuid;
            global_state.session_id = response.session_id;
            global_state.session_seq_id = 0;
        });
    }
}

export function startLevel(levelID: number) {
    global_state.session_seq_id += 1;
    global_state.level = levelID;
    return request("player_quest.php", {
        client_timestamp: Date.now(),
        session_id: global_state.session_id,
        session_seq_id: global_state.session_seq_id,
        quest_id: levelID,
        user_id: global_state.uuid,
    }).then(function(response: any) {
        global_state.dynamic_quest_id = response.dynamic_quest_id;
        global_state.quest_seq_id = 0;
    });
}

export function finishLevel() {
    return request("player_quest_end.php", {
        dynamic_quest_id: global_state.dynamic_quest_id,
    });
}

export function recordGeneric(levelID: number, action: Action, data: string) {
    global_state.quest_seq_id += 1;
    return request("player_action.php", {
        client_timestamp: Date.now(),
        quest_id: levelID,
        quest_seq_id: global_state.quest_seq_id,
        user_id: global_state.uuid,
        action_id: action,
        session_id: global_state.session_id,
        session_seq_id: global_state.session_seq_id,
        dynamic_quest_id: global_state.dynamic_quest_id,
        action_detail: data,
    });
}

export function recordSavegame(savegame: Savegame) {
    let classes = JSON.parse(savegame.stringify())["classes"];
    let level = savegame.load({
        className: MAIN,
        method: "",
    });
    recordGeneric(global_state.level, Action.SavedLevel, JSON.stringify(level));

    for (let className of Object.keys(classes)) {
        console.log("Saving class", className);
        let saved = Object.create(null);
        saved[className] = classes[className];
        console.log(JSON.stringify(saved));
        recordGeneric(global_state.level, Action.SavedClass, JSON.stringify(saved));
    }
}

export function recordWorkspace(context: EditorContext, workspace: HTMLElement | string) {
    return recordGeneric(global_state.level, Action.Workspace, JSON.stringify({
        context: {
            className: context.className,
            method: context.method,
        },
        workspace: (workspace instanceof HTMLElement) ? workspace.outerHTML : workspace,
    }));
}

export function recordContextSwitch(context: EditorContext) {
    return recordGeneric(global_state.level, Action.ContextSwitch, JSON.stringify({
        context: {
            className: context.className,
            method: context.method,
        },
    }));
}

export function recordCodeRun(event: string, code?: string) {
    return recordGeneric(global_state.level, Action.Execute, JSON.stringify({
        event: event,
        code: code,
    }));
}

export function recordRuntimeException(exception: string) {
    return recordGeneric(global_state.level, Action.Exception, exception);
}

export function beginTest(testID: number) {
    startLevel(testID);
}

export function saveAnswers(testID: number, answers: string[]) {
    recordGeneric(testID, Action.FinishTest, JSON.stringify(answers));
    finishLevel();
}
