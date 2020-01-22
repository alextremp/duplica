import {iocModule} from 'brusc'
import {IOC_MODULE} from '../core/ioc'
import inquirer from 'inquirer'
import path from 'path'
import fs from 'fs-extra'
import os from 'os'
import shell from 'shelljs'
import handlebars from 'handlebars'
import handlebarsHelpers from 'handlebars-helpers'
import {ProcessUseCase} from '../application/service/ProcessUseCase'
import {CreateDestinationService} from '../domain/destination/CreateDestinationService'
import {desinationFactoryBuilder} from '../domain/destination/destinationFactory'
import {FSSourceLoader} from '../domain/source/FSSourceLoader'
import {GitSourceLoader} from '../domain/source/GitSourceLoader'
import {LoadSourceService} from '../domain/source/LoadSourceService'
import {sourceFactoryBuilder} from '../domain/source/sourceFactory'
import {Duplica} from '../application/Duplica'

class DuplicaInitializer {
  static init({context}) {
    iocModule({
      module: IOC_MODULE,
      initializer: ({singleton}) => initContainer({context, singleton})
    })
    return new Duplica()
  }
}

const initContainer = ({context, singleton}) => {
  const {test} = context

  singleton(ProcessUseCase, () => new ProcessUseCase())

  singleton(CreateDestinationService, () => new CreateDestinationService())
  singleton('destinationFactory', () => desinationFactoryBuilder({test}))

  singleton(LoadSourceService, () => new LoadSourceService())
  singleton('sourceFactory', () => sourceFactoryBuilder())
  singleton(FSSourceLoader, () => new FSSourceLoader())
  singleton(GitSourceLoader, () => new GitSourceLoader())

  singleton('inquirer', () => inquirer)
  singleton('path', () => path)
  singleton('fs', () => fs)
  singleton('dir', () => process.cwd())
  singleton('os', () => os)
  singleton('shell', () => shell)

  singleton('handlebars', () => {
    handlebarsHelpers({handlebars})
    return handlebars
  })
}

export {DuplicaInitializer}
