const { exec } = require('child_process')

const install = exec('npm ci')
    .once('exit', code => {
        process.exit(code)
    })

install.stdout.pipe(process.stdout)
