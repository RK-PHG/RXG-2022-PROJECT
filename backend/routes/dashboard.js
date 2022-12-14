const express = require("express");
const router = express.Router();

const {
  GetMessage,
  SearchRepoName,
  GetDashboard,
  DeleteRepo,
  UpdateRepo,
} = require("../controllers/dash");
const { CheckUser, CreateUser } = require("../controllers/user");

router.route("/import").post(GetMessage);             // 导入仓库
router.route("/login").post(CheckUser);               // 登录验证

router.route("/register").post(CreateUser);           // 注册
router.route("/search").post(SearchRepoName);         // 搜索仓库
router.route("/dashboard").post(GetDashboard);        // 仓库详细数据
router.route("/delete").post(DeleteRepo);             // 删除仓库
router.route("/update").post(UpdateRepo);             // 更新仓库数据

module.exports = router;
