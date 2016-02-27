var path = require("path");

module.exports = {
    entry: "./app/main",
    resolve: {
        root: [path.resolve(__dirname, "app")],
        extensions: [".ts", ".js"],
    },
    output: {
        path: __dirname,
        filename: "bundle.js",
    },
    module: {
        loaders: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
            }
        ]
    }
};
