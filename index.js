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

    let newVersion
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
        newVersion = semver.join('.')
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
            core.info(`Blob sha: ${blob.data.sha}`)
            return blob.data.sha
        } catch (e) {
            core.error(e)
            core.setFailed(`Error creating blob for ${file}`)
        }
        core.endGroup()
    }
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

    core.startGroup('Create tree')
    let treeSha
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
        treeSha = tree.data.sha
    } catch (e) {
        core.error(e)
        core.setFailed('Error creating tree')
        return
    }
    core.info(`Tree sha: ${treeSha}`)
    core.endGroup()

    core.startGroup('Create commit')
    let commitSha
    try {
        const commit = await octokit.git.createCommit({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            message: newVersion,
            tree: treeSha,
            parents: [github.context.payload.head_commit.id],
            author: {
                name: 'npm-version',
                email: email
            }
        })
        commitSha = commit.data.sha
    } catch (e) {
        core.error(e)
        core.setFailed('Error creating commit')
        return
    }
    core.info(`Commit sha: ${commitSha}`)
    core.endGroup()

    core.startGroup('Update ref')
    try {
        await octokit.git.updateRef({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            ref: github.context.ref.slice(5),
            sha: commitSha
        })
    } catch (e) {
        core.error(e)
        core.setFailed('Error updating ref')
        return
    }
    core.endGroup()

    core.startGroup('Merge into default branch')
    try {
        await octokit.repos.merge({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            base: github.context.payload.repository.default_branch,
            head: commitSha
        })
    } catch (e) {
        core.error(e)
        core.setFailed('Error merging branch')
        return
    }
    core.endGroup()
}
