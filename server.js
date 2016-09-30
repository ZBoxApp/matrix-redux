var webpack = require('webpack');
var webpackServerDev = require('webpack-dev-server');
var config = require('./webpack.config');

var PORT = process.env.PORT || 3000;
console.log(config.output.publicPath);
new webpackServerDev(webpack(config), {
    publicPath: config.output.publicPath,
    hot: true,
    stats: {
        colors: true
    },
    historyApiFallback: true
}).listen(PORT, 'localhost', function(err, result) {
    if (err) {
        return console.log(err);
    }

    console.log(`Listening at http://localhost:${PORT}/`);
});