"use strict";

const webpack = require('webpack');
const path = require('./path');
const autoprefixer = require('autoprefixer');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const commons = {
    devtool: 'eval',
    output: {
        path: path.dist,
        filename: 'bundle-[hash].js'
    },
    node: {
        fs: "empty"
    },
    resolve: {
        extensions: ['', '.jsx', '.scss', '.js', '.json']
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract('style', 'css?sourceMap&modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!resolve-url!sass?sourceMap')
            },
            {
                test: /\.yaml$/,
                loader: 'yaml',
                include: path.resolve(path.src, 'translations')
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Riot Zbox Chat',
            template: path.join(__dirname, '../src/template/index.tpl.html'),
            inject: 'body'
        }),
        new ExtractTextPlugin('asset/css/[name].css')
    ]
};

module.exports = commons;