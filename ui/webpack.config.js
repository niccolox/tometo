const webpack = require('webpack')
const envalid = require('envalid')
const path = require('path')
const CssExtractPlugin = require('mini-css-extract-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const { version } = require('../package.json')

const env = envalid.cleanEnv(process.env, {
  T_HOSTNAME: envalid.url({ default: 'http://localhost:4001' }),
  T_ENV: envalid.str({ devDefault: 'development' }),
  T_REQUIRE_INVITATIONS: envalid.bool({ default: false }),
  T_GENERATE_BUNDLE_VISUALIZATION: envalid.bool({ default: false })
}, { strict: true })

const replacedStrings = {
  'process.browser': true,
  'process.version': JSON.stringify(version)
}

for (const name in env) {
  replacedStrings[`process.env.${name}`] = JSON.stringify(env[name])
}

const prod = env.T_ENV !== 'development'

const commonOptions = {
  mode: env.T_ENV,
  devtool: !prod && 'source-map',
  optimization: prod ? {
    minimizer: [new TerserWebpackPlugin({}), new OptimizeCSSAssetsPlugin({})]
  } : {},
  resolve: {
    alias: {
      svelte: path.resolve('node_modules', 'svelte'),
      spectre: path.resolve('node_modules', 'spectre.css')
    },
    extensions: ['.mjs', '.js', '.svelte'],
    mainFields: ['svelte', 'browser', 'module', 'main']
  },
  module: {
    rules: [
      {
        test: /\.(html|svelte)$/,
        exclude: /node_modules/,
        use: 'svelte-loader'
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          { loader: CssExtractPlugin.loader },
          { loader: 'css-loader', options: { url: false, importLoaders: 1 } },
          { loader: 'postcss-loader' }
        ]
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          { loader: CssExtractPlugin.loader },
          { loader: 'css-loader', options: { importLoaders: 1 } },
          { loader: 'sass-loader' }
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin(replacedStrings),
    new CssExtractPlugin()
  ]
}

module.exports = {
  name: 'bundle',
  entry: {
    main: {
      import: './ui/src/main.build.js',
      dependOn: 'shared'
    },
    admin: {
      import: './ui/src/admin.build.js'
    },
    shared: ['three']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(process.cwd(), 'priv/static/js')
  },
  ...commonOptions
}
