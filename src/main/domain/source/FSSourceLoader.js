import {inject} from '../../core/ioc'

class FSSourceLoader {
  constructor({path = inject('path')} = {}) {
    this._path = path
  }

  load({source}) {
    return this._path.resolve(source)
  }
}

export {FSSourceLoader}
