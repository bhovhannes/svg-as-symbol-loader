/*
 * @license MIT http://www.opensource.org/licenses/mit-license.php
 * @author  Hovhannes Babayan <bhovhannes at gmail dot com>
 */
var loaderUtils = require('loader-utils');

var xmldom = require('xmldom');
var xpath = require('xpath');
var crypto = require('crypto');

module.exports = function(content) {
	this.cacheable && this.cacheable();

	var query = loaderUtils.getOptions(this);
	var config = {
		tag : 'symbol'
	};
	var context;
	var content;

	Object.keys(query).forEach(function (attr) {
	    config[attr] = query[attr];
	});

	context = config.context
	if (!context && this.options) {
		context = this.options.context;
	}
	content = content.toString('utf8');

	var targetDoc = new xmldom.DOMParser().parseFromString('<'+config.tag+'></'+config.tag+'>', 'text/xml');
	var targetEl = targetDoc.documentElement;

	var svgDoc = new xmldom.DOMParser().parseFromString(content, "text/xml");
	var svgEl = svgDoc.documentElement;

	// Transfer supported attributes from SVG element to the target element.
	// Attributes provided via loader query string overwrite attributes set to SVG element.
	var attributes = ['viewBox', 'height', 'width', 'preserveAspectRatio'];
	attributes.forEach(function(attr) {
		if (query[attr]) {
			targetEl.setAttribute(attr, query[attr]);
		}
		else if (svgEl.hasAttribute(attr)) {
			targetEl.setAttribute(attr, svgEl.getAttribute(attr));
		}
	});

	// Apply additional attributes provided via loader query string
	['id', 'class'].forEach(function(param) {
		if (query[param]) {
			var interpolateOptions = {
				content: content,
				regExp: config.regExp
			};
			if (context) {
				interpolateOptions.context = context
			}
		    targetEl.setAttribute(param, loaderUtils.interpolateName(this, query[param], interpolateOptions));
		}
	}, this);

	// Move all child nodes from SVG element to the target element
	var el = svgEl.firstChild;
	while(el) {
		targetEl.appendChild(targetDoc.importNode(el, true));
		el = el.nextSibling;
	}

	// Append unique prefix to all used 'id' attributes to make them unique in the universe
	var nodesWithId = xpath.select('/*/*[@id]', targetDoc);
	if (nodesWithId.length > 0) {
		// Generate unique prefix
		var hashFn = crypto.createHash('sha1');
		hashFn.update(content);
		var prefix = hashFn.digest('hex');

		// Apply prefix to found nodes
		nodesWithId.forEach(function(nodeWithId) {
			var id = nodeWithId.getAttribute('id'),
				newId = prefix + '-' + id;
			nodeWithId.setAttribute('id', newId);

			var attributesUsingId = xpath.select("//attribute::*[contains(., 'url(#" + id + ")')]", targetDoc);
			attributesUsingId.forEach(function(attributeUsingId) {
				attributeUsingId.value = "url(#" + newId + ")";
			});
		});
	}

	var markup = new xmldom.XMLSerializer().serializeToString(targetDoc);
	return 'module.exports = ' + JSON.stringify(markup);
};

module.exports.raw = true;
