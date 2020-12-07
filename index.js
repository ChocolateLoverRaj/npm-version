const core = require('@actions/core')
const github = require('@actions/github')
const { readFile } = require('fs').promises

const versions = ['major', 'minor', 'patch']

const version = core.getInput('version')
if (versions.includes(version)) {
    core.info('Updating package version')
    update()
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
    const newVersion = semver.join('.')
    core.info(`New version: ${newVersion}`)
    packageJson.version = newVersion

    core.info('Create new package.json')
    const octokit = github.getOctokit(core.getInput('token'))
    let sha
    try {
        const blob = await octokit.git.createBlob({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            content: JSON.stringify(packageJson, undefined, 2),
            encoding: 'utf-8'
        })
        sha = blob.data.sha
    } catch (e) {
        core.error(e)
        core.setFailed('Error creating blob')
        return
    }

    core.info('Create a new tree')
    try {
        const tree = await octokit.git.createTree({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            tree: [
                {
                    path: 'package.json',
                    sha: sha,
                    mode: '100644'
                }
            ],
            base_tree: github.context.payload.head_commit.tree_id
        })
        sha = tree.data.sha
    } catch (e) {
        core.error(e)
        core.setFailed('Error creating tree')
        return
    }
    core.info(sha)
    console.log(github.context.payload)
}
