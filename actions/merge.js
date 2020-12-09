// Merges branches
module.exports = async ({ github, octokit, getInput }) => {
    const bases = getInput('bases').split(',')
    const head = getInput('head') || github.context.payload.repository.default_branch

    await Promise.all(bases.map(async base => {
        await octokit.repos.merge({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            base: base,
            head: head
        })
    }))
}
