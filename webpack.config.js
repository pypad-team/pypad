const path = require('path');
const webpack = require('webpack');

const config = function(env) {
    return {
        mode: env.production? 'production' : 'development',
        devtool: "inline-source-map",
        entry: './client/ts/index.ts',
        output: {
            path: path.resolve(__dirname, 'build/client/js/'),
            filename: 'bundle.js',
        },
        module: {
            rules: [
                {
                    enforce: 'pre',
                    test: /\.ts?$/,
                    use: [
                        'eslint-loader',
                    ],
                    exclude: /node_modules/,
                },
                {
                    test: /\.ts?$/,
                    use: [
                        'ts-loader',
                    ],
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: [
                '.js',
                '.ts',
                '.tsx',
            ]
        },
    }
}

module.exports = config;
