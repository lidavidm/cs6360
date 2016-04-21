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

export function initialize() {
}

export function newUuid(): _mithril.Thennable<string> {
    return m.request({
        method: "GET",
        url: loggingUrl("uuid"),
        deserialize: function(v) { return v; },
    });
}
