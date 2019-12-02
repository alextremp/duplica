const path = require('path')
const fs = require('fs-extra')
const shell = require('shelljs')

const inquirer = require('inquirer')
const handlebars = require('handlebars')
require('handlebars-helpers')({handlebars})

const PWD = process.cwd()
const LOG = console.log

const meikit = require('./meikit')

let cleanFolders = []

const main = ({source, options}) => run({source, options})
  .then(() => LOG('[done]'))
  .catch(error =>  LOG('[error]', error))
  .then(() => cleanFolders.forEach(folder => clean({folder})))

async function run({source, options}) {
  LOG('[meikit]', source, options)
  const {target} = await ask()
  const {targetFolder, templateFolder} = prepare({source, target, ...options})
  !options.local && cleanFolders.push(templateFolder)
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
    targetBaseFolder: targetFolder,
    test: options.test
  }))
}

async function ask() {
  return inquirer.prompt(meikit.questions)
}

function prepare({source, target, local, test}) {
  LOG('[prepare]', source, target)

  const targetFolder = path.resolve(path.join(PWD, target))
  if (!test && fs.existsSync(targetFolder)) {
    throw new Error('Already exists: ' + targetFolder)
  }
  !test && fs.ensureDirSync(targetFolder)

  let templateFolder
  if (!local) {
    templateFolder = `${targetFolder}_meikit_template`
    if (fs.existsSync(templateFolder)) {
      throw new Error('Already exists: ' + templateFolder)
    }
    fs.ensureDirSync(templateFolder)
    const command = `git clone ${source} ${templateFolder}`
    LOG('[loading source]', command)
    shell.exec(command)
  } else {
    templateFolder = path.resolve(path.join(PWD, source))
  }
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

async function createModel({templateFolder}) {
  const meikitFile = path.join(templateFolder, 'meikit.js')
  if (!fs.existsSync(meikitFile)) {
    throw new Error('MeikIT configuration does not exist: ' + meikitFile)
  }
  const meikit = require(meikitFile)
  if (!meikit.questions) {
    throw new Error('MeikIT configuration has no questions: ' + meikitFile)
  }
  return inquirer.prompt(meikit.questions)
    .then(responses => {
      const model = {...responses}
      if (meikit.customProperties) {
        let template
        for (const customProperty in meikit.customProperties) {
          template = handlebars.compile(meikit.customProperties[customProperty])
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
  const shortPath = (path) => path.replace(sourceBaseFolder + '/', '')
  const isTemplate = file.endsWith('.meikit')
  const targetFile = handlebars.compile(file)(model).replace(/.meikit$/, '')

  const sourceShortPath = shortPath(file)
  const targetShortPath = shortPath(targetFile)
  LOG('[meikit] ', sourceShortPath, '=>', targetShortPath)

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

module.exports = main
