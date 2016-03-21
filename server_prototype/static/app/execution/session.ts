class Session {
    aborted: boolean = false;
    paused: boolean = false;
    pauseContext: [() => void, () => void] = null;

    constructor(interpreter, log, code, runDiff) {
        this.event = event;
        this.interpreter = interpreter;
        this.log = log;
        this.code = code;
        this.promise = new Promise((resolveOuter, rejectOuter) => {

        });
    }

    abort() {
        this.aborted = true;
    }

    pause() {
        this.paused = true;
    }

    unpause() {
        this.paused = false;
    }

    step() {

    }
}
