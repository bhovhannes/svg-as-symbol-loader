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
});
