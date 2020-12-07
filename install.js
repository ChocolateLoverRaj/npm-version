const { exec } = require('child_process')

exec('npm ci')
    .once('exit', code => {
        process.exit(code)
    })
