class Session {
    aborted: boolean = false;
    paused: boolean = false;
    pauseContext: () => void = null;

    constructor(interpreter, log, code, runDiff) {
        this.event = event;
        this.interpreter = interpreter;
        this.log = log;
        this.code = code;
        log.reset();
        this.promise = new Promise(this.execute.bind(this));
    }

    private execute(resolveOuter, rejectOuter) {
        this.modelWorld.log.reset();
        this.interpreter.run(this.code).then(() => {
            this.replay(resolveOuter);
        }, (err: any) => {
            // TODO: show the error to the user
            console.log(err);
            // TODO: if the error type is BlocklyError, highlight
            // the block and add to it the error message
            this.modelWorld.log.record(new model.Diff(model.DiffKind.Error, err.toString()));

            this.replay(resolveOuter);
        });
    }

    private replay(resolveOuter) {
        this.log.replay(this.runDiffWrapper.bind(this)).then(() => {
            resolveOuter();
        });
    }

    private runDiffWrapper(diff) {
        return new Promise((resolve, reject) => {
            if (this.aborted) {
                reject();
                this.aborted = false;
                return;
            }
            else if (this.paused) {
                this.pauseContext = () => {
                    this.runDiff(resolve, reject);
                };
                return;
            }

            this.runDiff(resolve, reject);
        })
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
        this.pauseContext();
    }

    then(success, failure?) {
        this.promise.then(success, failure);
    }
}
