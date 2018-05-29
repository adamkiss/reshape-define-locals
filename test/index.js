const path = require('path')
const {promisify} = require('util')
const {readFile} = require('fs')

const test = require('ava')
const reshape = require('reshape')
const expressions = require('reshape-expressions')
const defineLocals = require('..')

const readFileAsync = promisify(readFile)
const fixtures = path.join(__dirname, 'fixtures')

test('basic', t => {
	return matchExpected(t, 'basic', {locals: {foo: 'bar'}}, false)
})

/* Matchers stolen from reshape/expressions */
async function matchExpected(t, name, config = {}, log = false) {
	const source = await readFileAsync(path.join(fixtures, `${name}.html`), 'utf8')
	const expect = await readFileAsync(path.join(fixtures, `${name}.expected.html`), 'utf8')

	const actual = await reshape({
		plugins: [defineLocals(config), expressions(config)]
	}).process(source)

	if (log) console.log(actual.output.toString(), '\n--------\n', actual.output(config.locals))

	return t.truthy(actual.output(config.locals).trim() === expect.trim())
}
