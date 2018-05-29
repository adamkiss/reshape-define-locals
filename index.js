const {modifyNodes} = require('reshape-plugin-util')
const stripIndent = require('strip-indent')
const convertToSpaces = require('convert-to-spaces')
const mergeWith = require('lodash.mergewith')
const yaml = require('js-yaml')

function isDefinition(node) {
	return node.type === 'tag' && node.name === 'define-locals'
}

function scopeEval(fnString, locals = null) {
	// eslint-disable-next-line no-eval
	return eval(fnString)(locals)
}

const emptyNode = {type: 'text', content: ''}

const mergeWithCustomizer = (objVal, srcVal) => {
	if (Array.isArray(objVal))
		return objVal.concat(srcVal)
}

module.exports = function reshapeDefineLocals(options) {
	return function defineLocalsPlugin(tree, ctx) {
		return modifyNodes(tree, node => isDefinition(node), node => {
			let mode = 'object'

			// if node.location is defined, we will prefer innerHTML (= probably HTML)
			// Otherwise content will be sufficient (probably it's SugarML)
			const contentRaw = 'location' in node ?
				node.location.innerHTML :
				node.content[0].content

			// normalize content and convert to spaces (for yaml)
			const content = convertToSpaces(stripIndent(contentRaw), 2)

			if ('attrs' in node && 'type' in node.attrs)
				mode = node.attrs.type[0].content

			let definedLocals
			switch (mode) {
				case 'yaml':
					definedLocals = yaml.safeLoad(content, 'utf8')
					break
				case 'function':
					definedLocals = scopeEval(`locals => {${content}}`, options.locals)
					break
				case 'object':
					// eslint-disable-next-line no-eval
					definedLocals = scopeEval(`_ => { return {${content}}}`)
					break
				default:
					throw new ctx.PluginError({
						message: `"${mode}" isn't a valid type of "define-locals" block`,
						plugin: 'reshape-define-locals',
						location: node.location
					})
			}

			// deep merge with array concat customization
			mergeWith(options.locals, definedLocals, mergeWithCustomizer)

			return emptyNode
		})
	}
}
