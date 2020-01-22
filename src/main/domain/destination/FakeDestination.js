import {Destination} from './Destination'
import LOG from '../../core/logger'

class FakeDestination extends Destination {
  constructor({root}) {
    super({root})
  }

  save({target, content}) {
    log.info(() => ['Saving...', {target, content}])
  }
}

const log = LOG.logger('FakeDestination')

export {FakeDestination}
