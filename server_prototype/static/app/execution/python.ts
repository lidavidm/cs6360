declare var pypyjs: any;

export class Interpreter {
    private _vm: any;
    private _code: string;

    constructor(code: string) {
        this._code = code;

        this._vm = new pypyjs({
            totalMemory: 128 * 1024 * 1024,
            stdout: this._handle_stdout,
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
