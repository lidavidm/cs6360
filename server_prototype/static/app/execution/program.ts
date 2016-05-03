declare var Sk: any;

import {PubSub} from "pubsub";
import {Savegame} from "savegame";
import {Toolbox} from "level";
import {MAIN} from "model/editorcontext";
import {World} from "model/model";
import {ObjectHierarchy} from "views/hierarchy";
import {EditorContext} from "model/editorcontext";

const PROXY_CLASS = `
class JSProxyClass:
    def __init__(self, jsid):
        self.jsid = jsid

    def __getattr__(self, attribute):
        return self._proxy(attribute)

    def _proxy(self, attribute):
        jsid = self.jsid
        def _proxy(*args):
            return methodCall(jsid, attribute, args)
        return _proxy
class BlocklyError(Exception):
    """
    An exception indicating the user did something wrong in Blockly.
    """
    def __init__(self, blockID, message):
        self.blockID = blockID
        self.message = message

class HelpError(Exception):
    def __init__(self, message):
        self.message = message

    def __repr__(self):
        return self.message

    def __str__(self):
        return self.message

counter = 0
MAX_NUM_EXECUTED_LINES = 200
def incrementCounter():
    global counter
    counter = counter + 1
    if counter >= MAX_NUM_EXECUTED_LINES:
        raise HelpError("Too many blocks run! Did you call a function from inside itself?")

def recordDuplicateObject(blockID, name):
    raise HelpError("{} was already instantiated!".format(name))

def recordDuplicateValue(blockID, name):
    raise HelpError("Can't make an object called {}, something already is called {}!".format(name, name))

`;

function indent(code: string, indent: string) {
    return code.split("\n").map(function(line) {
        return indent + line;
    }).join("\n");
}

/**
 * Used to override codegen - for instance, if we need to have a
 * mostly-in-JS method call Python code.
 */
export var OVERRIDES: {
    [className: string]: {
        [methodName: string]: string,
    },
} = {
    "RescueRobot": {
        "rebootTarget": `def rebootTarget(self):
    droneID = super().rebootTarget()
    drone = Drone(droneID)
    try:
        drone.flyHome()
    except NotImplementedError:
        raise HelpError("I called Drone.flyHome, but it's not defined! Check the Class Hierarchy at top.")
`
    }
};

type BlockLimit = (context: EditorContext) => number;

export class Program {
    savegame: Savegame = null;
    classes: string[];
    globals: [string, string, number][];
    invalid: boolean;
    hierarchy: ObjectHierarchy;
    headless: any;
    instantiated: boolean;
    blockLimit: BlockLimit;

    event: PubSub;

    constructor(hierarchy: ObjectHierarchy, blockLimit: BlockLimit) {
        this.globals = [];
        this.classes = [];
        this.invalid = false;
        this.hierarchy = hierarchy;
        this.headless = new Blockly.Workspace();
        this.blockLimit = blockLimit;
        this.event = new PubSub();
        this.instantiated = false;
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

        // XXX this is a hack - when main method can only be edited in
        // code, we need to wait until globals are instantiated in
        // order to generate the code
        this.instantiated = true;
        this.event.broadcast("globals_defined");
    }

    isCodeValid(): boolean {
        if (!this.savegame) return true;
        let [code, offset] = this.getCode(true);

        return !this.invalid && code.indexOf("raise BlocklyError") === -1;
    }

    validateMemoryUsage(): EditorContext {
        if (!this.savegame) return null;

        let validateContext = (context: EditorContext) => {
            let saved = this.savegame.load(context);
            if (saved.workspace) {
                this.headless.clear();
                Blockly.Xml.domToWorkspace(this.headless, saved.workspace);
                let count = this.headless.getAllBlocks().length;
                let limit = this.blockLimit(context);

                if (limit != null && count > limit) {
                    return context;
                }
            }
            return null;
        }

        let temp = validateContext({
            className: MAIN,
            method: "",
        });
        if (temp) {
            return temp;
        }

        let validateClass = function (className: string, classObj: {
            [method: string]: HTMLElement | string;
        }) {
            if (classObj) {
                for (let method of Object.keys(classObj)) {
                    let result = validateContext({
                        className: className,
                        method: method,
                    });

                    if (result) {
                        return result;
                    }
                }
            }
            return null;
        };

        let savedClasses = this.savegame.loadAll();
        if (this.hierarchy) {
            let classQueue: ObjectHierarchy[] = [this.hierarchy];
            while (classQueue.length > 0) {
                let classDesc = classQueue.pop();
                let className = classDesc.name;
                let classObj = savedClasses[className];
                let result = validateClass(className, classObj);
                if (result !== null) {
                    return result;
                }

                if (classDesc.children) {
                    for (let child of classDesc.children) {
                        classQueue.push(child);
                    }
                }
            }
        }
        else {
            for (let className of this.classes) {
                let classObj = savedClasses[className];
                let result = validateClass(className, classObj);
                if (result !== null) {
                    return result;
                }
            }
        }

        return null;
    }

