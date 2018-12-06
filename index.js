const {modifyNodes} = require('reshape-plugin-util')
const stripIndent = require('strip-indent')
const convertToSpaces = require('convert-to-spaces')
const mergeWith = require('lodash.mergewith')
const yaml = require('js-yaml')

function isDefinition(node, tag) {
	return node.type === 'tag' && node.name === tag
}

const emptyNode = {type: 'text', content: ''}

const mergeWithCustomizer = (objVal, srcVal) => {
	if (Array.isArray(objVal))
		return objVal.concat(srcVal)
}

module.exports = function reshapeDefineLocals(opts) {
	const options = Object.assign({
		tag: 'define-locals',
		scope: 'file'
	}, opts)

	return function defineLocalsPlugin(tree, ctx) {
		if (options.scope && options.key in ctx.locals)
			delete ctx.locals[options.scope]

		return modifyNodes(tree, node => isDefinition(node, options.tag), node => {
			// if node.location is defined, we will prefer innerHTML (= probably HTML)
			// Otherwise content will be sufficient (probably it's SugarML)
			const contentRaw = 'location' in node ?
				node.location.innerHTML :
				node.content[0].content
			const content = convertToSpaces(stripIndent(contentRaw), 2)
			const definedLocals = yaml.safeLoad(content, 'utf8')

			// deep merge with array concat customization
			if (options.scope)
				mergeWith(ctx.locals, {[options.scope]: definedLocals}, mergeWithCustomizer)
			else
				mergeWith(ctx.locals, definedLocals, mergeWithCustomizer)

			return emptyNode
		})
	}
}
