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

const LOGGING_SERVER = "http://localhost:3000";

function loggingUrl(endpoint: string): string {
    return LOGGING_SERVER + "/" + endpoint;
}

var global_state = {
    session_id: "",
    dynamic_quest_id: "",
    session_seq_id: 0,
    quest_seq_id: 0,
    uuid: "",
};

export function initialize() {
    // TODO: initialize UUID
}

export function startGame() {
    return m.request({
        method: "GET",
        url: loggingUrl("start_session"),
        data: {
            client_timestamp: Date.now(),
        },
        deserialize: function(v) { return v; },
    }).then(function(session_id: any) {
        global_state.session_id = session_id;
        global_state.session_seq_id = 0;
    });
}

export function startLevel(levelName: string) {
    global_state.session_seq_id += 1;
    return m.request({
        method: "GET",
        url: loggingUrl("start_level"),
        data: {
            client_timestamp: Date.now(),
            session_id: global_state.session_id,
            session_seq_id: global_state.session_seq_id,
            level_name: levelName,
            uuid: global_state.uuid,
        },
        deserialize: function(v) { return v; },
    }).then(function(dynamic_quest_id: any) {
        global_state.dynamic_quest_id = dynamic_quest_id;
        global_state.quest_seq_id = 0;
    });
}

export function finishLevel() {
    return m.request({
        method: "GET",
        url: loggingUrl("finish_level"),
        data: {
            dynamic_quest_id: global_state.dynamic_quest_id,
        },
        deserialize: function(v) { return v; },
    });
}

export function recordGeneric(levelName: string, action: string, data: string) {
    global_state.quest_seq_id += 1;
    return m.request({
        method: "GET",
        url: loggingUrl("start_level"),
        data: {
            client_timestamp: Date.now(),
            session_id: global_state.session_id,
            session_seq_id: global_state.session_seq_id,
            level_name: levelName,
            quest_seq_id: global_state.quest_seq_id,
            uuid: global_state.uuid,
            action_id: action,
            dynamic_quest_id: global_state.dynamic_quest_id,
            action_detail: data,
        },
        deserialize: function(v) { return v; },
    });
}

export function recordWorkspace() {

}

export function recordContextSwitch() {

}

export function recordCodeRun() {

}

export function beginTest(testName: string) {
    startLevel("TEST_" + testName);
}

export function saveAnswers(testName: string, answers: string[]) {
    recordGeneric("TEST_" + testName, "finish_test", JSON.stringify(answers));
    finishLevel();
}

export function newUuid(): _mithril.Thennable<string> {
    return m.request({
        method: "GET",
        url: loggingUrl("uuid"),
        deserialize: function(v) { return v; },
    });
}
