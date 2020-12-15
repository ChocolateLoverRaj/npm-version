const commit = require('../actions/commit')
const core = require('@actions/core')
const github = require('@actions/github')
const octokit = github.getOctokit(core.getInput('token'))

commit({
    github: github,
    octokit: octokit,
    getInput: core.getInput
})
