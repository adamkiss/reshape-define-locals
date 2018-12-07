# Reshape Define Locals

![NPM Version][version_badge]
[![Build Status][build_badge]][build_link]

Define and append locals inside your reshape/sugarml files. Supports YAML and scoping. Be sure to read [Gotchas](#user-content-gotchas)

``` html
<div class='just-some-div'>
  <define-locals>
    options:
    - one
    - two
    - three
  </define-locals>

  <p>{{ options.join(', ') }}</p>
</div>
```

## Installation

```
$ npm i -S reshape-define-locals
```

## Usage

``` javascript
const reshape = require('reshape')
const expressions = require('reshape-expressions')
const defineLocals = require('reshape-define-locals')

const source = `<define-locals>
  paraContent: 'This is my paragraph.'
</define-locals>
<p class="{{ paraClass }}">{{ file.paraContent }}</p>`
  const config = {locals: {paraClass: 'center'}}

const actual = await reshape({
  plugins: [defineLocals(config), expressions(config)]
}).process(source)
```

## Configuration

``` javascript
{
  tag: 'define-locals',
  scope: 'file',
  locals
}
```

### `tag`

string, default: `'define-locals'`

This is the tag that is parsed as locals.

### `scope`

string or false, default: `'file'`

All locals blocks are parsed and available as `locals.file`, or simply `file` in your templates. Using usage example, you can set `scope` to false and the you'll be able to use `{{ paraContent }}` only. This will keep data between files until they are overwritten, so be sure to **read gotchas**.

### `locals`

object, default: `{}`

Locals coming from your application.

## Gotchas

### My locals defined as a direct descendand of "extends" aren't loaded

As far as I can tell, only named blocks are processed in `extends`, so either define your locals before `extends`, or in the named block.

``` html
<!-- this won't work -->
<extends src='layout.html'>
  <define-locals>
    key: value
  </define-locals>
  <block name='content'>
    <p>{{ file.key }}</p>
  </block>
</extends>

<!-- this will -->
<define-locals>
  key: value
</define-locals>
<extends src='layout.html'>
  <block name='content'>
    <p>{{ file.key }}</p>
  </block>
</extends>

<!-- this will as well -->
<extends src='layout.html'>
  <block name='content'>
    <define-locals>
      key: value
    </define-locals>
    <p>{{ file.key }}</p>
  </block>
</extends>

```

### Old locals are available until changed when using unscoped locals

The simplest way to actually bring the data from your `define-locals` block to reshape is to modify original `locals` object. What this means though, is that keys unchanged between files stay the same, meaning that, if `file-1.html` defines local property `key` to `value` and `file-2.html` doesn't, if you call `{{ key }}` in `file-2.html`, you will get `value`, not undefined.

What this means in practice: you need to reset data between different files yourself, or not be dependent on non-existence of some data.

## License
MIT, &copy; 2018 Adam Kiss

[build_badge]: https://semaphoreci.com/api/v1/adamkiss/reshape-define-locals/branches/master/badge.svg
[build_link]: https://semaphoreci.com/adamkiss/reshape-define-locals
[version_badge]: https://img.shields.io/npm/v/reshape-define-locals.svg?label=NPM&style=flat-square&colorB=b54c81
