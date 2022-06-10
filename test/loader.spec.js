const { describe, it, afterEach, expect, afterAll } = require('@jest/globals')
const { rejects } = require('assert')
const path = require('path')
const webpack = require('webpack')
const xmldom = require('xmldom')

const outputDir = path.resolve(__dirname, './output')

const svgAsSymbolLoader = path.resolve(__dirname, '../')

function getBaseWebpackConfig() {
  return {
    context: path.resolve(__dirname, '../'),
    mode: 'development',
    devtool: false,
    cache: false,
    output: {
      path: outputDir,
      clean: true,
      filename: 'bundle.[fullhash].js',
      publicPath: '',
      libraryTarget: 'commonjs2'
    },
    module: {
      rules: [
        {
          test: /\.svg/,
          exclude: /node_modules/,
          loader: svgAsSymbolLoader,
          options: {}
        }
      ]
    }
  }
}

async function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, function (err, stats) {
      if (err) {
        reject(err)
      } else {
        resolve(stats.toJson('minimal').assetsByChunkName.main[0])
      }
    })
  })
}

function evaluateGeneratedBundle(assetName) {
  function getBundleFile(assetName) {
    return path.join(outputDir, assetName)
  }
  // require is now mandatory with webpack >5.22.0
  return eval(`require("${getBundleFile(assetName)}")`)
}

describe('svg-as-symbol-loader', function () {
  it('should wrap SVG contents into symbol tag', async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: './test/input/icon.js'
    }

    const assetName = await runWebpack(config)
    const encoded = evaluateGeneratedBundle(assetName)

    const outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'image/svg+xml')
    const outputEl = outputDoc.documentElement
    expect(outputEl.tagName).toBe('symbol')
    expect(outputEl.getElementsByTagName('rect')).toHaveLength(1)
    expect(outputEl.getElementsByTagName('circle')).toHaveLength(1)
  })

  it('should assign id attribute to generated symbol tag if it was provided by query', async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: './test/input/icon.js'
    }

    config.module.rules[0].options.id = 'foo'

    const assetName = await runWebpack(config)
    const encoded = evaluateGeneratedBundle(assetName)

    const outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'image/svg+xml')
    const outputEl = outputDoc.documentElement
    expect(outputEl.getAttribute('id')).toBe('foo')
  })

  it('should assign class attribute to generated symbol tag if it was provided by query', async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: './test/input/icon.js'
    }

    config.module.rules[0].options.class = 'foo'

    const assetName = await runWebpack(config)
    const encoded = evaluateGeneratedBundle(assetName)

    const outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'image/svg+xml')
    const outputEl = outputDoc.documentElement
    expect(outputEl.getAttribute('class')).toBe('foo')
  })

  it('should use provided attribute instead of one found in SVG file if it is specified in query', async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: './test/input/icon.js'
    }

    config.module.rules[0].options.height = '400px'

    const assetName = await runWebpack(config)
    const encoded = evaluateGeneratedBundle(assetName)

    const outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'image/svg+xml')
    const outputEl = outputDoc.documentElement
    expect(outputEl.getAttribute('height')).toBe('400px')
  })

  it('should use given tag instead of default symbol tag if it was provided by query', async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: './test/input/icon.js'
    }

    config.module.rules[0].options.tag = 'pattern'

    const assetName = await runWebpack(config)
    const encoded = evaluateGeneratedBundle(assetName)

    const outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'image/svg+xml')
    const outputEl = outputDoc.documentElement
    expect(outputEl.tagName).toBe('pattern')
  })

  it('should be able to use SVG tag instead of default symbol tag if it was provided by query', async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: './test/input/icon.js'
    }

    config.module.rules[0].options.tag = 'svg'

    const assetName = await runWebpack(config)
    const encoded = evaluateGeneratedBundle(assetName)

    const outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'image/svg+xml')
    const outputEl = outputDoc.documentElement
    expect(outputEl.tagName).toBe('svg')
  })

  it('should append random prefix to all ID attributes used', async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: './test/input/icon.js'
    }

    const assetName = await runWebpack(config)
    const encoded = evaluateGeneratedBundle(assetName)

    const outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'image/svg+xml')
    const outputEl = outputDoc.documentElement

    const linearGradient = outputEl.getElementsByTagName('linearGradient')
    expect(linearGradient).toHaveLength(1)
    const prefixedId = linearGradient[0].getAttribute('id')

    const path = outputEl.getElementsByTagName('path')
    expect(path).toHaveLength(1)
    expect(path[0].getAttribute('fill')).toBe('url(#' + prefixedId + ')')
  })

  it('should interpolate ID and class values', async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: './test/input/icon.js'
    }

    config.module.rules[0].options.class = '[name].[ext]'
    config.module.rules[0].options.id = '[name]'

    const assetName = await runWebpack(config)
    const encoded = evaluateGeneratedBundle(assetName)

    const outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'image/svg+xml')
    const outputEl = outputDoc.documentElement
    expect(outputEl.getAttribute('class')).toBe('icon.svg')
    expect(outputEl.getAttribute('id')).toBe('icon')
  })
})
