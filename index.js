const core = require('@actions/core')
const github = require('@actions/github')
const { readFile } = require('fs').promises

const versions = ['major', 'minor', 'patch']

const version = core.getInput('version')
if (versions.includes(version)) {
    core.info('Updating package version')
    update().then(version => {
        core.info(`Updated package version to ${version}`)
    })
} else {
    core.setFailed('Invalid version. Use either major, minor, or patch.')
}

const update = async () => {
    core.info('Read package.json')
    let packageJson
    try {
        packageJson = await readFile('package.json')
    } catch (e) {
        core.error(e)
        core.setFailed('Error reading package.json')
        return
    }
    core.info('Parse package.json')
    try {
        packageJson = JSON.parse(packageJson)
    } catch (e) {
        core.error(e)
        core.setFailed('Error reading package.json')
    }
    core.info(packageJson)
}
