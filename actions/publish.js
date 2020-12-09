const core = require('@actions/core')
const { exec } = require('child_process')

module.exports = () => new Promise((resolve, reject) => {
    console.log('Publishing package')
    const publish = exec('npm publish')
    let err = ''
    publish.stdout.on('data', data => {
        err += data
    })
    publish.stderr.on('data', data => {
        err += data
    })
    publish.on('exit', code => {
        if (!code) {
            core.info('Successfully published package')
            resolve()
        } else {
            core.error(err)
            core.error('Error publishing')
            reject(new Error(err))
        }
    })
})
