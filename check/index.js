const core = require('@actions/core')
const github = require('@actions/github')
const { exec } = require('child_process')
const { createInterface } = require('readline')
const { get } = require('https')

const shasumText = 'npm notice shasum:'
const nameText = 'npm notice name:'

const sameInput = core.getInput('same')
const same = sameInput
    ? sameInput === 'true'
    : github.context.payload.pull_request.base.ref === 'main'
console.log('Running npm publish --access public --dry-run')
const publish = exec('npm publish --access public --dry-run')
const publishOutput = createInterface({ input: publish.stderr })
let shasum
let name
publishOutput.on('line', line => {
    console.log(line)
    if (line.startsWith(shasumText)) {
        shasum = line.slice(shasumText.length).trim()
        console.log(`Package shasum: ${shasum}`)
    } else if (line.startsWith(nameText)) {
        name = line.slice(nameText.length).trim()
        console.log(`Package name: ${name}`)
    }
})
publish.on('exit', code => {
    if (!code) {
        console.log('Fetching latest shasum from npm registry')
        get(`https://registry.npmjs.org/${name}/latest`).once('response', res => {
            let json = ''
            res.on('data', chunk => {
                json += chunk
            })
            res.on('end', () => {
                console.log('Parsing json')
                try {
                    json = JSON.parse(json)
                } catch (e) {
                    core.setFailed('Error parsing json')
                }
                console.log(`Latest shasum: ${json.dist.shasum}`)
                const isSame = shasum === json.dist.shasum
                if (same && !isSame) {
                    core.setFailed('Expected npm package to be same, but it\'s not.')
                } else if (!same && isSame) {
                    core.setFailed('Expected npm package to be different, but it\'s not.')
                }
            })
        })
    } else {
        core.setFailed('Error getting shasum')
    }
})
