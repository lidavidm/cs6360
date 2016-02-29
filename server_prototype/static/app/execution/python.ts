declare var pypyjs: any;

/**
 * An instance of a PyPy.js interpreter.
 */
export class Interpreter {
    private _vm: any;
    private _code: string;

    constructor(code: string) {
        this._code = code;

        this._vm = new pypyjs({
            totalMemory: 128 * 1024 * 1024,
            stdout: this._handle_stdout,
        });

        this._vm.ready().then(() => {
            this._vm.exec(`
# Workaround for lack of __main__. See last commit in
# https://github.com/pypyjs/pypyjs/issues/161
import bdb
import types

scope = {'__name__': '__main__', '__package__': None}
main = types.ModuleType('__main__')
main.__dict__.update(scope)

import sys
sys.modules['__main__'] = main
`);
        });
    }

    step() {
        this._vm.ready().then(() => {

        });
    }

    run() {
        this._vm.ready().then(() => {
            this._vm.exec(this._code);
        });
    }

    _handle_stdout(data: string) {
        console.log(data);
    }
}
