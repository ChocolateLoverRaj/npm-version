const { exec } = require('child_process')
const { readFileSync } = require('fs')
const { join } = require('path')

const dependencies = JSON.parse(readFileSync(join(require.main.path, 'dependencies.json')))
const install = exec(`npm i ${dependencies.join(' ')}`, { cwd: __dirname })
    .once('exit', code => {
        process.exit(code)
    })
install.stdout.pipe(process.stdout)
install.stderr.pipe(process.stderr)
