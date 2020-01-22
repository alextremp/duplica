import {inject} from '../../core/ioc'
import {CreateDestinationService} from '../../domain/destination/CreateDestinationService'
import {LoadSourceService} from '../../domain/source/LoadSourceService'

class ProcessUseCase {
  constructor({
    createDestinationService = inject(CreateDestinationService),
    loadSourceService = inject(LoadSourceService)
  } = {}) {
    this._createDestinationService = createDestinationService
    this._loadSourceService = loadSourceService
  }

  async execute({source}) {
    const duplicaSource = await this._loadSourceService.loadSource({source})
    const destination = await this._createDestinationService.createDestination({
      filesRoot: duplicaSource.templateFolder
    })
    return duplicaSource.process({destination})
  }
}

export {ProcessUseCase}
