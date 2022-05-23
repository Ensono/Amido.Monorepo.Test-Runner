const chalk = require('chalk')
const statusColours = require('../theme/index.cjs')

const logCommandResults = (results, orderedPackages) => {
  const modulesFailed = []
  let modulesSucceeded = [...orderedPackages]
  const divider = '-------------------------------------------'
  const {log, error} = statusColours

  results.forEach(({command, message, module, hasError}) => {
    const logColour = hasError ? error : log
    const status = hasError ? 'failed ❌' : 'successful ✅ '
    const formattedMessage = `\n${divider}\n${module}: ${command} ${status}\n${divider}\n${message}${divider}\n`

    if (hasError) {
      console.log('has error')
      modulesSucceeded = modulesSucceeded.filter((orderedPackage) => {
        console.log(orderedPackage.module, module, orderedPackage.module !== module)
        return orderedPackage.module !== module
      })
      modulesFailed.push(formattedMessage)
      console.log('succ modules:', modulesSucceeded)
    }

    console.log(chalk.hex(logColour)(formattedMessage))
  })

  return {modulesSucceeded, modulesFailed}
}

module.exports = {logCommandResults}
