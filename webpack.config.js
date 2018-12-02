var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var webpack = require('webpack');

var node_modules_path = path.resolve(__dirname, 'node_modules');

module.exports = {
  devtool: '#eval-source-map',
  devServer: {
    // if want to serve other assets rather than bundles
    // contentBase: path.resolve(__dirname, 'build'),
    port: process.env.PORT || 9999,
  },
  entry: {
    didactapp: [
      'webpack-dev-server/client?http://localhost:9999',
      './src/index.js',
    ],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    // publicPath: '/build/',
    filename: '[name].js',
  },

  plugins: [new ExtractTextPlugin('[name].css')],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [node_modules_path],
        use: ['babel-loader'],
      },
      {
        test: /\.(s*)css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                plugins: function() {
                  return [require('autoprefixer')];
                },
              },
            },
          ],
        }),
      },
    ],
  },
};
