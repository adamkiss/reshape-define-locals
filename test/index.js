const path = require('path')
const {promisify} = require('util')
const {readFile} = require('fs')

const test = require('ava')
const reshape = require('reshape')
const sugar = require('sugarml')
const expressions = require('reshape-expressions')
const layouts = require('reshape-layouts')
const include = require('reshape-include')
const defineLocals = require('..')

const readFileAsync = promisify(readFile)
const fixtures = path.join(__dirname, 'fixtures')

test('Basic', async t => {
	const source = await readFileAsync(path.join(fixtures, `basic.html`), 'utf8')
	const expect = await readFileAsync(path.join(fixtures, `basic.expected.html`), 'utf8')

	const config = {locals: {foo: 'bar'}}

	const actual = await reshape({
		plugins: [defineLocals(config), expressions(config)]
	}).process(source)

	logActual(actual, config)

	return t.true(actual.output(config.locals).trim() === expect.trim())
})

test('Layouts and partials', async t => {
	const source = await readFileAsync(path.join(fixtures, `layouts.html`), 'utf8')
	const expect = await readFileAsync(path.join(fixtures, `layouts.expected.html`), 'utf8')

	const config = {
		locals: {
			page: {title: 'This will be overwritten'},
			list: ['original 1', 'original 2'],
			deep: {merge: {object: {key: 'not value'}}}
		}
	}

	const actual = await reshape({plugins: [
		defineLocals(config),
		layouts({encoding: 'utf8', root: fixtures}),
		include({root: fixtures}),
		expressions(config)
	]}).process(source)

	logActual(actual, config)

	return t.true(actual.output(config.locals).trim() === expect.trim())
})

test('Yaml and SugarML', async t => {
	const source = await readFileAsync(path.join(fixtures, `yaml.sgr`), 'utf8')
	const expect = await readFileAsync(path.join(fixtures, `yaml.expected.html`), 'utf8')

	const config = {
		locals: {
			page: {title: 'This will be overwritten'},
			list: ['original 1', 'original 2'],
			deep: {merge: {object: {key: 'not value'}}}
		}
	}

	const actual = await reshape({
		parser: sugar,
		plugins: [
			defineLocals(config),
			layouts({encoding: 'utf8', root: fixtures}),
			include({root: fixtures}),
			expressions(config)
		]
	}).process(source)

	logActual(actual, config)

	return t.true(actual.output(config.locals).trim() === expect.trim())
})

function logActual(actual, config) {
	if (process.env.LOG)
		console.log(actual.output.toString(), '\n--------\n', actual.output(config.locals))
}
