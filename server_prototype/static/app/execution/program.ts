import {Savegame} from "savegame";
import {Toolbox} from "level";
import {World} from "model/model";

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

    constructor() {
        this.globals = [];
        this.classes = [];
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
        let savedClasses = this.savegame.loadAll();
        let valid = true;

        outer:
        for (let className of this.classes) {
            let classObj = savedClasses[className];
            for (let methodName in classObj) {
                let methodImpl = this.getMethodCode(className, methodName);
                let lines = methodImpl.split("\n");
                let header = lines.slice(0, 3);
                let body = lines.slice(3);
                for (let line of body) {
                    // Make sure all lines are indented
                    if (line.charAt(0) !== " " && line.trim()) {
                        valid = false;
                        break outer;
                    }
                }
            }
        }
        return valid && this.getCode().indexOf("raise BlocklyError") === -1;
    }

    getCode(): string {
        Blockly.Python.STATEMENT_PREFIX = "recordBlockBegin(%1)\n"
        Blockly.Python.STATEMENT_POSTFIX = "recordBlockEnd(%1)\nincrementCounter()\n"

        let support = this.getSupportCode();
        let code = this.getRawCode();

        Blockly.Python.STATEMENT_PREFIX = "";
        Blockly.Python.STATEMENT_POSTFIX = "";

        return [support, code].join("\n");
    }

    getSupportCode(): string {
        if (!this.savegame) return "";
        let code = PROXY_CLASS;

        let savedClasses = this.savegame.loadAll();
        let headlessWorkspace = new Blockly.Workspace();
        let classes = this.classes.map((className) => {
            let classObj = savedClasses[className];
            let methods = "";
            if (classObj) {
                methods = Object.keys(classObj).map((methodName) => {
                    return indent(this.getMethodCode(className, methodName), "    ");
                }).join("\n");
            }
            return `
class ${className}(JSProxyClass):
${methods}
    pass
`
        }).join("\n");
        let globals = this.globals.map(([varName, className, modelID]) => {
            return `\n${varName} = ${className}(${modelID})`
        }).join("\n");

        return [code, classes, globals].join("\n");
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

    getRawCode(): string {
        if (!this.savegame) return "";
        // Code generation always has to be done with main workspace showing main
        let workspace = Blockly.mainWorkspace;
        return Blockly.Python.workspaceToCode(workspace);
    }
}
