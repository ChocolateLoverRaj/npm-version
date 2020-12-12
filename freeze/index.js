const core = require('@actions/core')
const github = require('@actions/github')
const { Octokit } = require('@octokit/rest')
const { Validator } = require('jsonschema')
const { promises: { readFile } } = require('fs')

const start = async () => {
    const token = core.getInput('token')
    let octokit
    if (token) {
        core.info('Getting octokit with token')
        octokit = github.getOctokit(token)
    } else {
        core.info('Getting octokit without token')
        octokit = new Octokit()
    }
    const jsonPath = core.getInput('options')
    core.info(`Reading json file: ${jsonPath}`)
    const jsonRaw = await readFile(jsonPath)
    core.info('Parsing json')
    const json = JSON.parse(jsonRaw)
    core.info('Checking previous json file')
    const previousJson = await octokit.repos.getContent({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        path: jsonPath,
        ref: github.context.payload.pull_request.base.ref
    })
    console.log(previousJson.data)
    core.info('Validating json')
    const v = new Validator()
    v.validate(json, {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                file: {
                    type: 'string'
                }
            },
            required: ['file']
        }
    }, { throwAll: true })
    core.info(`Checking ${json.length} files`)
    await Promise.all(json.map(async ({ file }) => {
        core.info(`Fetching current file: ${file}`)
        console.log(github.context.payload)
    }))
}

start().catch(e => {
    console.error(e.stack)
    process.exit(1)
})
