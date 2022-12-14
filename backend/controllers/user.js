const user = require("../models/user");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/custom-error");

const CheckUser = asyncWrapper(async (req, res, next) => {                  // 登录认证
  const OldUser = await user.findOne({ email: req.body.email });            // 查询用户是否存在
  console.log(req.body);
  if (!OldUser) {
    return next(createCustomError(`Email is not registered`, 404));         // 尚未注册
  } else if (OldUser.password == req.body.password) {                       // 登陆成功
    return res.status(200).json({
      name: OldUser.username,
    });
  } else {
    return next(createCustomError(`Wrong password`, 404));                  // 密码错误
  }
});

const CreateUser = asyncWrapper(async (req, res, next) => {                 // 创建用户
  try {
    const user_name = await user.findOne({ username: req.body.username }); 
    const user_email = await user.findOne({ email: req.body.email });
    if (!user_name && !user_email) {                                        // 可创建
      const new_user = await user.create(req.body);                         // 存表
      res.status(201).json({
        name: new_user.username,
      });
    } else return next(createCustomError(`User already exists`, 404));      // 邮箱已注册或用户名已存在
  } catch (err) {
    console.log(err);
    res.status(404).json(err);
  }
});

module.exports = {
  CheckUser,
  CreateUser,
};
