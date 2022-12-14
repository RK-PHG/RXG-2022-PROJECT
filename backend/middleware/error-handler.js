const { CustomAPIError } = require('../errors/custom-error')


const errorHandlerMiddleware = (err, req, res, next) => {            // 自定义错误处理
    if (err instanceof CustomAPIError) {
        return res.status(err.statusCode).json({ msg: err.message })
    }
    return res.status(err.status).json({ msg: err.message })
}

module.exports = errorHandlerMiddleware