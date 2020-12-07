const core = require('@actions/core')
const { exec } = require('child_process')
const fs = require('fs')

const versions = ['major', 'minor', 'patch']

const version = core.getInput('version')
if (versions.includes(version)) {
    const command = `npm version ${version}`
    core.info(`Running command: ${command}`)
    exec(command).once('exit', code => {
        if (!code) {
            core.info(JSON.parse(fs.readFileSync('package.json')))
        } else {
            core.setFailed(`Command exited with code: ${code}`)
        }
    })

} else {
    core.setFailed('Invalid version. Use either major, minor, or patch.')
}
