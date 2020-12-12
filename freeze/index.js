const core = require('@actions/core')
const { Validator } = require('jsonschema')
const { promises: { readFile } } = require('fs')

const start = async () => {
    const jsonPath = core.getInput('json')
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
    })
    core.info(`Validating ${v.length} files`)
    await Promise.all(json.map(async ({ file }) => {
        core.info(`file: ${file}`)
    }))
}

start().catch(e => {
    console.error(e.stack)
    process.exit(1)
})
