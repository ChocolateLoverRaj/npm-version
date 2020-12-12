const core = require('@actions/core')
const github = require('@actions/github')
const { Validator } = require('jsonschema')
const { promises: { readFile } } = require('fs')

const start = async () => {
    const jsonPath = core.getInput('options')
    core.info(`Reading json file: ${jsonPath}`)
    const jsonRaw = await readFile(jsonPath)
    core.info('Parsing json')
    const json = JSON.parse(jsonRaw)
    core.info('Validating json')
    const v = new Validator()
    v.validate(json, {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                file: {
                    type: 'string'
                }
            },
            required: ['file']
        }
    }, { throwAll: true })
    core.info(`Checking ${json.length} files`)
    await Promise.all(json.map(async ({ file }) => {
        core.info(`Fetching current file: ${file}`)
        console.log(github.context.payload)
    }))
}

start().catch(e => {
    console.error(e.stack)
    process.exit(1)
})
