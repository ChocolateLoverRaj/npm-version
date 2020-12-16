const globber = require('@actions/glob')
const { promises: { readFile } } = require('fs')
const { relative } = require('path')

module.exports = async ({ github, octokit, getInput }) => {
    const branchInput = getInput('branch')
    const branch = branchInput
        ? `heads/${branchInput}`
        : github.context.ref.slice(5)
    const lastRef = await octokit.git.getRef({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        ref: branch
    })
    const lastCommit = await octokit.git.getCommit({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        commit_sha: lastRef.data.object.sha
    })
    let lastTree
    const glob = await globber.create(getInput('files'))
    const files = await glob.glob()
    if (getInput('empty') === 'false') {
        const recursive = files.find((path => /\/\\/.test(path))) !== undefined
        lastTree = await octokit.git.getTree({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            tree_sha: lastCommit.data.tree.sha,
            recursive: recursive
        })
    }
    const blobs = (await Promise.all(files.map(async file => {
        const blob = await octokit.git.createBlob({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            content: await readFile(file, 'base64'),
            encoding: 'base64'
        })
        return [relative(process.cwd(), file), blob.data.sha]
    }))).filter(([file, sha]) => {
        const previousFile = lastTree.data.tree.find(({ path }) => path === file)
        console.log(file, sha, previousFile)
    })
    const tree = await octokit.git.createTree({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        tree: blobs.map(([file, blob]) => ({
            path: file,
            mode: '100644',
            sha: blob
        })),
        base_tree: lastCommit.data.tree.sha
    })
    const commit = await octokit.git.createCommit({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        message: getInput('message'),
        tree: tree.data.sha,
        parents: [lastRef.data.object.sha],
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