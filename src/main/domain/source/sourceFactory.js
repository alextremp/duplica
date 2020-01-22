import {Source} from './Source'
import {inject} from '../../core/ioc'

export const sourceFactoryBuilder = ({
  fs = inject('fs'),
  path = inject('path'),
  inquirer = inject('inquirer'),
  handlebars = inject('handlebars')
} = {}) => ({root}) => new Source({root, fs, path, inquirer, handlebars})
