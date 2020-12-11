const core = require('@actions/core')
const { exec } = require('child_process')
const { createInterface } = require('readline')

const shasumText = 'npm notice shasum:'

core.info('Running npm publish --access public --dry-run')
const publish = exec('npm publish --access publish --dry-run')
const publishOutput = createInterface({ input: publish.stdout })
let shasum
publishOutput.on('line', line => {
    if (line.startsWith(shasumText)) {
        shasum = line.slice(shasumText.length).trim()
        core.info(`Package shasum: ${shasum}`)
    }
})
publish.on('exit', code => {
    if (!code) {

    } else {
        core.error('Error getting shasum')
    }
})
