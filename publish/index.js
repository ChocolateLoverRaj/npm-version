const handle = require('../lib/handle')
const { exec } = require('child_process')
const { promises: { writeFile } } = require('fs')

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

handle(async () => {
    console.log('Create .npmrc')
    await writeFile('.npmrc', '//registry.npmjs.org/:_authToken=${NPM_TOKEN}')
    console.log('Publish package')
    await runCommand('npm publish --access public')
})
