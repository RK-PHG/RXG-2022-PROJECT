const express = require('express')
const cors = require('cors')
const xss = require('xss-clean')
const helmet = require('helmet')

const dashboar = require('./routes/dashboard')
const connectDB = require('./db/connect')
const notFound = require('./middleware/notfound')
const errorHandlerMiddleware = require('./middleware/error-handler')

const app = express()

require('dotenv').config()

app.use(xss())                                                    // xss消毒
app.use(cors())                                                   // 跨域
app.use(helmet())                                                 // 解决多种安全问题
app.use(express.json())                                           // 解析JSON

app.use('/', dashboar)                                            // 路由

app.use(notFound)                                                 // 不存在的页面
app.use(errorHandlerMiddleware)                                   // 错误处理

const port = process.env.PORT || 4538

const start = async () => {
  try {
    await connectDB('mongodb://127.0.0.1:27017/myTest')           // 连接数据库
    app.listen(port, console.log(`server is listening on port ${port}...`))     // 开启监听
  } catch (error) {
    console.log(error)
  }
}

start()                                                             // 启动
