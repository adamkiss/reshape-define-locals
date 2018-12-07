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
		scope: 'file',
		locals: {}
	}, opts)

	return function defineLocalsPlugin(tree, ctx) {
		// if we're in spike, we're working with "ctx.locals", otherwise it's "options.locals"
		const targetLocals = ('locals' in ctx) ? ctx.locals : options.locals

		if (options.scope && options.scope in targetLocals)
			delete targetLocals[options.scope]

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
				mergeWith(targetLocals, {[options.scope]: definedLocals}, mergeWithCustomizer)
			else
				mergeWith(targetLocals, definedLocals, mergeWithCustomizer)

			return emptyNode
		})
	}
}
