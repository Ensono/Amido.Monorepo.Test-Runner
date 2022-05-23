#! /usr/bin/env node

const chalk = require('chalk')
const {logCommandResults} = require('./utils/logging/index.cjs')

const {
  getFilesChanged,
  getModuleRootDirectories,
  getModuleConsumers,
  orderModules,
  runCommand,
} = require('./core/index.cjs')
const statusColours = require('./utils/theme/index.cjs')

const runCLI = async () => {
  const modulesWithFailedScript = []
  const commands = [
    {command: 'build', flags: ''},
    {command: 'lint', flags: ''},
    {command: 'test', flags: ' -- --reporters=jest-standard-reporter'},
  ]

  try {
    const filesChanged = await getFilesChanged()
    const modulePaths = await getModuleRootDirectories(filesChanged)
    const moduleConsumers = await getModuleConsumers(modulePaths)
    let orderedModules = await orderModules(moduleConsumers)

    for (const command of commands) {
      const results = await runCommand(orderedModules, command)
      const {modulesSucceeded, modulesFailed} = logCommandResults(results, orderedModules)

      if (modulesFailed.length) {
        modulesWithFailedScript.push(modulesFailed)
        orderedModules = [...modulesSucceeded]
      }
    }

    if (modulesWithFailedScript.length) {
      console.error(chalk.hex(statusColours.error)('Errors occured while executing the following commands:'))
      modulesWithFailedScript.forEach(failedScript => console.error(chalk.hex(statusColours.error)(failedScript)))
    } else {
      console.log(chalk.hex(statusColours.success)('All commands completed successfully ✅'))
    }
  } catch (error) {
    console.error(chalk.hex(statusColours.error)(`\n ${error}`))
  }
}

runCLI()