const path = require('path')
const {promisify} = require('util')
const {readFile} = require('fs')

const test = require('ava')
const del = require('del')

const reshape = require('reshape')
const sugar = require('sugarml')
const expressions = require('reshape-expressions')
const layouts = require('reshape-layouts')
const include = require('reshape-include')

const Spike = require('spike-core')
const pageId = require('spike-page-id')

const defineLocals = require('..')

const readFileAsync = promisify(readFile)
const fixtures = path.join(__dirname, 'fixtures')

test('Basic', async t => {
	const source = await readFileAsync(path.join(fixtures, `basic.html`), 'utf8')
	const expect = await readFileAsync(path.join(fixtures, `basic.expected.html`), 'utf8')

	const config = {
		locals: {foo: 'bar'}
	}

	const actual = await reshape({
		plugins: [defineLocals(config), expressions(config)]
	}).process(source)

	logActual(actual, config)

	return t.true(actual.output(config.locals).trim() === expect.trim())
})

test('Unscoped in layouts and partials', async t => {
	const source = await readFileAsync(path.join(fixtures, `layouts.html`), 'utf8')
	const expect = await readFileAsync(path.join(fixtures, `layouts.expected.html`), 'utf8')

	const config = {
		scope: false,
		locals: {
			page: {title: 'This will be overwritten'},
			list: ['original 1', 'original 2'],
			deep: {merge: {object: {key: 'not value'}}}
		}
	}

	const actual = await reshape({plugins: [
		layouts({encoding: 'utf8', root: fixtures}),
		include({root: fixtures}),
		defineLocals(config),
		expressions(config)
	]}).process(source)

	logActual(actual, config)

	return t.true(actual.output(config.locals).trim() === expect.trim())
})

test('Scoped SugarML', async t => {
	const source = await readFileAsync(path.join(fixtures, `scoped.sgr`), 'utf8')
	const expect = await readFileAsync(path.join(fixtures, `scoped.expected.html`), 'utf8')

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
			layouts({encoding: 'utf8', root: fixtures}),
			include({root: fixtures}),
			defineLocals(config),
			expressions(config)
		]
	}).process(source)

	logActual(actual, config)

	return t.true(actual.output(config.locals).trim() === expect.trim())
})

test('Unscoped SugarML and custom tag', async t => {
	const source = await readFileAsync(path.join(fixtures, `unscoped-custom-tag.sgr`), 'utf8')
	const expect = await readFileAsync(path.join(fixtures, `unscoped-custom-tag.expected.html`), 'utf8')

	const config = {
		tag: 'locals',
		scope: false,
		locals: {
			page: {title: 'This will be overwritten'},
			list: ['original 1', 'original 2'],
			deep: {merge: {object: {key: 'not value'}}}
		}
	}

	const actual = await reshape({
		parser: sugar,
		plugins: [
			layouts({encoding: 'utf8', root: fixtures}),
			include({root: fixtures}),
			defineLocals(config),
			expressions(config)
		]
	}).process(source)

	logActual(actual, config)

	return t.true(actual.output(config.locals).trim() === expect.trim())
})

test('Usage with Spike, scoped', async t => {
	const spikeRoot = path.join(fixtures, 'spike-default')
	const spikePublic = path.join(spikeRoot, 'public')
	const spikeExpect = path.join(fixtures, 'spike-expected')

	await del([spikePublic])

	const locals = {}
	await compileProject('spike-default', {
		matchers: {html: '*(**/)*.sgr'},
		ignore: ['layout.sgr', '.gitignore', 'expected'],
		entry: {index: ['./index.js']},
		reshape: {
			parser: sugar,
			plugins: [
				layouts({encoding: 'utf8', root: spikeRoot}),
				include({root: spikeRoot}),
				defineLocals(),
				expressions()
			],
			locals: ctx => {
				return Object.assign(locals, {
					pageId: pageId(ctx),
					locals: {overwritten: 'This is defined in app.js'}
				})
			}
		}
	})

	const compareListFiles = ['01-add-stuff.html', '02-overwrite-in-block.html', '03-undefined.html']
	const actualFiles = await Promise.all(compareListFiles.map(
		f => readFileAsync(path.join(spikePublic, f), 'utf8')
	))
	const expectedFiles = await Promise.all(compareListFiles.map(
		f => readFileAsync(path.join(spikeExpect, `default.${f}`), 'utf8')
	))
	t.deepEqual(actualFiles, expectedFiles)
})

test('Usage with Spike, custom tag and unscoped', async t => {
	const spikeRoot = path.join(fixtures, 'spike-custom')
	const spikePublic = path.join(spikeRoot, 'public')
	const spikeExpect = path.join(fixtures, 'spike-expected')

	await del([spikePublic])

	const locals = {}
	await compileProject('spike-custom', {
		matchers: {html: '*(**/)*.sgr'},
		ignore: ['layout.sgr', '.gitignore', 'expected'],
		entry: {index: ['./index.js']},
		reshape: {
			parser: sugar,
			plugins: [
				layouts({encoding: 'utf8', root: spikeRoot}),
				include({root: spikeRoot}),
				defineLocals({
					scope: false,
					tag: 'locals'
				}),
				expressions()
			],
			locals: ctx => {
				return Object.assign(locals, {
					pageId: pageId(ctx),
					// here we "recreate" keys so they don't bleed through between the runs
					overwritten: 'This is defined in app.js',
					page: {title: 'Default title', description: 'Default description'}
				})
			}
		}
	})

	const compareListFiles = ['04-add-stuff.html', '05-undefined-bleedover.html']
	const actualFiles = await Promise.all(compareListFiles.map(
		f => readFileAsync(path.join(spikePublic, f), 'utf8')
	))
	const expectedFiles = await Promise.all(compareListFiles.map(
		f => readFileAsync(path.join(spikeExpect, `custom.${f}`), 'utf8')
	))
	t.deepEqual(actualFiles, expectedFiles)
})

function logActual(actual, config) {
	if (process.env.LOG)
		console.log(actual.output.toString(), '\n--------\n', actual.output(config.locals))
}

// utility function
function compileProject(name, config) {
	return new Promise((resolve, reject) => {
		const root = path.join(fixtures, name)
		const project = new Spike(Object.assign({root}, config))

		project.on('error', reject)
		project.on('warning', reject)
		project.on('compile', res => {
			resolve({publicPath: path.join(root, 'public'), stats: res.stats})
		})

		project.compile()
	})
}
