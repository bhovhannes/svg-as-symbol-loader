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

	var symbolDoc = new xmldom.DOMParser().parseFromString('<symbol></symbol>', 'text/xml');
	var symbolEl = symbolDoc.documentElement;

	var svgDoc = new xmldom.DOMParser().parseFromString(content, "text/xml");
	var svgEl = svgDoc.documentElement;
	
	['viewBox', 'height', 'width'].forEach(function(attr) {
		if (svgEl.hasAttribute(attr)) {
			symbolEl.setAttribute(attr, svgEl.getAttribute(attr));
		}
	});
	
	if (query.id) {
		symbolEl.setAttribute('id', query.id);
	}
	
	var el = svgEl.firstChild;
	while(el) {
		symbolEl.appendChild(symbolDoc.importNode(el, true));
		el = el.nextSibling;
	}

	var markup = new xmldom.XMLSerializer().serializeToString(symbolDoc);
	return 'module.exports = ' + JSON.stringify(markup);
};

module.exports.raw = true;
