// Copyright 2016 David Li, Michael Mauer, Andy Jiang

// This file is part of Tell Me to Survive.

// Tell Me to Survive is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Tell Me to Survive is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.

// You should have received a copy of the GNU Affero General Public License
// along with Tell Me to Survive.  If not, see <http://www.gnu.org/licenses/>.

import {BaseLevel} from "level";
import {PubSub} from "pubsub";

interface HierarchyController extends _mithril.MithrilController {
    tree: d3.layout.Tree<ObjectHierarchy>,
    diagonal: d3.svg.Diagonal<d3.layout.tree.Link<d3.layout.tree.Node>, d3.layout.tree.Node>,
    svg: d3.Selection<any>,
    currentClass: _mithril.MithrilProperty<ObjectHierarchy>,
    newMethod: _mithril.MithrilProperty<string>,
    element: HTMLElement,
    initialize: () => void,
    update: () => void,
}

export interface ObjectHierarchy extends d3.layout.tree.Node {
    name: string,
    children?: ObjectHierarchy[],
    methods?: string[],
    userMethods?: string[],

    x?: number,
    y?: number,
    depth?: number,
    id?: number,
}

export const Component: _mithril.MithrilComponent<HierarchyController> = <any> {
    controller: function(args: {
        event: PubSub,
    }): HierarchyController {
        let controller: HierarchyController = {
            tree: null,
            diagonal: null,
            svg: null,
            currentClass: <any> m.prop(null),
            newMethod: m.prop(""),
            element: null,
            update: function() {

            },

            initialize: function() {
                let element = controller.element;
                if (!element) return;
                element.innerHTML = "";
                let margin = {top: 20, right: 20, bottom: 20, left: 80},
                width = 500 - margin.right - margin.left,
                height = 500 - margin.top - margin.bottom;

                controller.tree = d3.layout.tree<ObjectHierarchy>()
                    .size([height, width]);

                controller.diagonal = d3.svg.diagonal()
                    .projection(function(d) { return [d.y, d.x]; });

                let svg = d3.select(element).append("svg")
                    .attr("height", "500px")
                    .attr("width", "500px")
                    .attr("viewBox", "0 0 500 500");
                svg.append("defs")
                    .append("pattern")
                    .attr("id", "blueprintGrid")
                    .attr("width", 8)
                    .attr("height", 8)
                    .attr("patternUnits", "userSpaceOnUse")
                    .append("path")
                    .attr("d", "M 8 0 L 0 0 0 8 8 8")
                    .attr("fill", "#007")
                    .attr("stroke", "#FFF")
                    .style("stroke-width", "0.5");

                controller.svg = svg
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            },
        };

        args.event.on(BaseLevel.NEXT_LEVEL_LOADED, () => {
            controller.currentClass(null);
            controller.initialize();
        });

        return controller;
    },

    view: function(controller: HierarchyController, args: {
        showHierarchy: _mithril.MithrilProperty<boolean>,
        hierarchy: ObjectHierarchy,
        changeContext: (className: string, method: string) => void,
        event: PubSub,
        level: BaseLevel,
    }): _mithril.MithrilVirtualElement<HierarchyController> {
        controller.update = function update() {
            let i = 0;
            // Compute tree layout
            let nodes = controller.tree.nodes(args.hierarchy).reverse();
            let links = controller.tree.links(nodes);

            // Set the distance between the nodes
            nodes.forEach(function(d) { d.y = d.depth * 100; });

            // Declare and create the nodes
            let node = controller.svg.selectAll("g.node")
                .data<ObjectHierarchy>(nodes, function(d) { return d.id || (d.id = ++i); });
            var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) {
                    // Flip x and y to get a horizontal tree
                    return "translate(" + d.y + "," + d.x + ")"; })
                .on("click", (d) => {
                    m.startComputation();
                    controller.currentClass(d);
                    m.endComputation();
                });
            nodeEnter.append("text")
                .attr("dy", ".35em")
                .attr("dx", "-10px")
                .attr("text-anchor", "start")
                .text(function(d) { return d.name; })
                .style("fill-opacity", 1);
            nodeEnter.append("rect")
                .attr("fill", "url(#blueprintGrid)")
                .attr("width", function() {
                    var text = this.parentNode.querySelector("text");
                    text.parentElement.insertBefore(this, text);
                    return text.getBBox().width + 10;
                })
                .attr("height", function() {
                    var text = this.parentNode.querySelector("text");
                    return text.getBBox().height + 10;
                })
                .attr("y", function() {
                    var text = this.parentNode.querySelector("text");
                    return text.getBBox().y - 5;
                })
                .attr("x", function() {
                    var text = this.parentNode.querySelector("text");
                    return text.getBBox().x - 5;
                });


            // Declare and create the links between nodes
            var link = controller.svg.selectAll("path.link")
                .data(links, function(d) { return d.target.id; });
            link.enter().insert("path", "g")
                .attr("class", "link")
                .attr("d", controller.diagonal);
        }

        if (args.hierarchy === null) {
            return m(<any> "div#hierarchy", {
                key: "hierarchy",
            });
        }

        let hierarchy = m(<any> "div#hierarchy", {
            style: args.showHierarchy() ? "display: block;" : "display: none",
            key: "hierarchy",
        }, [
            m(".image", {
                config: function(element: HTMLElement, isInitialized: boolean) {
                    controller.element = element;
                    if (!isInitialized) {
                        controller.initialize();
                    }
                    if (args.showHierarchy()) {
                        controller.update();
                    }
                }
            }),
            m("header", [
                "Object Hierarchy",
                m(<any> "button.ui", {
                    onclick: function() {
                        args.showHierarchy(false);
                    },
                }, "Close"),
            ]),
            m(".methods", (function(): any {
                if (!controller.currentClass()) {
                    return [
                        "Select a class on the left to view/add methods."
                    ];
                }
                else {
                    let d = controller.currentClass();
                    if (!d.methods) d.methods = [];
                    return [
                        m("h2", "Methods of class " + d.name),
                        m("ul", d.methods.map(function(method) {
                            return m("li", method);
                        })),
                        m("p", "Your methods:"),
                        m("ul", d.userMethods ? d.userMethods.map(function(method) {
                            return m("li", [
                                method,
                                "—",
                                m(<any> "button.ui", {
                                    onclick: function() {
                                        args.changeContext(controller.currentClass().name, method);
                                        args.showHierarchy(false);
                                    },
                                }, "Edit code"),
                            ]);
                        }) : m("p", "(no methods)")),
                        (function() {
                            if (args.level.allowArbitraryUserMethods) {
                                return [m(<any> "input[type=text]", {
                                    value: controller.newMethod(),
                                    oninput: function(e: any) {
                                        controller.newMethod(e.target.value);
                                    },
                                }), m(<any> "button.ui", {
                                    onclick: function() {
                                        if (!controller.currentClass().userMethods) {
                                            controller.currentClass().userMethods = [];
                                        }
                                        let method = controller.newMethod();
                                        controller.currentClass().userMethods.push(method);
                                        controller.newMethod("");
                                        args.level.toolbox.addUserMethod(controller.currentClass().name, method);
                                        args.event.broadcast(BaseLevel.TOOLBOX_UPDATED);
                                    },
                                }, "Add Method"),];
                            }
                        })(),
                    ]
                }
            })()),
        ]);

        return m(<any> "div#hierarchyContainer", {
            style: args.showHierarchy() ? "display: block;" : "display: none",
            key: "hierarchyContainer",
        }, hierarchy);

    }
}
