// Catches async errors in Express.js route handlers
export function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(err => next(err))
    }
}