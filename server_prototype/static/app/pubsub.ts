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

type PubSubHandler = (event?: any, ...args: any[]) => void;

export class PubSub {
    _handlers: { [event: string]: PubSubHandler[] };

    constructor() {
        this._handlers = {};
    }

    on(event: string, handler: PubSubHandler) {
        if (!this._handlers[event]) {
            this._handlers[event] = [];
        }
        this._handlers[event].push(handler);
    }

    off(event: string, handler: PubSubHandler) {
        if (!this._handlers[event]) {
            return;
        }

        let index = this._handlers[event].indexOf(handler);
        this._handlers[event].splice(index, 1);
    }

    broadcast(event: string, ...args: any[]) {
        if (!this._handlers[event]) {
            return;
        }

        this._handlers[event].forEach((handler) => {
            handler.apply(null, args);
        });
    }
}
