Reshape Define Locals

---

Define and append locals inside your reshape/sugarml files. Supports YAML and JavaScript functions.

---

## Installation

```
$ npm i -S reshape-define-locals
```

## Usage

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

### Using Javascript

When you need *some* logic, you can use JavaScript code, which is evaluated as a function and given one parameter: existing `locals`.

``` html
<div class='some-other-div'>
  <script type='text/javascript' define-locals>
    return {
      arr: ['one', 'two', 'three']
    }
  </script>

  <p>{{ locals.arr.join(' ') }}</p>
</div>
