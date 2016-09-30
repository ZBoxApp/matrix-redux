const webpackDev = require('./webpack/webpack.dev');
const webpackProd = require('./webpack/webpack.prod');

var config = null;

if (process.env.NODE_ENV === 'development') {
    config = webpackDev;
} else {
    config = webpackProd;
}

module.exports = config;