    isCodeParseable(): boolean {
        if (!this.savegame) return true;
        let [code, offset] = this.getCode(true);
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

        return code.indexOf("raise BlocklyError") === -1;
    }

    isCodeFullValid(): boolean {
        // More time-consuming check
        if (!this.savegame) return true;

        return this.isCodeParseable() && !this.invalid;
    }

    /**
     * Flag the program as invalid for some external reason.
     */
    flagInvalid(invalid: boolean) {
        this.invalid = invalid;
    }

    /**
     * Generate the program code. Returns the code, along with the
     * offset of the main method.
     */
    getCode(headless=false): [string, number] {
        Blockly.Python.STATEMENT_PREFIX = "recordBlockBegin(%1)\nincrementCounter()\n"
        Blockly.Python.STATEMENT_POSTFIX = "recordBlockEnd(%1)\n"

        let support = this.getSupportCode();
        let supportLines = (support.match(/\n/g) || []).length + 1;
        let main = this.savegame.load({
            className: MAIN,
            method: null,
        });

        // Avoid duplicating global declarations
        let code = this.getRawCode(headless);
        if (main.workspace) {
            code = this.getMainCode(headless);
        }

        Blockly.Python.STATEMENT_PREFIX = "";
        Blockly.Python.STATEMENT_POSTFIX = "";

        return [[support, code].join("\n"), supportLines];
    }

    getSupportCode(): string {
        if (!this.savegame) return "";
        let code = PROXY_CLASS;
        let classes = this.getClassCode();

        return [code, classes].join("\n");
    }

    getClassCode(): string {
        if (!this.savegame) return "";

        let savedClasses = this.savegame.loadAll();
        let headlessWorkspace = new Blockly.Workspace();
        let classDefns: string[] = [];

        let generateClassCode = (className: string, parent: string, classObj: {
            [method: string]: HTMLElement | string;
        }) => {
            let methods: string[] = [];
            if (classObj) {
                methods = Object.keys(classObj).map((methodName) => {
                    return indent(this.getMethodCode(className, methodName), "    ");
                });
            }
            if (OVERRIDES[className]) {
                let classOverrides = OVERRIDES[className];
                for (let method in classOverrides) {
                    let methodCode = classOverrides[method];
                    methods.push(indent(methodCode, "    "));
                }
            }
            let methodCode = "    pass";
            if (methods.length > 0) {
                methodCode = methods.join("\n");
            }

            return `
class ${className}(${parent}):
    def __init__(self, id=None):
        if id == None:
            id = constructorCall("${className}")
        JSProxyClass.__init__(self, id)

${methodCode}
`;
        };

        if (this.hierarchy) {
            let classQueue: [ObjectHierarchy, string][] = [[this.hierarchy, "JSProxyClass"]];
            while (classQueue.length > 0) {
                let [classDesc, parent] = classQueue.pop();
                let className = classDesc.name;
                let classObj = savedClasses[className];

                classDefns.push(generateClassCode(className, parent, classObj));

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
                classDefns.push(generateClassCode(className, "JSProxyClass", classObj));
            }
        }

        let classes = classDefns.join("\n");

        return classes;
    }

    getMethodCode(className: string, methodName: string, userFacing=false): string {
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
            if (!body) {
                if (userFacing) {
                    body = "# Write your method here\npass";
                }
                else {
                    body = `raise NotImplementedError("${methodName} isn't implemented! Check the Class Hierarchy at top.")`
                }
            }
            let indentedBody = indent(body.trim() || "pass", "    ");
            return `${help}def ${methodName}(self):\n${indentedBody}`
        }
    }

    getMainCode(headless=false): string {
        let globals = this.globals.map(([varName, className, modelID]) => {
            return `\n${varName} = ${className}(${modelID})`
        }).join("\n");

        return `# These are the global variables you have access to.
${globals}

# Beginning of main code
${this.getRawCode(headless)}
`;
    }

    getRawCode(headless=false): string {
        if (!this.savegame) return "";
        // Code generation always has to be done with main workspace showing main
        let main = this.savegame.load({
            className: MAIN,
            method: null,
        });
        if (main.workspace) {
            if (!Blockly.mainWorkspace && !headless) {
                return "";
            }
            let workspace = headless ? this.headless : Blockly.mainWorkspace;
            if (headless) {
                workspace.clear();
                Blockly.Xml.domToWorkspace(workspace, main.workspace);
            }
            return Blockly.Python.workspaceToCode(workspace) || "# No code here, write some!";
        }
        else {
            return main.code || "# No code here, write some!";
        }
    }
}
