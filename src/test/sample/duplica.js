const notEmpty = input => (input && input.length > 0) || 'Cannot be empty'

const questions = [
  {
    name: 'name',
    message: '(*) name:',
    validate: notEmpty
  }
]

module.exports = {
  questions
}