const publish = require('../actions/publish')
const core = require('@actions/core')
const github = require('@actions/github')
const octokit = github.getOctokit(core.getInput('token'))

publish({
    github: github,
    octokit: octokit,
    getInput: core.getInput
})
