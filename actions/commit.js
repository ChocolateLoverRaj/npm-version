const globber = require('@actions/glob')
const { promises: { readFile } } = require('fs')

module.exports = async ({ github, octokit, getInput }) => {
    const branch = getInput('branch') || github.context.ref.slice(11)
    const lastCommit = await octokit.git.getRef({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        ref: branch
    })
    const lastTree = await octokit.git.getCommit({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        commit_sha: lastCommit.data.sha
    })
    const glob = await globber.create(getInput('files'))
    const files = await glob.glob()
    const blobs = await Promise.all(files.map(async file => {
        const blob = await octokit.git.createBlob({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            content: readFile(file, 'base64')
        })
        return [file, blob.data.sha]
    }))
    const tree = await octokit.git.createTree({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        tree: blobs.map(([file, blob]) => ({
            path: file,
            mode: '100644',
            sha: blob
        })),
        base_tree: lastTree.data.sha
    })
    const commit = await octokit.git.createCommit({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        message: getInput('message'),
        tree: tree.data.sha,
        parents: [lastCommit.data.sha],
        author: {
            name: getInput('author') || 'npm-version/commit',
            email: getInput('email') || 'npm-version/commit[bot]'
        }
    })
    await octokit.git.updateRef({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        ref: branch,
        sha: commit.data.sha
    })
}