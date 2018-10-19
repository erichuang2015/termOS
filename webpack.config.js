const path = require('path');

module.exports = {
    mode: 'production',
    entry: './termos.js',
    output: {
        filename: 'termos.min.js',
        path: path.resolve(__dirname)
    }
};
