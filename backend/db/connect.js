const mongoose = require('mongoose')

/*
 * 函数名：connectDB
 * 函数功能：连接并返回对象
 */
const connectDB = url => {
  console.log(process.env)
  return mongoose.connect(url)
}

module.exports = connectDB
