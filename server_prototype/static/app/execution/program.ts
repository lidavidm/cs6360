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
`

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

    getCode(): string {
        if (!this.savegame) return "";
        let code = PROXY_CLASS;
        let savedClasses = this.savegame.loadAll();

        let headlessWorkspace = new Blockly.Workspace();
        let classes = this.classes.map((className) => {
            let classObj = savedClasses[className];
            let methods = "";
            if (classObj) {
                methods = Object.keys(classObj).map(function(methodName) {
                    let method = classObj[methodName];
                    headlessWorkspace.clear();
                    Blockly.Xml.domToWorkspace(headlessWorkspace, method);
                    let code: string = Blockly.Python.workspaceToCode(headlessWorkspace);
                    if (!code.trim()) {
                        code = "pass";
                    }
                    let header = `    def ${methodName}(self):\n`;
                    let lines = code.split("\n").map(function(line) {
                        return "        " + line;
                    }).join("\n");
                    return header + lines;
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
        // TODO: code generation always has to be done with main workspace showing main
        let workspace = Blockly.mainWorkspace;
        let main = Blockly.Python.workspaceToCode(workspace);
        return [code, classes, globals, main].join("\n")
    }
}
