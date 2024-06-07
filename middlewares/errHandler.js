const sttCode = require('../enum/statusCode')
const notFound = (req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`)
    res.status(sttCode.NotFound)
    next(error)
}
const errHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === sttCode.Ok ? sttCode.ServerError : res.statusCode
    return res.status(statusCode).json({
        success: false,
        mes: err?.message
    })

}
module.exports = {
    notFound,
    errHandler,
}