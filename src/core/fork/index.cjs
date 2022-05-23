/* eslint-disable @typescript-eslint/no-var-requires */
const util = require('util')
const chalk = require('chalk')
const exec = util.promisify(require('child_process').exec)

const handleError = ({stderr}, command) => {
  if (stderr) {
      process.send({status: 'error', message: stderr})
  }
}

const runChildCommand = async ({command, flags, module}) => {
  try {
    const {stdout} = await exec(`npm run ${command} -w ${module} --if-present ${flags}`)

    if (!stdout) {
      process.send({status: 'warning', message: `No output recieved from ${command} ⚠️`})
    }

    process.send({status: 'success', message: stdout})
  } catch (error) {
    handleError(error, command)
  }
}

process.on('message', ({message, ...otherArgs}) => {
  if (message === 'start') {
    runChildCommand(otherArgs)
  }
})