const path = require('path');
const webpack = require('webpack')

module.exports = {
    // a empty placeholder to define custom rules and more
    // (e.g. set loaders for specific file types)
    resolve: {
        fallback: {
            "stream": require.resolve("stream-browserify"),
            "buffer": require.resolve("buffer")
        },
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            // Require .vert and .frag as raw text.
            {
                test: /\.(vert|frag)$/i,
                use: 'raw-loader',
            }
        ],
    },
    optimization: {
        minimize: false
    },
    plugins: [
        // Work around for Buffer is undefined:
        // https://github.com/webpack/changelog-v5/issues/10
        new webpack.ProvidePlugin({
            process: "process/browser",
            Buffer: ["buffer", "Buffer"],
        }),
    ],
    // set the webpack mode
    mode: "development",
    // set the entry point (main file of the web-application)
    entry: './src/index.js',
    // define the name of the bundle file and its location to store it
    output: {
        // name of the bundle file
        filename: 'main.js',
        // location to store it (here: 'working dir'/dist)
        path: path.resolve(__dirname, 'dist'),
        publicPath: path.join('/'),
        clean: true,
    },
    devtool: 'inline-source-map',

    // configure the webserver
    devServer: {
        static: path.join(__dirname, 'dist'),
        host: '0.0.0.0',
        allowedHosts: ['all'],
        compress: true,
        port: 8282,
        open: false,
    },
};