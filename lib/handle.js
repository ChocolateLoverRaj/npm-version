module.exports = fn => {
    const promise = fn()
    if ('catch' in promise) {
        promise.catch(e => {
            console.error(e.stack || e)
            process.exit(1)
        })
    }
}
