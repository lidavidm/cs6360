interface HierarchyController extends _mithril.MithrilController {
    tree: d3.layout.Tree<ObjectHierarchy>,
    diagonal: d3.svg.Diagonal<d3.layout.tree.Link<d3.layout.tree.Node>, d3.layout.tree.Node>,
    svg: d3.Selection<any>,
}

export interface ObjectHierarchy extends d3.layout.tree.Node {
    name: string,
    children?: ObjectHierarchy[],
    methods?: string[],

    x?: number,
    y?: number,
    depth?: number,
    id?: number,
}

export const Component: _mithril.MithrilComponent<HierarchyController> = <any> {
    controller: function(): HierarchyController {
        return {
            tree: null,
            diagonal: null,
            svg: null,
        };
    },

    view: function(controller: HierarchyController, args: {
        hierarchy: ObjectHierarchy,
    }): _mithril.MithrilVirtualElement<HierarchyController> {
        function update() {
            let i = 0;
            // Compute tree layout
            let nodes = controller.tree.nodes(args.hierarchy).reverse();
            let links = controller.tree.links(nodes);

            // Set the distance between the nodes
            nodes.forEach(function(d) { d.y = d.depth * 150; });

            // Declare and create the nodes
            let node = controller.svg.selectAll("g.node")
                .data<ObjectHierarchy>(nodes, function(d) { return d.id || (d.id = ++i); });
            var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) {
                    // Flip x and y to get a horizontal tree
                    return "translate(" + d.y + "," + d.x + ")"; });
            nodeEnter.append("circle")
                .attr("r", 10)
                .style("stroke", "#000");
            nodeEnter.append("text")
                .attr("dy", function(d) { return d.children ? "-10px" : ".35em"; })
                .attr("dx", function(d) { return d.children ? "-10px" : ".75em"; })
                .attr("text-anchor", function(d) {
                    return d.children? "end" : "start"; })
                .text(function(d) { return d.name; })
                .style("fill-opacity", 1);

            // Declare and create the links between nodes
            var link = controller.svg.selectAll("path.link")
                .data(links, function(d) { return d.target.id; });
            link.enter().insert("path", "g")
                .attr("class", "link")
                .attr("d", controller.diagonal);
        }

        return m("div", {
            config: function(element: HTMLElement, isInitialized: boolean) {
                if (!isInitialized) {
                    let margin = {top: 20, right: 120, bottom: 20, left: 120},
                    width = 960 - margin.right - margin.left,
                    height = 500 - margin.top - margin.bottom;

                    controller.tree = d3.layout.tree<ObjectHierarchy>()
                        .size([height, width]);

                    controller.diagonal = d3.svg.diagonal()
                        .projection(function(d) { return [d.y, d.x]; });

                    controller.svg = d3.select(element).append("svg")
                        .attr("height", "100%")
                        .attr("viewBox", "0 0 960 500")
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


                }
                update();
            }
        });
    }
}
