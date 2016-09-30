const configCommon = require('./webpack.commons');
const merge = require('webpack-merge');
const path = require('./path');
const webpack = require('webpack');

const PORT = process.env.PORT || 3000;

const configDev = {
    entry: [
        path.join(__dirname, '../src/index.js')
    ],
    output: {
        publicPath: path.root
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
};

const config = merge(configCommon, configDev);

module.exports = config;