const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const SOURCE_PATH = path.join(__dirname, './src');
const CHYF_PATH = path.join(SOURCE_PATH, './chyf');
const GEOCONNEX_PATH = path.join(SOURCE_PATH, './geoconnex');

module.exports = {
  entry: {
      chyf: path.join(CHYF_PATH, "./index.ts"),
      geoconnex: path.join(GEOCONNEX_PATH, "./index.ts")
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })]
  },
  output: {
    filename: '[name]/[name].js',
    path: path.resolve(__dirname, 'dist')
  }
};

