const handle = require('../lib/handle')
const { getInput } = require('@actions/core')
const github = require('@actions/github')
const { promises: { readFile } } = require('fs')

handle(async () => {
    const octokit = github.getOctokit(getInput('token'))
    console.log('Read package.json')
    const packageJsonRaw = await readFile('package.json')
    console.log('Parse package.json')
    const packageJson = JSON.parse(packageJsonRaw)
    const version = packageJson.version
    console.log(`Release version: ${version}`)
    await octokit.repos.createRelease({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        tag_name: version,
        target_commitish: github.context.payload.repository.default_branch
    })
})
