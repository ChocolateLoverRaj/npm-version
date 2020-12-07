const { exec } = require('child_process')

const install = exec('npm ci')
    .once('exit', code => {
        console.log('Mission failed')
        process.exit(code)
    })

install.stdout.pipe(process.stdout)
install.stderr.pipe(process.stderr)
