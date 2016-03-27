var treeData = [
    {
        "name": "object",
        "methods": ["id"],

        "children": [
            {
                "name": "Robot",
                "methods": ["moveForward"],
                "children": [
                    {
                        "name": "MiningRobot",
                        "children": [
                            {
                                "name": "SugoiRobot",
                                "children": [
                                    {
                                        "name": "LearnDarnitLearn",
                                    }
                                ]
                            },
                            {
                                "name": "PolymorphismRobot",
                            }
                        ],
                    }
                ],
            },
            {
                "name": "Gate",
                "methods": ["open"],
                "children": [],
            },
            {
                "name": "Iron",
            },
        ]
    }
];

// ************** Generate the tree diagram	 *****************
var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 960 - margin.right - margin.left,
    height = 500 - margin.top - margin.bottom;

var i = 0;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("body").append("svg")
    .attr("height", "100%")
    .attr("viewBox", "0 0 960 500")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

root = treeData[0];

update(root);

function update(source) {

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 150; });

    // Declare the nodes…
    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter the nodes.
    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
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

    // Declare the links…
    var link = svg.selectAll("path.link")
	.data(links, function(d) { return d.target.id; });

    // Enter the links.
    link.enter().insert("path", "g")
	.attr("class", "link")
	.attr("d", diagonal);
}
