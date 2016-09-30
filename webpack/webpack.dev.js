const configCommon = require('./webpack.commons');
const merge = require('webpack-merge');
const path = require('./path');
const webpack = require('webpack');

const PORT = process.env.PORT || 3000;

const configDev = {
    entry: [
        'react-hot-loader/patch',
        `webpack-dev-server/client?http://localhost:${PORT}`,
        'webpack/hot/only-dev-server',
        path.join(path.src, 'index.js')
    ],
    output: {
        publicPath: '/'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify('development')
            }
        })
    ]
};

const config = merge(configCommon, configDev);

module.exports = config;