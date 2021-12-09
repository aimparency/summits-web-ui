const path = require('path')
const merge = require('webpack-merge').merge
const common = require('./webpack.common.js')

const config = merge(common, {
  mode: 'development', 
  output: {
    path: path.resolve(__dirname, 'dev/'),
  },
  watch: true,
  devtool: 'inline-source-map',
})

console.log(JSON.stringify(config, undefined, "  "))

module.exports = config
