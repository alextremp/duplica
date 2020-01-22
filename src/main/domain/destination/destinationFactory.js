import {Destination} from './Destination'
import {FakeDestination} from './FakeDestination'

export const desinationFactoryBuilder = ({test}) => ({root}) =>
  test ? new FakeDestination({root}) : new Destination({root})
