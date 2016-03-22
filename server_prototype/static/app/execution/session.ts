import {Interpreter} from "python";
import {Diff, DiffKind, Log} from "model/model";
import {PubSub} from "pubsub";

type DiffRunner = (diff: Diff<any>, resolve: () => void, reject: () => void) => void;

export class Session {
    aborted: boolean = false;
    paused: boolean = false;
    pauseContext: () => void = null;

    interpreter: Interpreter;
    log: Log;
    code: string;
    runDiff: DiffRunner;
    promise: Promise<{}>;

    constructor(interpreter: Interpreter, log: Log,
                code: string, runDiff: DiffRunner) {
        this.interpreter = interpreter;
        this.log = log;
        this.code = code;
        log.reset();
        this.promise = new Promise(this.execute.bind(this));
        this.runDiff = runDiff;
    }

    private execute(resolveOuter: () => void, rejectOuter: () => void) {
        this.log.reset();
        this.interpreter.run(this.code).then(() => {
            this.replay(resolveOuter);
        }, (err: any) => {
            // TODO: show the error to the user
            console.log(err);
            // TODO: if the error type is BlocklyError, highlight
            // the block and add to it the error message
            this.log.record(new Diff(DiffKind.Error, err.toString()));

            this.replay(resolveOuter);
        });
    }

    private replay(resolveOuter: () => void) {
        this.log.replay(this.runDiffWrapper.bind(this)).then(() => {
            resolveOuter();
        });
    }

    private runDiffWrapper(diff: Diff<any>) {
        return new Promise((resolve, reject) => {
            if (this.aborted) {
                reject();
                this.aborted = false;
                return;
            }
            else if (this.paused && diff.kind === DiffKind.BeginningOfBlock) {
                this.pauseContext = () => {
                    this.runDiff(diff, resolve, reject);
                };
                return;
            }

            this.runDiff(diff, resolve, reject);
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
        this.pauseContext();
    }

    step() {
        this.pauseContext();
    }

    then(success: () => any, failure?: () => any): any {
        this.promise.then(success, failure);
    }
}
