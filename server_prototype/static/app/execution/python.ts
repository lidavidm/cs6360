declare var Sk: any;
import * as model from "model/model";
import * as level from "level";

/**
 * An instance of a Skulpt interpreter.
 */
export class Interpreter {
    // code that is run before the player's program is executed
    // for example, class definitions go here
    private _initCode: string;

    // the world that this interpreter updates
    private _world: model.World;

    constructor(world: model.World) {
        this._world = world;

        // Set up Python output to go to the console (for debugging needs)
        Sk.configure({output: (arg: any) => {
            console.log(arg);
        }});

        /**
         * Executes a method call with an object (identified by id) in this
         * interpreter's world. Called by interpreted python code.
         */
        Sk.builtins.methodCall = new Sk.builtin.func(
            function(id: number, methodName: string, args: any[]) {
                id = Sk.ffi.remapToJs(id);
                methodName = Sk.ffi.remapToJs(methodName);
                args = Sk.ffi.remapToJs(args);

                var obj: any = world.getObjectByID(id);
                // TODO: catch and throw (in Python) any exceptions
                obj[methodName].apply(obj, args);
            }
        );

        /**
         * Records the end of a block in the world's log. Called by python
         * code that is injected during the code generation phase.
         */
        Sk.builtins.recordBlockEnd = new Sk.builtin.func(function(blockID: any) {
            blockID = Sk.ffi.remapToJs(blockID);
            world.log.recordBlockEnd(blockID);
        });

        Sk.builtins.recordBlockBegin = new Sk.builtin.func(function(blockID: any) {
            blockID = Sk.ffi.remapToJs(blockID);
            world.log.recordBlockBegin(blockID);
        });
    }

    // /**
    //  * A method for initializing objects that exist at the start of the level.
    //  */
    // instantiateObject(varName: string, className: string, id: number) {
    //     var line = '\n' + varName + ' = JSProxyClass(' + id + ')';
    //     this._initCode = this._initCode + line;
    // }

    // /**
    //  * Initialize all objects defined in the toolbox.
    //  */
    // instantiateAll() {
    //     for (let [name, className] of this._toolbox.getObjects()) {
    //         let modelObject = this._world.getObjectByName(name);
    //         if (!modelObject) {
    //             throw new Error(`Model object ${name} not found.`);
    //         }
    //         this.instantiateObject(name, className, modelObject.getID());
    //     }
    // }

    /**
     * Run the player's program to generate a diff log for
     * this interpreter's world
     */
    run(program: string) {
        return Sk.misceval.asyncToPromise(function() {
            return Sk.importMainWithBody("<stdin>", false, program, true);
        });
    }
}
