import {logger} from '../../../logger'

const log = logger.logger('Source')
class Source {
  constructor({root, fs, path, inquirer, handlebars}) {
    this._root = root
    this._fs = fs
    this._path = path
    this._inquirer = inquirer
    this._handlebars = handlebars

    this._duplicaFile = this._path.join(this._root, DUPLICA_FILE)
    if (!this._fs.existsSync(this._duplicaFile)) {
      throw new Error(
        'Duplica configuration does not exist: ' + this._duplicaFile
      )
    }

    this._templateFolder = this._path.join(this._root, TEMPLATE_FOLDER)
    if (!this._fs.existsSync(this._templateFolder)) {
      throw new Error('Template folder does not exist: ' + this._templateFolder)
    }

    this._duplica = require(this._duplicaFile)
    if (!this._duplica.questions) {
      throw new Error(
        'Duplica configuration has no questions: ' + this._duplicaFile
      )
    }
  }

  get templateFolder() {
    return this._templateFolder
  }

  async process({destination}) {
    const model = await this._loadModel()
    const filePaths = this._loadFilePaths().filter(
      filePath => !this._isExcluded({filePath, model})
    )
    filePaths.forEach(path => {
      log.debug(() => [
        'processing path',
        {
          path,
          model
        }
      ])
      const isStatic = this._isStatic(path)
      const targetPath = this._handlebars.compile(path)(model)
      const target = targetPath.replace(this._templateFolder, '.')
      const rawContent = this._read(path)
      const content = isStatic
        ? rawContent
        : this._handlebars.compile(rawContent)(model)
      destination.save({target, content})
    })
  }

  async _loadModel() {
    const model = await this._inquirer.prompt(this._duplica.questions)
    if (this._duplica.customProperties) {
      for (const customProperty in this._duplica.customProperties) {
        const template = this._handlebars.compile(
          this._duplica.customProperties[customProperty]
        )
        model[customProperty] = template(model)
      }
    }
    model.OPEN_BRACE = '{'
    model.CLOSE_BRACE = '}'
    return model
  }

  _loadFilePaths() {
    const accumulated = []
    const load = ({file, paths}) => {
      const isFile = !this._fs.statSync(file).isDirectory()
      if (isFile) {
        paths.push(file)
      } else {
        const list = this._fs.readdirSync(file)
        list.forEach(listed =>
          load({file: this._path.join(file, listed), paths})
        )
      }
    }
    load({file: this._templateFolder, paths: accumulated})
    return accumulated
  }

  _isExcluded({file, model}) {
    if (this._duplica.exclusions) {
      return this._duplica.exclusions.some(f => f({file, model}))
    }
    return false
  }

  _isStatic(path) {
    if (this._duplica.statics) {
      return this._duplica.statics.some(f => f({path}))
    }
  }

  _read(path) {
    return this._fs.readFileSync(path, {encoding: 'utf8'})
  }
}
const TEMPLATE_FOLDER = 'template'
const DUPLICA_FILE = 'duplica.js'

export {Source}
