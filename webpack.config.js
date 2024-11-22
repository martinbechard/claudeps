const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === "development";

  return {
    entry: {
      content: "./src/content.ts",
      background: "./src/background.js",
      options: "./src/options.js",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js",
    },
    devtool: isDevelopment ? "inline-source-map" : false, // Enable source maps for development
    mode: isDevelopment ? "development" : "production",
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(
          isDevelopment ? "development" : "production"
        ),
      }),
      new CopyPlugin({
        patterns: [
          { from: "src/manifest.json", to: "manifest.json" },
          { from: "src/styles.css", to: "styles.css" },
          { from: "src/options.html", to: "options.html" },
          { from: "lib/*", to: "./" },
        ],
      }),
    ],
    optimization: {
      minimize: !isDevelopment, // Only minimize in production
    },
  };
};
