const {modifyNodes} = require('reshape-plugin-util')
const stripIndent = require('strip-indent')
const convertToSpaces = require('convert-to-spaces')

function isDefinition(node) {
	return node.type === 'tag' && node.name === 'define-locals'
}

function scopeEval(fnString, locals = null) {
	// eslint-disable-next-line no-eval
	return eval(fnString)(locals)
}

const emptyNode = {type: 'text', content: ''}

module.exports = function reshapeDefineLocals(options) {
	return function defineLocalsPlugin(tree, ctx) {
		return modifyNodes(tree, node => isDefinition(node), node => {
			let mode = 'object'

			// normalize content and convert to spaces (for yaml)
			const content = convertToSpaces(stripIndent(node.location.innerHTML), 2)

			if ('attrs' in node && 'type' in node.attrs)
				mode = node.attrs.type[0].content

			let definedLocals
			switch (mode) {
				case 'yaml':
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

			options.locals = Object.assign(options.locals, definedLocals)

			return emptyNode
		})
	}
}
