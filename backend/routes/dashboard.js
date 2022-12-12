const express = require("express");
const router = express.Router();

const {
  GetMessage,
  SearchRepoName,
  GetDashboard,
  DeleteRepo,
} = require("../controllers/dash");
const { CheckUser, CreateUser } = require("../controllers/user");

router.route("/import").post(GetMessage);
router.route("/login").post(CheckUser);
router.route("/register").post(CreateUser);
router.route("/search").post(SearchRepoName);
router.route("/dashboard").post(GetDashboard);
router.route("/delete").post(DeleteRepo);

module.exports = router;
