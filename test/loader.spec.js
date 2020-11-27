const { describe, it, afterEach, expect } = require("@jest/globals");
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const xmldom = require("xmldom");
const xpath = require("xpath");

describe("svg-as-symbol-loader", function () {
  "use strict";

  const outputDir = path.resolve(__dirname, "./output"),
    bundleFileName = "bundle.js",
    getBundleFile = function () {
      return path.join(outputDir, bundleFileName);
    };
  const svgAsSymbolLoader = path.resolve(__dirname, "../");
  const globalConfig = {
    context: path.resolve(__dirname, "../"),
    mode: "development",
    output: {
      path: outputDir,
      filename: bundleFileName,
    },
    module: {
      rules: [
        {
          test: /\.svg/,
          exclude: /node_modules/,
          loader: svgAsSymbolLoader,
          options: {},
        },
      ],
    },
  };

  // Clean generated cache files before each test so that we can call each test with an empty state.
  afterEach(function (done) {
    fs.unlink(getBundleFile(), done);
  });

  it("should wrap SVG contents into symbol tag", function (done) {
    const config = Object.assign({}, globalConfig, {
      entry: "./test/input/icon.js",
    });

    webpack(config, function (err, stats) {
      expect(err).toBe(null);
      fs.readFile(getBundleFile(), function (err, data) {
        expect(err).toBe(null);
        const encoded = eval(data.toString());

        const outputDoc = new xmldom.DOMParser().parseFromString(
          encoded,
          "text/xml"
        );
        const outputEl = outputDoc.documentElement;
        expect(outputEl.tagName).toBe("symbol");

        const rectNodes = xpath.select("//rect", outputDoc);
        expect(rectNodes).toHaveLength(1);

        const circleNodes = xpath.select("//circle", outputDoc);
        expect(circleNodes).toHaveLength(1);

        return done();
      });
    });
  });

  it("should assign id attribute to generated symbol tag if it was provided by query", function (done) {
    const config = Object.assign({}, globalConfig, {
      entry: "./test/input/icon.js",
    });

    config.module.rules[0].options.id = "foo";

    webpack(config, function (err) {
      expect(err).toBe(null);
      fs.readFile(getBundleFile(), function (err, data) {
        expect(err).toBe(null);
        const encoded = eval(data.toString());

        const outputDoc = new xmldom.DOMParser().parseFromString(
          encoded,
          "text/xml"
        );
        const outputEl = outputDoc.documentElement;
        expect(outputEl.getAttribute("id")).toBe("foo");

        return done();
      });
    });
  });

  it("should assign class attribute to generated symbol tag if it was provided by query", function (done) {
    const config = Object.assign({}, globalConfig, {
      entry: "./test/input/icon.js",
    });

    config.module.rules[0].options.class = "foo";

    webpack(config, function (err) {
      expect(err).toBe(null);
      fs.readFile(getBundleFile(), function (err, data) {
        expect(err).toBe(null);
        const encoded = eval(data.toString());

        const outputDoc = new xmldom.DOMParser().parseFromString(
          encoded,
          "text/xml"
        );
        const outputEl = outputDoc.documentElement;
        expect(outputEl.getAttribute("class")).toBe("foo");

        return done();
      });
    });
  });

  it("should use provided attribute instead of one found in SVG file if it is specified in query", function (done) {
    const config = Object.assign({}, globalConfig, {
      entry: "./test/input/icon.js",
    });

    config.module.rules[0].options.height = "400px";

    webpack(config, function (err) {
      expect(err).toBe(null);
      fs.readFile(getBundleFile(), function (err, data) {
        expect(err).toBe(null);
        const encoded = eval(data.toString());

        const outputDoc = new xmldom.DOMParser().parseFromString(
          encoded,
          "text/xml"
        );
        const outputEl = outputDoc.documentElement;
        expect(outputEl.getAttribute("height")).toBe("400px");

        return done();
      });
    });
  });

  it("should use given tag instead of default symbol tag if it was provided by query", function (done) {
    const config = Object.assign({}, globalConfig, {
      entry: "./test/input/icon.js",
    });

    config.module.rules[0].options.tag = "pattern";

    webpack(config, function (err) {
      expect(err).toBe(null);
      fs.readFile(getBundleFile(), function (err, data) {
        expect(err).toBe(null);
        const encoded = eval(data.toString());

        const outputDoc = new xmldom.DOMParser().parseFromString(
          encoded,
          "text/xml"
        );
        const outputEl = outputDoc.documentElement;
        expect(outputEl.tagName).toBe("pattern");

        return done();
      });
    });
  });

  it("should be able to use SVG tag instead of default symbol tag if it was provided by query", function (done) {
    const config = Object.assign({}, globalConfig, {
      entry: "./test/input/icon.js",
    });

    config.module.rules[0].options.tag = "svg";

    webpack(config, function (err) {
      expect(err).toBe(null);
      fs.readFile(getBundleFile(), function (err, data) {
        expect(err).toBe(null);
        const encoded = eval(data.toString());

        const outputDoc = new xmldom.DOMParser().parseFromString(
          encoded,
          "text/xml"
        );
        const outputEl = outputDoc.documentElement;
        expect(outputEl.tagName).toBe("svg");

        return done();
      });
    });
  });

  it("should append random prefix to all ID attributes used", function (done) {
    const config = Object.assign({}, globalConfig, {
      entry: "./test/input/icon.js",
    });

    webpack(config, function (err) {
      expect(err).toBe(null);
      fs.readFile(getBundleFile(), function (err, data) {
        expect(err).toBe(null);
        const encoded = eval(data.toString());

        const outputDoc = new xmldom.DOMParser().parseFromString(
          encoded,
          "text/xml"
        );

        const linearGradient = xpath.select("//linearGradient", outputDoc);
        expect(linearGradient).toHaveLength(1);
        const prefixedId = linearGradient[0].getAttribute("id");

        const path = xpath.select("//path", outputDoc);
        expect(path).toHaveLength(1);
        expect(path[0].getAttribute("fill")).toBe("url(#" + prefixedId + ")");

        return done();
      });
    });
  });

  it("should interpolate ID and class values", function (done) {
    const config = Object.assign({}, globalConfig, {
      entry: "./test/input/icon.js",
    });

    config.module.rules[0].options.class = "[name].[ext]";
    config.module.rules[0].options.id = "[name]";

    webpack(config, function (err) {
      expect(err).toBe(null);
      fs.readFile(getBundleFile(), function (err, data) {
        expect(err).toBe(null);
        const encoded = eval(data.toString());

        const outputDoc = new xmldom.DOMParser().parseFromString(
          encoded,
          "text/xml"
        );
        const outputEl = outputDoc.documentElement;
        expect(outputEl.getAttribute("class")).toBe("icon.svg");
        expect(outputEl.getAttribute("id")).toBe("icon");

        return done();
      });
    });
  });
});
