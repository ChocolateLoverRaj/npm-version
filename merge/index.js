const merge = require('../actions/merge')
const core = require('@actions/core')
const github = require('@actions/github')
const octokit = github.getOctokit(core.getInput('token'))

merge({
    github: github,
    octokit: octokit,
    getInput: core.getInput
})
