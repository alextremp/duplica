import {inject} from '../../core/ioc'

class CreateDestinationService {
  constructor({
    destinationFactory = inject('destinationFactory'),
    inquirer = inject('inquirer'),
    fs = inject('fs'),
    path = inject('path'),
    dir = inject('dir')
  } = {}) {
    this._destinationFactory = destinationFactory
    this._inquirer = inquirer
    this._fs = fs
    this._path = path
    this._dir = dir
  }

  async createDestination({filesRoot}) {
    const targetFolderQuestion = await this._inquirer.prompt([
      {
        type: 'input',
        name: 'targetFolder',
        message: '(*) Target folder:',
        validate: input => (input && input.length > 0) || 'Cannot be empty'
      }
    ])

    const targetFolder = targetFolderQuestion.targetFolder
    const target = this._path.resolve(this._path.join(this._dir, targetFolder))
    if (this._fs.existsSync(target)) {
      const overwrite = await this._inquirer.prompt([
        {
          name: 'overwrite',
          message: `(*) Target folder (${targetFolder}) exists, files could be overwritten. Continue?`,
          type: 'confirm',
          default: false
        }
      ])
      if (!overwrite) {
        throw new Error(`Won't override existing folder: ${targetFolder}`)
      }
    }
    const destination = this._destinationFactory({root: target})
    return destination
  }
}

export {CreateDestinationService}
