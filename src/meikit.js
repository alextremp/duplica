const notEmpty = input => (input && input.length > 0) || 'Cannot be empty'

const questions = [
  {
    name: 'target',
    message: '(*) Target folder:',
    validate: notEmpty
  }
]

module.exports = {
  questions
}