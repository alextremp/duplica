import {iocInjector} from 'brusc'

const IOC_MODULE = 'duplica'
const inject = key => iocInjector(IOC_MODULE)(key)

export {inject, IOC_MODULE}
