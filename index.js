const {modifyNodes} = require('reshape-plugin-util')
const stripIndent = require('strip-indent')
const convertToSpaces = require('convert-to-spaces')
const mergeWith = require('lodash.mergewith')
const yaml = require('js-yaml')

function isDefinition(node, tag) {
	return node.type === 'tag' && node.name === tag
}

function scopeEval(node, PluginError, fnString, locals = null) {
	try {
		// eslint-disable-next-line no-eval
		return eval(fnString)(locals)
	} catch (err) {
		const location = ('location' in node) ? node.location : node.content[0].location

		if (err.name === 'SyntaxError')
			throw new PluginError({
				message: `There was a SyntaxError in your Define Locals block of type='${locals ? 'function' : 'object'}'. Did you mean to use YAML type (default)?`,
				plugin: 'reshape-define-locals', location
			})
		else
			throw new PluginError({
				message: err.toString(), plugin: 'reshape-define-locals', location
			})
	}
}

const emptyNode = {type: 'text', content: ''}

const mergeWithCustomizer = (objVal, srcVal) => {
	if (Array.isArray(objVal))
		return objVal.concat(srcVal)
}

module.exports = function reshapeDefineLocals(opts) {
	const options = Object.assign({
		mode: 'yaml',
		tag: 'define-locals',
		key: 'locals',
		delete: false
	}, opts)

	return function defineLocalsPlugin(tree, ctx) {
		if (options.delete && options.key in ctx.locals)
			delete ctx.locals[options.key]

		return modifyNodes(tree, node => isDefinition(node, options.tag), node => {
			let {mode} = options

			// if node.location is defined, we will prefer innerHTML (= probably HTML)
			// Otherwise content will be sufficient (probably it's SugarML)
			const contentRaw = 'location' in node ?
				node.location.innerHTML :
				node.content[0].content

			// normalize content and convert to spaces (for yaml)
			const content = convertToSpaces(stripIndent(contentRaw), 2)

			if ('attrs' in node && 'type' in node.attrs)
				mode = node.attrs.type[0].content

			let definedLocals = {}
			switch (mode) {
				case 'yaml':
					definedLocals = yaml.safeLoad(content, 'utf8')
					break
				case 'function':
					definedLocals = scopeEval(
						node, ctx.PluginError,
						`locals => {${content}}`, options.locals
					)
					break
				case 'object':
					// eslint-disable-next-line no-eval
					definedLocals = scopeEval(
						node, ctx.PluginError,
						`_ => { return {${content}}}`
					)
					break
				default:
					throw new ctx.PluginError({
						message: `"${mode}" isn't a valid type of "define-locals" block`,
						plugin: 'reshape-define-locals',
						location: node.location
					})
			}

			// deep merge with array concat customization
			mergeWith(ctx.locals, {[options.key]: definedLocals}, mergeWithCustomizer)

			return emptyNode
		})
	}
}
