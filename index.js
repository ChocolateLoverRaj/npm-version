const core = require('@actions/core')
const github = require('@actions/github')
const { promises: { readFile }, existsSync } = require('fs')

const versions = ['major', 'minor', 'patch']

const version = core.getInput('version')
if (versions.includes(version)) {
    update()
} else {
    core.setFailed('Invalid version. Use either major, minor, or patch.')
}

async function update() {
    const emailSuffix = core.getInput('email_suffix')
    const email = `npm-version${emailSuffix}`
    core.startGroup('Check last commit')
    core.info('Checking the email of the last commit author to make sure this wasn\'t a self commit')
    const lastCommitEmail = github.context.payload.head_commit.author.email
    core.info(`Last commit author's email: ${lastCommitEmail}`)
    core.info(`This action's email: ${email}`)
    if (lastCommitEmail === email) {
        core.info(`This was a self activated commit`)
        core.endGroup()
        return
    } else {
        core.info(`This was someone elses commit`)
        core.endGroup()
    }

    core.startGroup('Update versions')
    async function updateVersion(file) {
        core.startGroup(`Update ${file} version`)
        core.info(`Read ${file}`)
        let packageJson
        try {
            packageJson = await readFile(file)
        } catch (e) {
            core.error(e)
            core.setFailed(`Error reading ${file}`)
            return
        }

        core.info(`Parse ${file}`)
        try {
            packageJson = JSON.parse(packageJson)
        } catch (e) {
            core.error(e)
            core.setFailed(`Error parsing ${file}`)
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
        core.endGroup()
        return JSON.stringify(packageJson, undefined, 2)
    }
    const packageJson = await updateVersion('package.json')
    core.startGroup('Look for package-lock.json')
    let packageLock
    if (existsSync('package-lock.json')) {
        core.info('package-lock.json exists')
        core.endGroup()
        packageLock = await updateVersion('package-lock.json')
    } else {
        core.info('Couldn\'t find package-lock.json')
        core.info('Skipping package-lock.json')
        core.endGroup()
        packageLock = false
    }
    core.endGroup()

    const octokit = github.getOctokit(core.getInput('token'))
    async function createBlob(content, file) {
        core.startGroup(`Create blob for ${file}`)
        try {
            const blob = await octokit.git.createBlob({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                content: content,
                encoding: 'utf-8'
            })
            return blob.data.sha
        } catch (e) {
            core.error(e)
            core.setFailed(`Error creating blob for ${file}`)
        }
        core.endGroup()
    }
    core.startGroup('Create blobs')
    const packageJsonSha = await createBlob(packageJson, 'package.json')
    if (!packageJsonSha) {
        return
    }
    let packageLockSha
    if (packageLock) {
        packageLockSha = await createBlob(packageLock, 'package-lock.json')
        if (!packageLockSha) {
            return
        }
    }
    core.endGroup()

    core.startGroup('Create tree')
    try {
        const tree = await octokit.git.createTree({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            tree: [
                {
                    path: 'package.json',
                    sha: packageJsonSha,
                    mode: '100644'
                },
                ...packageLock ? {
                    path: 'package-lock.json',
                    sha: packageLockSha
                } : []
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
    core.endGroup()
}
