#! /usr/bin/env node
const chalk = require('chalk')
const argv = require('minimist')(process.argv.slice(2));

const {logCommandResults} = require('./utils/logging/index.cjs')

const {
  getFilesChanged,
  getModuleRootDirectories,
  getModuleConsumers,
  orderModules,
  runCommand,
} = require('./core/index.cjs')
const statusColours = require('./utils/theme/index.cjs')

const generateCommands = () => {
  const buildCommand =  argv['build-cmd'] ? argv['build-cmd'] : 'build'
  const buildFlags =  argv['build-flags'] ? argv['build-flags'] : ''
  const isBuildEnabled = argv.build || (!argv.lint && !argv.test)

  const lintCommand =  argv['lint-cmd'] ? argv['lint-cmd'] : 'lint'
  const lintFlags =  argv['lint-flags'] ? argv['lint-flags'] : ''
  const isLintEnabled = argv.lint || (!argv.build && !argv.test)

  const testCommand =  argv['test-cmd'] ? argv['test-cmd'] : 'test'
  const testFlags =  argv['test-flags'] ? argv['test-flags'] : ''
  const isTestEnabled = argv.test || (!argv.build && !argv.lint)

  const commmands = []
  isBuildEnabled && commmands.push({command: buildCommand, flags: buildFlags})
  isLintEnabled && commmands.push({command: lintCommand, flags: lintFlags})
  isTestEnabled && commmands.push({command: testCommand, flags: testFlags})
  return commmands
}

const runCLI = async () => {
  const modulesWithFailedScript = []
  const commands = generateCommands()

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
      modulesWithFailedScript.forEach(failureMessages => console.error(...failureMessages))
    } else {
      console.log(chalk.hex(statusColours.success)('All commands completed successfully ✅'))
    }
  } catch (error) {
    console.error(chalk.hex(statusColours.error)(`\n ${error}`))
  }
}

runCLI()