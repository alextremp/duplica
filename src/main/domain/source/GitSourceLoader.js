import {inject} from '../../core/ioc'
import LOG from '../../core/logger'

class GitSourceLoader {
  constructor({
    fs = inject('fs'),
    path = inject('path'),
    os = inject('os'),
    shell = inject('shell')
  } = {}) {
    this._fs = fs
    this._path = path
    this._os = os
    this._shell = shell
  }

  load({source}) {
    const targetFolder = this._fs.mkdtempSync(
      this._path.join(this._os.tmpdir(), `duplica-${Date.now()}-`)
    )
    const command = `git clone ${source} ${targetFolder}`
    log.debug(() => ['Loading source', {command}])
    const cloneResult = this._shell.exec(command)
    if (cloneResult.code !== 0) {
      throw new Error('Error loading source')
    }
    return targetFolder
  }
}

const log = LOG.logger('GitLoadSourceService')

export {GitSourceLoader}
