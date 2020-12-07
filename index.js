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

async function update() {
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
    core.info(`Old version: ${packageJson.version}`)
    const semver = packageJson.version.split('.')
    const versionPosition = versions.indexOf(version)
    semver[versionPosition] = parseInt(semver[versionPosition]) + 1
    for (let i = versionPosition + 1; i < versions.length; i++) {
        semver[i] = '0'
    }
    core.info(`New version: ${semver.join('.')}`)
}
