# svg-as-symbol-loader
[![NPM version][npm-version-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-url] [![Dependencies][deps-image]][deps-url] [![Dev. Dependencies][dev-deps-image]][dev-deps-url] [![MIT License][license-image]][license-url] [![Build Status][travis-image]][travis-url]

A webpack loader which wraps content of root element of source SVG file inside [`<symbol>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol) element and returns resulting markup.

## What loader does

It takes contents of root element in source SVG markup (usually, root element will be [`<svg>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/svg)), wraps it into [`<symbol>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol) tag and returns resulting markup.  
 It is possible to use another tag instead of [`<symbol>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol) using [`tag`](#tag) loader parameter.  
 Attributes applied to root element in source SVG file will be preserved and applied to target [`<symbol>`](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol) tag.  
 If source SVG image contains elements with `id` attribute set, loader will append unique prefix to all `id`s in order to make them unique in the universe.


## Why do I need this?

There may be different usage scenarios for different people. One of them is described below.

Usually [`data:URI`](https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs) scheme is used to embed icons in SVG file. That results in SVG file containing urls with `data:URI` scheme.  
Although support for such url scheme is pretty good, some SVG parsers do not understand such urls. For example, Apache Batik fails to rasterize SVG markup including urls with `data:URI` to PDF.  
If embedded icon is SVG itself, it can be included by copy/pasting its markup into target SVG file.
 In order to point to inserted element, it should have an `id` attribute assigned, which can be assigned using [`id`](#id) loader parameter.

## Supported parameters

The loader supports the following parameters:

#### `tag`
Defaults to `symbol`. Is used as the name of root tag in generated SVG markup.

#### `id`
If given, will be applied to the root tag (`symbol` by default, see description for [`tag`](#tag) option) in generated SVG markup.

#### `class`
If given, will be applied to the root tag in generated SVG markup.

#### `viewBox`
If given, overwrites value of `viewBox` attribute applied to the `svg` tag in source SVG file.

#### `height`
If given, overwrites value of `height` attribute applied to the `svg` tag in source SVG file.

#### `width`
If given, overwrites value of `width` attribute applied to the `svg` tag in source SVG file.

#### `preserveAspectRatio`
If given, overwrites value of `preserveAspectRatio` attribute applied to the `svg` tag in source SVG file.


Parameters can be passed both in a url or from webpack config file. See [Using loaders](http://webpack.github.io/docs/using-loaders.html) section in webpack documentation for more details.

The `id` and `class` parameters allow naming templates based on filename interpolation. See [`loader-utils#interpolatename`](https://github.com/webpack/loader-utils#interpolatename) for full usage details.

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

## License

MIT (http://www.opensource.org/licenses/mit-license.php)

[deps-image]: https://img.shields.io/david/bhovhannes/svg-as-symbol-loader.svg
[deps-url]: https://david-dm.org/bhovhannes/svg-as-symbol-loader

[dev-deps-image]: https://img.shields.io/david/dev/bhovhannes/svg-as-symbol-loader.svg
[dev-deps-url]: https://david-dm.org/bhovhannes/svg-as-symbol-loader#info=devDependencies

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE

[npm-url]: https://www.npmjs.org/package/svg-as-symbol-loader
[npm-version-image]: https://img.shields.io/npm/v/svg-as-symbol-loader.svg?style=flat
[npm-downloads-image]: https://img.shields.io/npm/dm/svg-as-symbol-loader.svg?style=flat

[travis-url]: https://travis-ci.org/bhovhannes/svg-as-symbol-loader
[travis-image]: https://img.shields.io/travis/bhovhannes/svg-as-symbol-loader.svg?style=flat
