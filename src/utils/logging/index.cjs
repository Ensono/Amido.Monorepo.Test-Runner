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
    const messageHeader = `\n${divider}\n${module}: ${command} ${status}\n${divider}\n`
    const messageFooter = `${divider}\n`
    const sanitisedMessage = [chalk.hex(logColour)(messageHeader), message, chalk.hex(logColour)(messageFooter)]

    if (hasError) {
      modulesSucceeded = modulesSucceeded.filter((orderedPackage) => {
        return orderedPackage.module !== module
      })
      modulesFailed.push(...sanitisedMessage)
    }

    console.log(...sanitisedMessage)
  })

  return {modulesSucceeded, modulesFailed}
}

module.exports = {logCommandResults}
