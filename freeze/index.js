const schema = require('./schema.json')
const core = require('@actions/core')
const github = require('@actions/github')
const { Validator } = require('jsonschema')
const toString = require('stream-to-string')
const { promises: { readFile } } = require('fs')
const { get } = require('https')
const { deepStrictEqual } = require('assert')

const getRaw = async path => await new Promise((resolve, reject) => {
    get(`https://raw.githubusercontent.com/${github.context.repo.owner}/${github.context.repo.repo}/${github.context.payload.pull_request.base.ref}/${path}`, res => {
        if (res.statusCode === 200) {
            resolve(toString(res))
        } else if (res.statusCode === 404) {
            resolve(null)
        } else {
            reject(`Unknown status code: ${res.statusCode}`)
        }
    })
})

const checkFreeze = (previousJson, json, freeze) => {
    if (typeof freeze === 'object') {
        for (const k in freeze) {
            checkFreeze(previousJson[k], json[k], freeze[k])
        }
    } else {
        deepStrictEqual(json, previousJson)
    }
}

const start = async () => {
    const jsonPath = core.getInput('options')
    core.info(`Reading json file: ${jsonPath}`)
    const jsonRaw = await readFile(jsonPath, 'utf8')
    core.info('Parsing json')
    const json = JSON.parse(jsonRaw)
    core.info('Checking previous json file')
    const previousJson = await getRaw(jsonPath)
    if (previousJson !== null && previousJson !== jsonRaw) {
        throw new Error('Json file was modified. Ignore this check if this change was intended.')
    }
    core.info('Validating json')
    const v = new Validator()
    v.validate(json, schema, { throwAll: true })
    core.info(`Checking ${json.files.length} files`)
    await Promise.all(json.files.map(async ({ file, freeze }) => {
        const previousJson = JSON.parse(await getRaw(file))
        if (previousJson === null) {
            throw new Error(`File: ${file} does not exist in base.`)
        }
        const json = JSON.parse(await readFile(file))
        checkFreeze(previousJson, json, freeze)
    }))
}

start().catch(e => {
    console.error(e.stack || e)
    process.exit(1)
})
