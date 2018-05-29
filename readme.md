# Reshape Define Locals ![NPM Version][version_badge] [![Build Status][build_badge]][build_link]

Define and append locals inside your reshape/sugarml files. Supports YAML and JavaScript functions.


---

## Installation

```
$ npm i -S reshape-define-locals
```

## Usage

### Javascript - Object (default)

Default mode is javascript, written as it would be written inside curly brackets:

``` html
<div class='some-other-div'>
  <define-locals>
    key: 'string',
    arr: ['one', 'two', 'three'],
    'with-dash': 'another-string'
  </script>

  <p>{{ locals.arr.join(' ') }}</p>
</div>
```

### Javascript - Function

When you need *some* logic, you can use `type='function'`, which is evaluated as a function and given one parameter: existing `locals`.

``` html
<div class='some-other-div'>
  <define-locals type='function'>
    return {
      arr: ['one', 'two', 'three', locals.foo]
    }
  </script>

  <p>{{ locals.arr.join(' ') }}</p>
</div>
```

### Using YAML

When you just need some data inside your current file.

``` html
<div class='just-some-div'>
  <define-locals type='yaml'>
    my-options:
    - one
    - two
    - three
  </define-locals>

  <p>{{ locals['my-options'].join(' ') }}</p>
</div>
```

## License
MIT, &copy; 2018 Adam Kiss

[build_badge]: https://semaphoreci.com/api/v1/adamkiss/reshape-define-locals/branches/master/badge.svg
[build_link]: https://semaphoreci.com/adamkiss/reshape-define-locals
[version_badge]: https://img.shields.io/npm/v/reshape-define-locals.svg?label=NPM&style=flat-square&colorB=b54c81
