const core = require('@actions/core')
const { exec } = require('child_process')

core.info('Running npm publish --access public --dry-run')
const publish = exec('npm publish --access publish --dry-run')
publish.stdout.pipe(process.stdout)
publish.stderr.pipe(process.stderr)
