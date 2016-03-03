/**
 * Determine the class of a variable or method block.
 */
export function getClass(block: any): string {
    if (block["type"] === "variables_get") {
        return block.inputList[0].fieldRow[0].value_;
    }
    else if (block["type"] === "math_number") {
        return "number";
    }
    else if (block["type"].slice(0, 6) === "method") {
        return block.data;
    }
    return null;
}

/**
 * Given a `tell` block, return the object and method blocks
 * within.
 */
export function destructureTell(tellBlock: any): {
    object: any,
    method: any,
} {
    if (tellBlock.childBlocks_.length === 0) {
        return {
            object: null,
            method: null,
        };
    }
    else if (tellBlock.childBlocks_.length === 1) {
        let child = tellBlock.childBlocks_[0];
        if (child["type"].slice(0, 6) === "method") {
            return {
                object: null,
                method: child,
            };
        }
        else {
            return {
                object: child,
                method: null,
            };
        }
    }
    else {
        let child1 = tellBlock.childBlocks_[0];
        let child2 = tellBlock.childBlocks_[1];

        if (child1["type"].slice(0, 6) === "method") {
            return {
                object: child2,
                method: child1,
            };
        }
        else {
            return {
                object: child1,
                method: child2,
            };
        }
    }
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
        let children = destructureTell(block);
        if (children.object && children.method) {
            var childClass = getClass(children.object);
            var methodClass = getClass(children.method);
            if (childClass !== methodClass) {
                return {
                    message: `Class/method mismatch: ${childClass} vs ${methodClass}!`,
                };
            }
        }
    }

    return null;
}
