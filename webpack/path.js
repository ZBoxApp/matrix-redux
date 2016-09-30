const path = require('path');

const join = path.join;
const resolve = path.resolve;
const root = resolve(__dirname, '..');
const dist = join(root, 'dist');
const src = join(root, 'src');

module.exports = {
    join,
    resolve,
    root,
    dist,
    src
};