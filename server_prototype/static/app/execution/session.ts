import {Interpreter} from "python";
import {Program} from "program";
import {Diff, DiffKind, Log} from "model/model";
import {PubSub} from "pubsub";
import * as Logging from "logging";

type DiffRunner = (diff: Diff<any>, initialized: {
    [id: number]: boolean,
}, resolve: () => void, reject: () => void) => void;

export class Session {
    aborted: boolean = false;
    paused: boolean = false;
    pauseContext: () => void = null;

    interpreter: Interpreter;
    log: Log;
    program: Program;
    runDiff: DiffRunner;
    promise: Promise<{}>;

    constructor(interpreter: Interpreter, log: Log, program: Program, runDiff: DiffRunner) {
        this.interpreter = interpreter;
        this.log = log;
        this.program = program;
        log.reset();
        this.promise = new Promise(this.execute.bind(this));
        this.runDiff = runDiff;
    }

    private execute(resolveOuter: () => void, rejectOuter: () => void) {
        this.log.reset();
        let [code, offset] = this.program.getCode();
        Logging.recordCodeRun("normal", code);

        this.interpreter.run(code).then(() => {
            Logging.recordCodeRun("finished");
            this.replay(resolveOuter);
        }, (err: any) => {
            Logging.recordRuntimeException(JSON.stringify(err));
            console.log(err);
            let recordedErr = err.toString();
            if (err.nativeError) {
                recordedErr = err.nativeError.message || err.nativeError;
            }
            if (err.traceback && err.traceback.length > 0) {
                let lastTB = err.traceback[err.traceback.length - 1];
                let line = lastTB.lineno;
                let actualLine = line - offset;

                recordedErr = `On line ${actualLine}: ${recordedErr}`;
            }
            this.log.record(new Diff(DiffKind.Error, recordedErr));

            this.replay(resolveOuter);
        });
    }

    private replay(resolveOuter: () => void) {
        this.log.replay(this.runDiffWrapper.bind(this)).then(() => {
            resolveOuter();
        });
    }

    private runDiffWrapper(diff: Diff<any>, initialized: {
        [id: number]: boolean,
    }) {
        return new Promise((resolve, reject) => {
            if (this.aborted) {
                reject();
                this.aborted = false;
                return;
            }
            else if (this.paused && diff.kind === DiffKind.BeginningOfBlock) {
                this.pauseContext = () => {
                    this.runDiff(diff, initialized, resolve, reject);
                };
                return;
            }

            this.runDiff(diff, initialized, resolve, reject);
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
        if (this.pauseContext) {
            this.pauseContext();
        }
    }

    step() {
        if (this.pauseContext) {
            this.pauseContext();
        }
    }

    then(success: () => any, failure?: () => any): any {
        this.promise.then(success, failure);
    }
}
