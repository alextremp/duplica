#!/usr/bin/env node
import {main} from './main'
import meow from 'meow'
import {logger} from './logger'

const LOG = logger.logger('cli')

const cli = meow(
  `
Usage
$ npx duplica [path to duplica template] [options]

Options
  --local   The path to duplica template is a local folder instead of a Git URL
  --test    Nothing to be generated, just test the template
  --verbose Enable console logs

Examples

$ npx duplica https://github.com/alextremp/duplica-open-source-js-lib-template.git

$ npx duplica ./my-local-duplica-template --local --logs
`,
  {
    flags: {
      local: {
        type: 'boolean',
        default: false
      },
      test: {
        type: 'boolean',
        default: false
      },
      logs: {
        type: 'boolean',
        default: false
      }
    }
  }
)
if (!(cli.input.length > 0 && cli.input[0])) {
  cli.showHelp(1)
}

Promise.resolve()
  .then(() =>
    main({
      source: cli.input[0],
      options: cli.flags
    })
  )
  .catch(error => LOG.error(() => ['An error occurred', error]))
