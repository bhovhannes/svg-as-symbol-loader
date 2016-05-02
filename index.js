/*
 * @license MIT http://www.opensource.org/licenses/mit-license.php
 * @author  Hovhannes Babayan <bhovhannes at gmail dot com>
 */
var loaderUtils = require('loader-utils');

var xmldom = require('xmldom');

module.exports = function(content) {
	this.cacheable && this.cacheable();

	var query = loaderUtils.parseQuery(this.query);

	content = content.toString('utf8');
	
	var tagName = 'symbol';
	if (query.tag) {
		tagName = query.tag;
	}

	var targetDoc = new xmldom.DOMParser().parseFromString('<'+tagName+'></'+tagName+'>', 'text/xml');
	var targetEl = targetDoc.documentElement;

	var svgDoc = new xmldom.DOMParser().parseFromString(content, "text/xml");
	var svgEl = svgDoc.documentElement;
	
	var attributes = ['viewBox', 'height', 'width', 'preserveAspectRatio'];
	attributes.forEach(function(attr) {
		if (query[attr]) {
			targetEl.setAttribute(attr, query[attr]);
		}
		else if (svgEl.hasAttribute(attr)) {
			targetEl.setAttribute(attr, svgEl.getAttribute(attr));
		}
	});

	['id'].forEach(function(param) {
		if (query[param]) {
			targetEl.setAttribute(param, query[param]);
		}
	});
	
	var el = svgEl.firstChild;
	while(el) {
		targetEl.appendChild(targetDoc.importNode(el, true));
		el = el.nextSibling;
	}

	var markup = new xmldom.XMLSerializer().serializeToString(targetDoc);
	return 'module.exports = ' + JSON.stringify(markup);
};

module.exports.raw = true;
