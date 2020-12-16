const { exec } = require('child_process')

module.exports = ({ getInput }) => new Promise((resolve, reject) => {
    const command = exec(getInput('command'))
    command.stdout.pipe(process.stdout, { end: false })
    command.stderr.pipe(process.stderr, { end: false })
    command.once('exit', code => {
        if (!code) {
            resolve()
        } else {
            reject(new Error(`Command exited with code: ${code}`))
        }
    })
})
