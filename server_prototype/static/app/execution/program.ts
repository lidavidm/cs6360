declare var Sk: any;

import {Savegame} from "savegame";
import {Toolbox} from "level";
import {MAIN} from "model/editorcontext";
import {World} from "model/model";
import {ObjectHierarchy} from "views/hierarchy";

const PROXY_CLASS = `
class JSProxyClass(object):
    def __init__(self, jsid):
        self.jsid = jsid

    def __getattr__(self, attribute):
        return self._proxy(attribute)

    def _proxy(self, attribute):
        jsid = self.jsid
        def _proxy(*args):
            methodCall(jsid, attribute, args)
        return _proxy
class BlocklyError(Exception):
    """
    An exception indicating the user did something wrong in Blockly.
    """
    def __init__(self, blockID, message):
        self.blockID = blockID
        self.message = message

counter = 0
MAX_NUM_EXECUTED_LINES = 200
def incrementCounter():
    global counter
    counter = counter + 1
    if counter >= MAX_NUM_EXECUTED_LINES:
        raise RuntimeError("The interpreter timed out. Too many lines were executed.")

`;

function indent(code: string, indent: string) {
    return code.split("\n").map(function(line) {
        return indent + line;
    }).join("\n");
}

export class Program {
    savegame: Savegame = null;
    classes: string[];
    globals: [string, string, number][];
    invalid: boolean;
    hierarchy: ObjectHierarchy;

    constructor(hierarchy: ObjectHierarchy) {
        this.globals = [];
        this.classes = [];
        this.invalid = false;
        this.hierarchy = hierarchy;
    }

    update(savegame: Savegame) {
        this.savegame = savegame;
    }

    instantiateGlobal(varName: string, className: string, modelID: number) {
        this.globals.push([varName, className, modelID]);
    }

    instantiateGlobals(world: World, toolbox: Toolbox) {
        this.classes = toolbox.getClasses();
        for (let [name, className] of toolbox.getObjects()) {
            let modelObject = world.getObjectByName(name);
            if (!modelObject) {
                throw new Error(`Model object ${name} not found.`);
            }
            this.instantiateGlobal(name, className, modelObject.getID());
        }
    }

    isCodeValid(): boolean {
        if (!this.savegame) return true;
        let code = this.getCode();

        return !this.invalid && code.indexOf("raise BlocklyError") === -1;
    }

    isCodeFullValid(): boolean {
        // More time-consuming check
        if (!this.savegame) return true;
        let code = this.getCode();
        // Make sure code doesn't actually run
        code = "if False:\n" + indent(code, "    ");
        console.log(code);

        try {
            Sk.importMainWithBody("<validate>", false, code, false);
        }
        catch (e) {
            console.log(e);
            return false;
        }

        return !this.invalid && code.indexOf("raise BlocklyError") === -1;
    }

    /**
     * Flag the program as invalid for some external reason.
     */
    flagInvalid(invalid: boolean) {
        this.invalid = invalid;
    }

    getCode(): string {
        Blockly.Python.STATEMENT_PREFIX = "recordBlockBegin(%1)\n"
        Blockly.Python.STATEMENT_POSTFIX = "recordBlockEnd(%1)\nincrementCounter()\n"

        let support = this.getSupportCode();
        let code = this.getMainCode();

        Blockly.Python.STATEMENT_PREFIX = "";
        Blockly.Python.STATEMENT_POSTFIX = "";

        return [support, code].join("\n");
    }

    getSupportCode(): string {
        if (!this.savegame) return "";
        let code = PROXY_CLASS;

        let savedClasses = this.savegame.loadAll();
        let headlessWorkspace = new Blockly.Workspace();
        let classDefns: string[] = [];

        if (this.hierarchy) {
            let classQueue: [ObjectHierarchy, string][] = [[this.hierarchy, "JSProxyClass"]];
            while (classQueue.length > 0) {
                let [classDesc, parent] = classQueue.pop();
                let className = classDesc.name;
                let classObj = savedClasses[className];
                let methods = "";
                if (classObj) {
                    methods = Object.keys(classObj).map((methodName) => {
                        return indent(this.getMethodCode(className, methodName), "    ");
                    }).join("\n");
                }
                if (!methods.trim()) {
                    methods = "    pass";
                }

                classDefns.push(`
class ${className}(${parent}):
${methods}
`);

                if (classDesc.children) {
                    for (let child of classDesc.children) {
                        classQueue.push([child, className]);
                    }
                }
            }
        }
        else {
            for (let className of this.classes) {
                let classObj = savedClasses[className];
                let methods = "";
                if (classObj) {
                    methods = Object.keys(classObj).map((methodName) => {
                        return indent(this.getMethodCode(className, methodName), "    ");
                    }).join("\n");
                }
                if (!methods.trim()) {
                    methods = "    pass";
                }

                classDefns.push(`
class ${className}(JSProxyClass):
${methods}
`);
            }
        }

        let classes = classDefns.join("\n");

        return [code, classes].join("\n");
    }

    getMethodCode(className: string, methodName: string): string {
        let savedClasses = this.savegame.loadAll();
        let classObj = savedClasses[className];
        let impl = classObj[methodName];
        if (typeof impl === "string") {
            return impl;
        }
        else {
            let help = `# This is a method of class ${className}.
# You can always look for methods to call in the class hierarchy view in the top right.\n`;
            let headlessWorkspace = new Blockly.Workspace();
            Blockly.Xml.domToWorkspace(headlessWorkspace, impl);
            let body = Blockly.Python.workspaceToCode(headlessWorkspace);
            let indentedBody = indent(body.trim() || "pass", "    ");
            return `${help}def ${methodName}(self):\n${indentedBody}`
        }
    }

    getMainCode(): string {
        let globals = this.globals.map(([varName, className, modelID]) => {
            return `\n${varName} = ${className}(${modelID})`
        }).join("\n");

        return `# These are the global variables you have access to.
${globals}

# Beginning of main code
${this.getRawCode()}
`;
    }

    getRawCode(): string {
        if (!this.savegame) return "";
        // Code generation always has to be done with main workspace showing main
        let main = this.savegame.load({
            className: MAIN,
            method: null,
        });
        if (main.workspace) {
            let workspace = Blockly.mainWorkspace;
            return Blockly.Python.workspaceToCode(workspace);
        }
        else {
            return main.code;
        }
    }
}
