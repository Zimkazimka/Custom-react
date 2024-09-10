const path = require('path');

module.exports = {

  entry: './src/main.ts',

  output: {

    filename: 'bundle.js',

    path: path.resolve(__dirname, 'dist'),

  },

  module: {

    rules: [

      {

        test: /\.tsx?$/,

        use: 'ts-loader',

        exclude: /node_modules/,

      },

    ],

  },

  resolve: {

    extensions: ['.tsx', '.ts', '.js'],

  },

  devtool: 'source-map',

  devServer: {

    static: path.resolve(__dirname, 'dist'),

    compress: true,

    port: 9000,

  },

};
