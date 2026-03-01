const path = require('path');
const webpack = require('webpack');

module.exports = {
    resolve: {
        fallback: {
            "buffer": require.resolve("buffer/")
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
    // Add your existing Webpack configuration below if you have any
};
