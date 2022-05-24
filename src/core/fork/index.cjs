/* eslint-disable @typescript-eslint/no-var-requires */
const util = require('util')
const chalk = require('chalk')
const exec = util.promisify(require('child_process').exec)

/**
 * Executes commands on the child proccess, handelling success and error states.
 * @param {object} command - The details require to create the script to run on the child process
 */
const runChildCommand = async ({command, flags, module}) => {
  try {
    const {stdout} = await exec(`npm run ${command} -w ${module} --if-present --color=always ${flags}`)

    if (!stdout) {
      process.send({status: 'warning', message: `No output recieved from ${command} ⚠️`})
    }

    process.send({status: 'success', message: stdout})
  } catch (error) {
    process.send({ status: 'error', message:`${error.stdout}${error.stderr}`})
  }
}

process.on('message', ({message, ...otherArgs}) => {
  if (message === 'start') {
    runChildCommand(otherArgs)
  }
})