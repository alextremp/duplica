import Duplica from './index'
import {setLogdaLevel} from 'logda'
import {loadContext} from './bootstrap/contextLoader'
import LOG from './core/logger'

const context = loadContext()
setLogdaLevel(context.configuration.logs ? 'debug' : 'info')

const log = LOG.logger('cli')

log.info(() => 'Starting...')
Promise.resolve()
  .then(() => Duplica.init({context}).process({source: context.source}))
  .then(() => log.info(() => 'Finished'))
  .catch(error => log.error(() => ['Error', {error}]))
