const path = require('path')
const fs = require('fs-extra')
const shell = require('shelljs')

const inquirer = require('inquirer')
const handlebars = require('handlebars')
require('handlebars-helpers')({handlebars})

const PWD = process.cwd()
const LOG = console.log

const privateMeikit = require('./meikit')
let clientMeikit

let cleanFolders = []

run()
  .then(() => LOG('[done]'))
  .catch(error =>  LOG('[error]', error))
  .then(() => cleanFolders.forEach(folder => clean({folder})))

async function run() {
  const {source, target} = await ask()
  const {targetFolder, templateFolder} = prepare({source, target})
  cleanFolders.push(templateFolder)
  clientMeikit = loadClientMeikit({templateFolder})
  const model = await createModel({templateFolder})
  const sourceBaseFolder = path.join(templateFolder, 'template')

  LOG('[model]', model)
  LOG('[targetFolder]', targetFolder)
  if (!fs.existsSync(sourceBaseFolder)) {
    throw new Error('The template does not exist: ' + sourceBaseFolder)
  }

  const templateFiles = loadFilePaths({folder: sourceBaseFolder})
  templateFiles.forEach(templateFile => processFile({
    model,
    file: templateFile,
    sourceBaseFolder,
    targetBaseFolder: targetFolder
  }))
}

async function ask() {
  return inquirer.prompt(privateMeikit.questions)
}

function prepare({source, target}) {
  LOG('[prepare]', source, target)
  const targetFolder = path.resolve(path.join(PWD, target))
  const templateFolder = `${targetFolder}_meikit_template`

  if (fs.existsSync(targetFolder)) {
    throw new Error('Already exists: ' + targetFolder)
  }
  if (fs.existsSync(templateFolder)) {
    throw new Error('Already exists: ' + templateFolder)
  }

  fs.ensureDirSync(targetFolder)
  fs.ensureDirSync(templateFolder)

  const command = `git clone ${source} ${templateFolder}`
  LOG('[loading source]', command)
  shell.exec(command)

  return {
    targetFolder,
    templateFolder
  }
}

function clean({folder}) {
  if (fs.existsSync(folder)) {
    LOG('[clean]', folder)
    fs.removeSync(folder)
  }
}

function loadClientMeikit({templateFolder}) {
  const clientMeikitFile = path.join(templateFolder, 'meikit.js')
  if (!fs.existsSync(clientMeikitFile)) {
    throw new Error('MeikIT configuration does not exist: ' + clientMeikitFile)
  }
  const meikit = require(clientMeikitFile)
  if (!meikit.questions) {
    throw new Error('MeikIT configuration has no questions: ' + clientMeikitFile)
  }
  return meikit
}

async function createModel({templateFolder}) {
  return inquirer.prompt(clientMeikit.questions)
    .then(responses => {
      const model = {...responses}
      if (clientMeikit.customProperties) {
        let template
        for (const customProperty in clientMeikit.customProperties) {
          template = handlebars.compile(clientMeikit.customProperties[customProperty])
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


function processFile({model, file, sourceBaseFolder, targetBaseFolder}) {
  const shortPath = (path) => path.replace(sourceBaseFolder + '/', '')
  const sourceShortPath = shortPath(file)

  if (isFiltered({file: sourceShortPath, model})) {
    LOG('[excluded]', sourceShortPath)
    return
  }

  const isTemplate = file.endsWith('.meikit')
  const targetFile = handlebars.compile(file)(model).replace(/.meikit$/, '')

  const targetShortPath = shortPath(targetFile)
  LOG('[meikit]', sourceShortPath, '=>', targetShortPath)

  const source = fs.readFileSync(file, {encoding: 'utf8'})
  const target = isTemplate ? handlebars.compile(source)(model) : source

  const targetDestination = path.join(targetBaseFolder, targetShortPath)
  const targetDestinationFolder = path.dirname(targetDestination)

  if (!fs.existsSync(targetDestinationFolder)) {
    fs.ensureDirSync(targetDestinationFolder)
  }

  fs.writeFileSync(targetDestination, target, {encoding: 'utf8'})
}

function isFiltered({file, model}) {
  if (!clientMeikit.exclude) {
    return false
  }
  return clientMeikit.exclude.some(filter => filter({
    file,
    model
  }))
}
