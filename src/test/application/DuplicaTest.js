import {expect} from 'chai'
import {DuplicaInitializer} from '../../main/bootstrap/DuplicaInitializer'

describe('Duplica', () => {
  it('should', async () => {
    const givenContext = {}
    try {
      const duplica = DuplicaInitializer.init({context: givenContext})
      await duplica.process({})
    } catch (e) {
      console.log('ERROR!!', JSON.stringify(e))
    }
  })
})
