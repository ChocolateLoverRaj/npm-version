const core = require('@actions/core')
const { exec } = require('child_process')

const version = core.getInput('version')

console.log(version)