const {fork, exec: execPrePromisify} = require('child_process')
const {readdir} = require('fs/promises')
const {resolve} = require('path')
const argv = require('minimist')(process.argv.slice(2));
const util = require('util')
const chalk = require('chalk')

const statusColours = require('../utils/theme/index.cjs')

const exec = util.promisify(execPrePromisify)

/**
  * Retrives all files changed within a specified path.
  * @return {array<string>} A list of files changed.
*/
const getFilesChanged = async () => {
  // If grep fails to find path doesn't error when not found
  const {stdout, stderr} = await exec('git diff --name-only HEAD | grep libs/framework || true')
  if (stderr) {
    console.error(chalk.hex(statusColours.error)(stderr))
    process.exitCode = 1
  } else if (!stdout) {
    console.log(chalk.hex(statusColours.warning)('No changes recorded to any framework'))
    process.exitCode = 0
  } else {
    console.log(chalk.hex(statusColours.success)(`Files changed resolved successfully ✅ `))

    // Removes last entry as is empty space
    const filesChanged = stdout.split('\n').slice(0, -1)
    return filesChanged
  }
}

/**
  * Searches for a package.json in a directory.
  * @param {string} path - A file system directory.
  * @return {boolean} If package.json is found in the supplied path.
*/
const searchDirectoryForPackageJson = async path => {
  const filesInDirectory = await readdir(path)
  const file = filesInDirectory.find(currentFile => currentFile === 'package.json')
  return Boolean(file)
}

/**
  * Retrives and collates the root module paths from directories 
  * @param {array<string>} files - A list of file paths.
  * @return {array<string>} A list of root paths for modules
*/
const getModuleRootDirectories = async files => {
  const resolvedPaths = []

  for (const filePath of files) {
    const pathWithoutFilename = filePath.replace(/[^\/]+$/, '')
    let currentpath = pathWithoutFilename
    let isPackageFound = false
    let foundViaResolvedPaths = false

    // check if package.json is already found for file path
    resolvedPaths.forEach(path => {
      if (currentpath.includes(path)) {
        foundViaResolvedPaths = true
      }
    })

    if (foundViaResolvedPaths) {
      continue
    }

    while (!isPackageFound) {
      const isFound = await searchDirectoryForPackageJson(currentpath)
      if (isFound) {
        isPackageFound = true
        resolvedPaths.push(currentpath)
      } else {
        // go up one directory level if package.json not found
        const parentDirectory = currentpath.replace(/[^\/]+\/?$/, '')
        currentpath = parentDirectory
      }
    }
  }
  console.log(chalk.hex(statusColours.success)(`package.json located for all files ✅ `))
  return resolvedPaths
}

/**
  * Retrives all of the consumers from the supplied module directories.
  * @param {set<string>} modulePaths - A set of module root directories.
  * @return {set<string>} A list of root paths for modules
*/
const getModuleConsumers = async modulePaths => {
  const moduleConsumers = new Set()

  for (const path of modulePaths) {
    const {name} = require(resolve(`./${path}package.json`))
    console.log(chalk.hex(statusColours.log)(`\nSearching ${name} for package dependencies...`))
    const {stdout} = await exec(`npm list ${name} --json`)
    const {dependencies} = JSON.parse(stdout)

    if (!dependencies) {
      console.warn(chalk.hex(statusColours.warning)(`No consumers for the ${name} module`))
    } else {
      const dependenciesArr = Object.keys(dependencies)
      console.log(chalk.hex(statusColours.success)(`Package dependencies found ✅`))

      dependenciesArr.forEach(dep => {
        if(argv['only-consumers'] && dep !== name || !argv['only-consumers']){
          moduleConsumers.add(dep)
        }
      })
    }
  }
  return moduleConsumers
}

/**
* Resolves absolute paths from module names
* @param {array<string>} modules - A array of modules.
* @return {array<{module, absolutePath}>} A list of root paths and their associated modules
**/
const getAbsolutePackagePaths = async modules => {
  /** 
   * TODO: This could possibly be done during the getModuleConsumers() function
   * As the npm list command is already executed for directory?
   **/ 
  const moduleList = modules.join(' ')
  const {stdout} = await exec(`npm list ${moduleList} --json`)
  const {dependencies} = JSON.parse(stdout)
  return modules.map(module => {
    const path = dependencies[module].resolved
    // remove file:../../ from path
    const sanitisePath = path.slice(9)
    const absolutePath = resolve(sanitisePath)
    return {module, absolutePath}
  })
}

/**
* A sorting function comparing the root workspace module order with identifed modules order
* @param {array<string>} paths - A array of modules.
**/
function compareByPath(paths) {
  return (a, b) => {
    const aSortingIndex = paths.indexOf(a.absolutePath)
    const bSortingIndex = paths.indexOf(b.absolutePath)

    if (aSortingIndex > bSortingIndex) {
      return 1
    }
    if (aSortingIndex < bSortingIndex) {
      return -1
    }
    return 0
  }
}

/**
* Resolves absolute paths from module names
* @param {array<string>} modules - A array of modules.
* @return {array<{module, absolutePath}>} A list of root paths and their associated modules
**/
const orderModules = async packagesSet => {
  /** 
   *  packages need to be ordered for the build proccess
   *  TODO: possibly abstract getAbsolutePackagePaths()
   *  Due to clean code concepts (single responsability)
   * */
  
  const {workspaces} = require(`${process.cwd()}/package.json`)
  const absoluteWorkspacePaths = workspaces.map(workspace => {
    return resolve(workspace)
  })
  const packagesWithPaths = await getAbsolutePackagePaths([...packagesSet])
  
  packagesWithPaths.sort(compareByPath(absoluteWorkspacePaths))
  return packagesWithPaths
}

/**
* Runs a command on a list of applications
* @param {array<{module, absolutePath}>} apps - A array of modules and their paths.
* @param {object<{command, flags}>} command - A object containing the command and configuration to run the script.
* @return {array<object>} A list of applications with their output and statuses from the command ran
**/
const runCommand = (apps, {command, flags}) => {
  const promises = []

  for (const {module} of apps) {
    const promise = new Promise((resolve, reject) => {
      const child = fork(`${__dirname}/fork/index.cjs`)

      console.time(chalk.hex(statusColours.success)(`${module} - ${command} complete ✅`));
      child.send({message: 'start', command, flags, module})

      child.on('message', ({status, message}) => {
        if (status === 'success') {
          child.kill()
          console.timeEnd(chalk.hex(statusColours.success)(`${module} - ${command} complete ✅`));
          resolve({command, message, module, hasError: status === 'error'})
        } else if (status === 'error') {
          child.kill()
          reject(new Error(`${module} error: ${message}`))
        }
      })

      child.on(`error`, ({message}) => {
        child.kill()
        reject(new Error(`${module} error: ${message}`))
      })
    })
    promises.push(promise)
  }
  console.log(chalk.hex(statusColours.log)(`\nRunning ${command} on:`))
  console.table(apps, ['module'])

  return Promise.all(promises)
}

module.exports = {getFilesChanged, getModuleRootDirectories, getModuleConsumers, orderModules, runCommand}
