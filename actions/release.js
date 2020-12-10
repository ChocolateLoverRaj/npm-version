const core = require('@actions/core')
const { promises: { readFile } } = require('fs')

module.exports = async ({ octokit, github }) => {
    core.info('Read package.json')
    const packageJsonRaw = await readFile('package.json')
    core.info('Parse package.json')
    const packageJson = JSON.parse(packageJsonRaw)
    const version = packageJson.version
    core.info(`Release version: ${version}`)
    await octokit.repos.createRelease({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        tag_name: version,
        target_commitish: github.context.payload.repository.default_branch
    })
}
