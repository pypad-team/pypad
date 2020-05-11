const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const config = function(env) {
    return {
        mode: env.production? 'production' : 'development',
        entry: ['./client/ts/index.ts', './client/css/styles.css'],
        output: {
            path: path.resolve(__dirname, 'build/client/'),
            filename: 'js/bundle.js',
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
                {
                    test: /\.css?$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                    ],
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
        optimization: {
            minimizer: [
                new OptimizeCssAssetsPlugin({
                    cssProcessorPluginOptions: {
                        preset: ['default', { discardComments: { removeAll: true }, }],
                    },
                }),
            ],
        },
        plugins: [
            new UglifyJsPlugin({
                uglifyOptions: {
                    output: {
                        comments: false,
                    },
                },
            }),
            new MiniCssExtractPlugin({
                filename: 'css/styles.css',
            }),
        ],
    }
}

module.exports = config;
