var path = require("path");

module.exports = {
    entry: "./app/main.js",
    resolve: {
        root: [path.resolve(__dirname, "app")],
    },
    output: {
        path: __dirname,
        filename: "bundle.js",
    },
};
