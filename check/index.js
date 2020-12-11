const core = require('@actions/core')
const { exec } = require('child_process')
const { createInterface } = require('readline')
const { get } = require('https')

const shasumText = 'npm notice shasum:'
const nameText = 'npm notice name:'

core.info('Running npm publish --access public --dry-run')
const publish = exec('npm publish --access public --dry-run')
const publishOutput = createInterface({ input: publish.stderr })
let shasum
let name
publishOutput.on('line', line => {
    if (line.startsWith(shasumText)) {
        shasum = line.slice(shasumText.length).trim()
        core.info(`Package shasum: ${shasum}`)
    } else if (line.startsWith(nameText)) {
        name = line.slice(nameText.length).trim()
        core.info(`Package name: ${name}`)
    }
})
publish.on('exit', code => {
    if (!code) {
        core.info('Fetching latest shasum from npm registry')
        get(`registry.npmjs.org/${name}/latest`).once('response', res => {
            let json = ''
            res.on('data', chunk => {
                json += chunk
            })
            res.on('end', () => {
                core.info('Parsing json')
                try {
                    json = JSON.parse(json)
                } catch (e) {
                    core.setFailed('Error parsing json')
                }
                core.info(`Latest shasum: ${json.dist.shasum}`)
            })
        })
    } else {
        core.setFailed('Error getting shasum')
    }
})
