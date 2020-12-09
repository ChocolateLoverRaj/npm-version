const core = require('@actions/core')
const { exec } = require('child_process')

const runCommand = name => new Promise((resolve, reject) => {
    const command = exec(name)
    let err = ''
    command.stdout.on('data', data => {
        err += data
    })
    command.stderr.on('data', data => {
        err += data
    })
    command.on('exit', code => {
        if (!code) {
            resolve()
        } else {
            reject(new Error(err))
        }
    })
})

module.exports = async () => {
    core.info('check .npmrc')
    console.log(await require('fs').promises.readFile('.npmrc'))
    core.info('Login to npm')
    //await runCommand('npm login')
    core.info('Publish package')
    await runCommand('npm publish')
}
