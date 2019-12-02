Promise.resolve()
  .then(require('./src/main'))
  .catch(error => console.log(error))