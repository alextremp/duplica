import {logger} from './logger'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import shell from 'shelljs'
import inquirer from 'inquirer'
import handlebars from 'handlebars'
import handlebarsHelpers from 'handlebars-helpers'
handlebarsHelpers({handlebars})

// todo initialize logger depending on --verbose prop
// todo add brusc ioc
// todo add versiona
// todo add sample open sources lib template
// todo no need for isTemplate func, better ask a function for 'statics' to copy directly
const PWD = process.cwd()
const LOG = logger.logger('Main')

const privateDuplica = require('./duplica')
let clientDuplica

const main = ({source, options}) =>
  run({source, options})
    .then(() => LOG.info(() => 'done'))
    .catch(error => LOG.error(() => ['Generator error', error]))

async function run({source, options}) {
  LOG.info(() => ['Running...', {source, options}])
  const {target} = await ask()
  const {targetFolder, templateFolder} = await prepare({
    source,
    target,
    ...options
  })
  clientDuplica = loadClientDuplica({templateFolder})
  const model = await createModel({templateFolder})
  const sourceBaseFolder = path.join(templateFolder, 'template')

  LOG.info(() => ['Start with', {model, targetFolder}])
  if (!fs.existsSync(sourceBaseFolder)) {
    throw new Error('The template does not exist: ' + sourceBaseFolder)
  }

  const templateFiles = loadFilePaths({folder: sourceBaseFolder})
  templateFiles.forEach(templateFile =>
    processFile({
      model,
      file: templateFile,
      sourceBaseFolder,
      targetBaseFolder: targetFolder,
      test: options.test
    })
  )
}

async function ask() {
  return inquirer.prompt(privateDuplica.questions)
}

async function prepare({source, target, local, test}) {
  LOG.info(() => ['Preparing', {source, target}])

  const targetFolder = path.resolve(path.join(PWD, target))
  if (!test && fs.existsSync(targetFolder)) {
    const {overwrite} = await inquirer.prompt([
      {
        name: 'overwrite',
        message: `(*) Target folder (${targetFolder}) exists, files could be overwritten. Continue?`,
        type: 'confirm',
        default: false
      }
    ])
    if (!overwrite) {
      LOG.info(() => 'Aborting mission!')
      process.exit()
    }
  }
  !test && fs.ensureDirSync(targetFolder)

  let templateFolder
  if (!local) {
    templateFolder = fs.mkdtempSync(
      path.join(os.tmpdir(), `duplica-${Date.now()}-`)
    )
    const command = `git clone ${source} ${templateFolder}`
    LOG.info(() => ['Loading source', {command}])
    shell.exec(command)
  } else {
    templateFolder = path.resolve(source)
  }
  return {
    targetFolder,
    templateFolder
  }
}

function loadClientDuplica({templateFolder}) {
  const clientDuplicaFile = path.join(templateFolder, 'duplica.js')
  if (!fs.existsSync(clientDuplicaFile)) {
    throw new Error(
      'Duplica configuration does not exist: ' + clientDuplicaFile
    )
  }
  const duplica = require(clientDuplicaFile)
  if (!duplica.questions) {
    throw new Error(
      'Duplica configuration has no questions: ' + clientDuplicaFile
    )
  }
  return duplica
}

async function createModel({templateFolder}) {
  return inquirer.prompt(clientDuplica.questions).then(responses => {
    const model = {...responses}
    if (clientDuplica.customProperties) {
      let template
      for (const customProperty in clientDuplica.customProperties) {
        template = handlebars.compile(
          clientDuplica.customProperties[customProperty]
        )
        model[customProperty] = template(model)
      }
    }
    model.OPEN_BRACE = '{'
    model.CLOSE_BRACE = '}'
    return model
  })
}

function loadFilePaths({folder}) {
  const accumulated = []
  const load = ({file, paths}) => {
    const isFile = !fs.statSync(file).isDirectory()
    if (isFile) {
      paths.push(file)
    } else {
      const list = fs.readdirSync(file)
      list.forEach(listed => load({file: path.join(file, listed), paths}))
    }
  }
  load({file: folder, paths: accumulated})
  return accumulated
}

function processFile({model, file, sourceBaseFolder, targetBaseFolder, test}) {
  const shortPath = path => path.replace(sourceBaseFolder + '/', '')
  const sourceShortPath = shortPath(file)

  if (isFiltered({file: sourceShortPath, model})) {
    LOG.info(() => ['Excluded: ' + sourceShortPath])
    return
  }

  const isTemplate = file.endsWith('.duplica')
  const targetFile = handlebars
    .compile(file)(model)
    .replace(/.duplica$/, '')

  const targetShortPath = shortPath(targetFile)
  LOG.info(() => [sourceShortPath + '=>' + targetShortPath])

  const source = fs.readFileSync(file, {encoding: 'utf8'})
  const target = isTemplate ? handlebars.compile(source)(model) : source

  if (!test) {
    const targetDestination = path.join(targetBaseFolder, targetShortPath)
    const targetDestinationFolder = path.dirname(targetDestination)

    if (!fs.existsSync(targetDestinationFolder)) {
      fs.ensureDirSync(targetDestinationFolder)
    }

    fs.writeFileSync(targetDestination, target, {encoding: 'utf8'})
  }
}

function isFiltered({file, model}) {
  if (!clientDuplica.exclude) {
    return false
  }
  return clientDuplica.exclude.some(filter =>
    filter({
      file,
      model
    })
  )
}

export {main}
