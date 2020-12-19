const handle = require('../lib/handle')
const core = require('@actions/core')
const github = require('@actions/github')
const { promises: { readFile, writeFile, access }, constants } = require('fs')

handle(async () => {
    const packageLock = await (async () => {
        try {
            access('package-lock.json', constants.R_OK | constants.W_OK)
        } catch {
            return false
        }
        return true
    })()

    const packageJson = JSON.parse(await readFile('package.json'))
    const versions = ['major', 'minor', 'patch']
    const version = core.getInput('version') || github.context.ref.slice(12)
    const semver = packageJson.version.split('.')
    const versionPosition = versions.indexOf(version)
    semver[versionPosition] = parseInt(semver[versionPosition]) + 1
    for (let i = versionPosition + 1; i < versions.length; i++) {
        semver[i] = '0'
    }
    const newVersion = semver.join('.')
    packageJson.version = newVersion
    const packageJsonStr = JSON.stringify(packageJson, undefined, 2)
    await writeFile('package.json', packageJsonStr)

    let packageLockStr
    if (packageLock) {
        const packageLockJson = JSON.parse(await readFile('package-lock.json'))
        packageLockJson.version = newVersion
        packageLockStr = JSON.stringify(packageLockJson, undefined, 2)
        await writeFile('package-lock.json', packageLockStr)
    }

    const octokit = github.getOctokit(core.getInput('token'))
    const createBlob = async content => {
        const blob = await octokit.git.createBlob({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            content: content,
            encoding: 'utf-8'
        })
        return blob.data.sha
    }
    const packageJsonSha = await createBlob(packageJsonStr, 'package.json')
    if (!packageJsonSha) {
        return
    }
    let packageLockSha
    if (packageLock) {
        packageLockSha = await createBlob(packageLockStr, 'package-lock.json')
        if (!packageLockSha) {
            return
        }
    }

    const files = [{
        path: 'package.json',
        sha: packageJsonSha,
        mode: '100644'
    }]
    if (packageLock) {
        files.push({
            path: 'package-lock.json',
            sha: packageLockSha,
            mode: '100644'
        })
    }
    const tree = await octokit.git.createTree({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        tree: files,
        base_tree: github.context.payload.head_commit.tree_id
    })
    const treeSha = tree.data.sha

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
    const commitSha = commit.data.sha

    await octokit.git.updateRef({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        ref: github.context.ref.slice(5),
        sha: commitSha
    })

    await octokit.repos.merge({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        base: github.context.payload.repository.default_branch,
        head: commitSha
    })
})
