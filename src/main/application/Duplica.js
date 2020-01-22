import {inject} from '../core/ioc'
import {ProcessUseCase} from './service/ProcessUseCase'

class Duplica {
  constructor({processUseCase = inject(ProcessUseCase)} = {}) {
    this._processUseCase = processUseCase
  }

  async process({source}) {
    return this._processUseCase.execute({source})
  }
}

export {Duplica}
