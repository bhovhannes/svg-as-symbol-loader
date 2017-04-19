var fs = require('fs');
var path = require('path');
var assign = require('object-assign');
var expect = require('expect.js');
var webpack = require('webpack');
var xmldom = require('xmldom');
var xpath = require('xpath');

describe('svg-as-symbol-loader', function() {
    'use strict';

    var outputDir = path.resolve(__dirname, './output'),
        bundleFileName = 'bundle.js',
        getBundleFile = function() {
            return path.join(outputDir, bundleFileName);
        };
    var svgAsSymbolLoader = path.resolve(__dirname, '../');
    var globalConfig = {
        context: path.resolve(__dirname, '../'),
        output: {
            path: outputDir,
            filename: bundleFileName
        },
        module: {
            loaders: [
                {
                    test: /\.svg/,
                    loader: svgAsSymbolLoader,
                    query: {},
                    exclude: /node_modules/
                }
            ]
        }
    };

    // Clean generated cache files before each test so that we can call each test with an empty state.
    afterEach(function(done) {
        fs.unlink(getBundleFile(), done);
    });


    it('should wrap SVG contents into symbol tag', function(done) {
        var config = assign({}, globalConfig, {
            entry: './test/input/icon.js'
        });

        webpack(config, function(err, stats) {
            expect(err).to.be(null);
            fs.readFile(getBundleFile(), function(err, data) {
                expect(err).to.be(null);
                var encoded = (0,eval)(data.toString());

				var outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'text/xml');
				var outputEl = outputDoc.documentElement;
                expect(outputEl.tagName).to.be('symbol');

				var rectNodes = xpath.select("//rect", outputDoc);
				expect(rectNodes.length).to.be(1);

				var circleNodes = xpath.select("//circle", outputDoc);
				expect(circleNodes.length).to.be(1);

                return done();
            });
        });
    });

	it('should assign id attribute to generated symbol tag if it was provided by query', function(done) {
		var config = assign({}, globalConfig, {
			entry: './test/input/icon.js'
		});

		config.module.loaders[0].query.id = 'foo';

		webpack(config, function(err) {
			expect(err).to.be(null);
			fs.readFile(getBundleFile(), function(err, data) {
				expect(err).to.be(null);
				var encoded = (0,eval)(data.toString());

				var outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'text/xml');
				var outputEl = outputDoc.documentElement;
				expect(outputEl.getAttribute('id')).to.be('foo');

				return done();
			});
		});
	});

    it('should assign class attribute to generated symbol tag if it was provided by query', function(done) {
		var config = assign({}, globalConfig, {
			entry: './test/input/icon.js'
		});

		config.module.loaders[0].query.class = 'foo';

		webpack(config, function(err) {
			expect(err).to.be(null);
			fs.readFile(getBundleFile(), function(err, data) {
				expect(err).to.be(null);
				var encoded = (0,eval)(data.toString());

				var outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'text/xml');
				var outputEl = outputDoc.documentElement;
				expect(outputEl.getAttribute('class')).to.be('foo');

				return done();
			});
		});
	});

	it('should use provided attribute instead of one found in SVG file if it is specified in query', function(done) {
		var config = assign({}, globalConfig, {
			entry: './test/input/icon.js'
		});

		config.module.loaders[0].query.height = '400px';

		webpack(config, function(err) {
			expect(err).to.be(null);
			fs.readFile(getBundleFile(), function(err, data) {
				expect(err).to.be(null);
				var encoded = (0,eval)(data.toString());

				var outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'text/xml');
				var outputEl = outputDoc.documentElement;
				expect(outputEl.getAttribute('height')).to.be('400px');

				return done();
			});
		});
	});

	it('should use given tag instead of default symbol tag if it was provided by query', function(done) {
		var config = assign({}, globalConfig, {
			entry: './test/input/icon.js'
		});

		config.module.loaders[0].query.tag = 'pattern';

		webpack(config, function(err) {
			expect(err).to.be(null);
			fs.readFile(getBundleFile(), function(err, data) {
				expect(err).to.be(null);
				var encoded = (0,eval)(data.toString());

				var outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'text/xml');
				var outputEl = outputDoc.documentElement;
				expect(outputEl.tagName).to.be('pattern');

				return done();
			});
		});
	});

	it('should be able to use SVG tag instead of default symbol tag if it was provided by query', function(done) {
		var config = assign({}, globalConfig, {
			entry: './test/input/icon.js'
		});

		config.module.loaders[0].query.tag = 'svg';

		webpack(config, function(err) {
			expect(err).to.be(null);
			fs.readFile(getBundleFile(), function(err, data) {
				expect(err).to.be(null);
				var encoded = (0,eval)(data.toString());

				var outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'text/xml');
				var outputEl = outputDoc.documentElement;
				expect(outputEl.tagName).to.be('svg');

				return done();
			});
		});
	});

	it('should append random prefix to all ID attributes used', function(done) {
		var config = assign({}, globalConfig, {
			entry: './test/input/icon.js'
		});

		webpack(config, function(err) {
			expect(err).to.be(null);
			fs.readFile(getBundleFile(), function(err, data) {
				expect(err).to.be(null);
				var encoded = (0,eval)(data.toString());

				var outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'text/xml');

				var linearGradient = xpath.select("//linearGradient", outputDoc);
				expect(linearGradient.length).to.be(1);
				var prefixedId = linearGradient[0].getAttribute('id');

				var path = xpath.select("//path", outputDoc);
				expect(path.length).to.be(1);
				expect(path[0].getAttribute('fill')).to.be('url(#' + prefixedId + ')');

				return done();
			});
		});
	});

    it('should interpolate ID and class values', function(done) {
        var config = assign({}, globalConfig, {
			entry: './test/input/icon.js'
		});

		config.module.loaders[0].query.class = '[name].[ext]';
		config.module.loaders[0].query.id = '[name]';

		webpack(config, function(err) {
			expect(err).to.be(null);
			fs.readFile(getBundleFile(), function(err, data) {
				expect(err).to.be(null);
				var encoded = (0,eval)(data.toString());

				var outputDoc = new xmldom.DOMParser().parseFromString(encoded, 'text/xml');
				var outputEl = outputDoc.documentElement;
				expect(outputEl.getAttribute('class')).to.be('icon.svg');
				expect(outputEl.getAttribute('id')).to.be('icon');

				return done();
			});
		});
	});
});
