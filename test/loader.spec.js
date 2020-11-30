const { describe, it, afterEach, expect } = require("@jest/globals");
const fsPromises = require("fs").promises;
const path = require("path");
const webpack = require("webpack");
const xmldom = require("xmldom");
const xpath = require("xpath");

const outputDir = path.resolve(__dirname, "./output");
const bundleFileName = "bundle.js";
const svgAsSymbolLoader = path.resolve(__dirname, "../");

function getBundleFile() {
  return path.join(outputDir, bundleFileName);
}

function getBaseWebpackConfig() {
  return {
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
}

async function runWebpack(config) {
  return new Promise((resolve, reject) => {
    webpack(config, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

async function evaluateGeneratedBundle() {
  const buffer = await fsPromises.readFile(getBundleFile());
  const content = buffer.toString();
  return eval(content);
}

describe("svg-as-symbol-loader", function () {
  // Clean generated cache files before each test so that we can call each test with an empty state.
  afterEach(() => fsPromises.unlink(getBundleFile()));

  it("should wrap SVG contents into symbol tag", async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: "./test/input/icon.js",
    };

    await runWebpack(config);
    const encoded = await evaluateGeneratedBundle();

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
  });

  it("should assign id attribute to generated symbol tag if it was provided by query", async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: "./test/input/icon.js",
    };

    config.module.rules[0].options.id = "foo";

    await runWebpack(config);
    const encoded = await evaluateGeneratedBundle();

    const outputDoc = new xmldom.DOMParser().parseFromString(
      encoded,
      "text/xml"
    );
    const outputEl = outputDoc.documentElement;
    expect(outputEl.getAttribute("id")).toBe("foo");
  });

  it("should assign class attribute to generated symbol tag if it was provided by query", async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: "./test/input/icon.js",
    };

    config.module.rules[0].options.class = "foo";

    await runWebpack(config);
    const encoded = await evaluateGeneratedBundle();

    const outputDoc = new xmldom.DOMParser().parseFromString(
      encoded,
      "text/xml"
    );
    const outputEl = outputDoc.documentElement;
    expect(outputEl.getAttribute("class")).toBe("foo");
  });

  it("should use provided attribute instead of one found in SVG file if it is specified in query", async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: "./test/input/icon.js",
    };

    config.module.rules[0].options.height = "400px";

    await runWebpack(config);
    const encoded = await evaluateGeneratedBundle();

    const outputDoc = new xmldom.DOMParser().parseFromString(
      encoded,
      "text/xml"
    );
    const outputEl = outputDoc.documentElement;
    expect(outputEl.getAttribute("height")).toBe("400px");
  });

  it("should use given tag instead of default symbol tag if it was provided by query", async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: "./test/input/icon.js",
    };

    config.module.rules[0].options.tag = "pattern";

    await runWebpack(config);
    const encoded = await evaluateGeneratedBundle();

    const outputDoc = new xmldom.DOMParser().parseFromString(
      encoded,
      "text/xml"
    );
    const outputEl = outputDoc.documentElement;
    expect(outputEl.tagName).toBe("pattern");
  });

  it("should be able to use SVG tag instead of default symbol tag if it was provided by query", async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: "./test/input/icon.js",
    };

    config.module.rules[0].options.tag = "svg";

    await runWebpack(config);
    const encoded = await evaluateGeneratedBundle();

    const outputDoc = new xmldom.DOMParser().parseFromString(
      encoded,
      "text/xml"
    );
    const outputEl = outputDoc.documentElement;
    expect(outputEl.tagName).toBe("svg");
  });

  it("should append random prefix to all ID attributes used", async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: "./test/input/icon.js",
    };

    await runWebpack(config);
    const encoded = await evaluateGeneratedBundle();

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
  });

  it("should interpolate ID and class values", async function () {
    const config = {
      ...getBaseWebpackConfig(),
      entry: "./test/input/icon.js",
    };

    config.module.rules[0].options.class = "[name].[ext]";
    config.module.rules[0].options.id = "[name]";

    await runWebpack(config);
    const encoded = await evaluateGeneratedBundle();

    const outputDoc = new xmldom.DOMParser().parseFromString(
      encoded,
      "text/xml"
    );
    const outputEl = outputDoc.documentElement;
    expect(outputEl.getAttribute("class")).toBe("icon.svg");
    expect(outputEl.getAttribute("id")).toBe("icon");
  });
});
