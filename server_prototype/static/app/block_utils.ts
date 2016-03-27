/**
 * Determine the class of a variable or method block.
 */
export function getClass(block: any): string {
    if (block["type"] === "variables_get") {
        return block.data;
    }
    // TODO: should check if method, else if object, else use output connection
    else if (block["type"] === "math_number") {
        return "number";
    }
    else if (block["type"].slice(0, 6) === "method") {
        return block.getClassName();
    }
    return null;
}

interface TypeError {
    message: string,
}

/**
 * Check the type of the object and method in a tell block.
 */
export function typecheckTell(block: any): TypeError {
    // TODO: accept an interpreter object and use that to typecheck,
    // or, accept a class hierarchy
    if (block["type"] === "tell") {
        let object = block.childObject();
        let method = block.childMethod();
        if (object && method) {
            var childClass = getClass(object);
            var methodClass = getClass(method);
            if (childClass !== methodClass) {
                return {
                    message: `Class/method mismatch: ${childClass} vs ${methodClass}!`,
                };
            }
        }
    }

    return null;
}
