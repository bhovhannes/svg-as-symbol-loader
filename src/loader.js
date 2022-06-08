const loaderUtils = require('loader-utils')

const { DOMParser, XMLSerializer } = require('xmldom')
const xpath = require('xpath')
const crypto = require('crypto')

module.exports = function (content) {
  this.cacheable && this.cacheable()
  const query = this.getOptions()
  const config = {
    tag: 'symbol'
  }
  let context

  Object.keys(query).forEach(function (attr) {
    config[attr] = query[attr]
  })

  context = config.context
  if (!context && this.options) {
    context = this.options.context
  }
  content = content.toString('utf8')

  const targetDoc = new DOMParser().parseFromString(
    '<' + config.tag + ' xmlns="http://www.w3.org/2000/svg"></' + config.tag + '>',
    'image/svg+xml'
  )
  const targetEl = targetDoc.documentElement

  const svgDoc = new DOMParser().parseFromString(content, 'image/svg+xml')
  const svgEl = svgDoc.documentElement

  // Transfer supported attributes from SVG element to the target element.
  // Attributes provided via loader query string overwrite attributes set to SVG element.
  const attributes = ['viewBox', 'height', 'width', 'preserveAspectRatio']
  attributes.forEach(function (attr) {
    if (query[attr]) {
      targetEl.setAttribute(attr, query[attr])
    } else if (svgEl.hasAttribute(attr)) {
      targetEl.setAttribute(attr, svgEl.getAttribute(attr))
    }
  })

  // Apply additional attributes provided via loader query string
  ;['id', 'class'].forEach(function (param) {
    if (query[param]) {
      const interpolateOptions = {
        content: content,
        regExp: config.regExp
      }
      if (context) {
        interpolateOptions.context = context
      }
      targetEl.setAttribute(
        param,
        loaderUtils.interpolateName(this, query[param], interpolateOptions)
      )
    }
  }, this)

  // Move all child nodes from SVG element to the target element
  let el = svgEl.firstChild
  while (el) {
    targetEl.appendChild(targetDoc.importNode(el, true))
    el = el.nextSibling
  }

  // Append unique prefix to all used 'id' attributes to make them unique in the universe
  const nodesWithId = xpath.select('/*/*[@id]', targetDoc)
  if (nodesWithId.length > 0) {
    // Generate unique prefix
    const hashFn = crypto.createHash('sha1')
    hashFn.update(content)
    const prefix = hashFn.digest('hex')

    // Apply prefix to found nodes
    nodesWithId.forEach(function (nodeWithId) {
      const id = nodeWithId.getAttribute('id'),
        newId = prefix + '-' + id
      nodeWithId.setAttribute('id', newId)

      const attributesUsingId = xpath.select(
        "//attribute::*[contains(., 'url(#" + id + ")')]",
        targetDoc
      )
      attributesUsingId.forEach(function (attributeUsingId) {
        attributeUsingId.value = 'url(#' + newId + ')'
      })
    })
  }

  const markup = new XMLSerializer().serializeToString(targetDoc)
  return 'module.exports = ' + JSON.stringify(markup)
}

module.exports.raw = true
