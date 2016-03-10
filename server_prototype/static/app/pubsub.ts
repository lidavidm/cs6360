type PubSubHandler = (event?: any) => void;

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

    broadcast(event: string, args?: any) {
        if (!this._handlers[event]) {
            return;
        }

        this._handlers[event].forEach((handler) => {
            handler(args);
        });
    }
}
