import {inject} from '../../core/ioc'
import {GitSourceLoader} from './GitSourceLoader'
import {FSSourceLoader} from './FSSourceLoader'

class LoadSourceService {
  constructor({
    sourceFactory = inject('sourceFactory'),
    gitLoader = inject(GitSourceLoader),
    fsLoader = inject(FSSourceLoader)
  } = {}) {
    this._sourceFactory = sourceFactory
    this._gitLoader = gitLoader
    this._fsLoader = fsLoader
  }

  async loadSource({source}) {
    const duplicaPath = this._isGit(source)
      ? this._gitLoader.load({source})
      : this._fsLoader.load({source})
    const sourceInstance = this._sourceFactory({root: duplicaPath})
    return sourceInstance
  }

  _isGit(source) {
    return source.startsWith('https://') || source.startsWith('git@')
  }
}

export {LoadSourceService}
