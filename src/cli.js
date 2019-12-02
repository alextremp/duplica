#!/usr/bin/env node

const main = require('./main')
const meow = require('meow')

const cli = meow(`
Usage
$ npx meik [path to meik template] [options]

Options
  --local The path to meik template is a local folder instead of a Git URL
  --test  Nothing to be generated, just test the template

Examples

$ npx meik https://github.com/meikit/meikit-sample-js-lib-template.git

$ npx meik ./my-template --local
`, {
  flags: {
    local: {
      type: 'boolean',
      default: false
    },
    test: {
      type: 'boolean',
      default: false
    }
  }
})

if (!(cli.input.length > 0 && cli.input[0])) {
  cli.showHelp(1)
}

Promise.resolve()
  .then(() => main({
    source: cli.input[0],
    options: cli.flags
  }))
  .catch(error => console.error(error))

