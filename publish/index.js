const publish = require('../actions/publish')

publish().catch(e => {
    console.error(e.stack || e)
    process.exit(1)
})
