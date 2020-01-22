import {inject} from '../../core/ioc'
import {logger} from '../../../logger'

const log = logger.logger('Destination')
class Destination {
  constructor({root, path = inject('path'), fs = inject('fs')}) {
    this._root = root
    this._path = path
    this._fs = fs
  }

  save({target, content}) {
    log.debug(() => ['save', {target, content}])
    const path = this._path.join(this._root, target)
    const folder = this._path.dirname(path)
    if (!this._fs.existsSync(folder)) {
      this._fs.ensureDirSync(folder)
    }
    this._fs.writeFileSync(path, content, {encoding: 'utf8'})
  }
}

export {Destination}
