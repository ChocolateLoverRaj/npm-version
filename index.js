const core = require('@actions/core')
const { exec } = require('child_process')

const versions = ['major', 'minor', 'patch']

const version = core.getInput('version')
if (!versions.includes(version)) {
    core.setFailed('Invalid version. Use either major, minor, or patch.')
}
console.log('this ran')
