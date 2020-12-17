const { exec } = require('child_process')
const { readFileSync } = require('fs')

const dependencies = JSON.parse(readFileSync())
const install = exec('npm ci', { cwd: __dirname })
    .once('exit', code => {
        process.exit(code)
    })

install.stdout.pipe(process.stdout)
install.stderr.pipe(process.stderr)
