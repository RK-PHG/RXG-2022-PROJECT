const RepoSchema = require("../models/repo");  // database shcema
const ObjectId = require("mongodb").ObjectId;  // Objected Id
const { Octokit } = require("@octokit/core");  // GitHub API
const res = require("express/lib/response");
const {
  RepoGetPullRequests,
  RepoGetCommitFrequency,
  RepoGetContributors,
  RepoGetIssueFrequency,
  RepoGetLanguage,
  RepoGetReleaseTime
 }  = require("./dash/index")

const octokit = new Octokit({
  auth: `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`,    // github token
});


const AddRepo = async (owner, repo, user)=>{
  console.log("Getting Message...");
  var newRepo = {}
  try {
    const repoMessage = await octokit.request("GET /repos/{owner}/{repo}", {      // 获取仓库基本数据
      owner: owner,                                       // 仓库所有者
      repo: repo,                                         // 仓库名
    });
    newRepo = {                                           // 获得各项详细数据
      base: repoMessage,      
      name: repoMessage.data.name,            
      owner: repoMessage.data.owner.login,           
      uploader: user,                                     // doublec请求者用户名
      forks: repoMessage.data.forks,
      stars: repoMessage.data.watchers,
      open_issues: repoMessage.data.open_issues,
      commit_frequency: await RepoGetCommitFrequency(     // 各时段commit信息
        repoMessage.data.owner.login,
        repoMessage.data.name,
        octokit
      ),
      issue_frequency: await RepoGetIssueFrequency(       // 各时段issue信息
        repoMessage.data.owner.login,
        repoMessage.data.name,
        octokit
      ),
      contributors: await RepoGetContributors(            // 仓库贡献者
        repoMessage.data.owner.login,
        repoMessage.data.name,
        octokit
      ),
      timeline: {                                         // 仓库事件时间线
        created_at: repoMessage.data.created_at,
        updated_at: repoMessage.data.updated_at,
        pushed_at: repoMessage.data.pushed_at,
        recent_released_at: await RepoGetReleaseTime(
          repoMessage.data.owner.login,
          repoMessage.data.name,
          octokit
        ),
      },
      language: await RepoGetLanguage(                    // 仓库代码语言详情
        repoMessage.data.owner.login,
        repoMessage.data.name,
        octokit
      ),
      pull_requests: await RepoGetPullRequests(           
        repoMessage.data.owner.login,
        repoMessage.data.name,
        octokit
      ),
    };
  } catch (err) {
    console.log(err);
  }
  return newRepo;
}


const GetMessage = async (req, res) => {
  console.log("Getting Message...");
  try {
    const newRepo = await AddRepo(req.body.owner,req.body.repoName,req.body.user);        // 获取仓库数据
    console.log(newRepo);
    // console.log(newRepo);
    await RepoSchema.create(newRepo);                                                     // 存在本地
    res.status(201).json({ status: "success!" });
  } catch (err) {
    console.log(err);
    res.status(404).json(err);
  }
};


const SearchRepoName = async (req, res) => {
  try {
    const SearchKey = req.body.search.trim();
    if (SearchKey == "") {
      var search = await RepoSchema.find({});           // 空值搜索时，返回所有结果
    } else
      search = await RepoSchema.find({                  // 搜索
        name: { $regex: SearchKey, $options: "$i" },
      });
    var repos = [];                                     // 存放搜索结果
    for (var i in search) {                             // 解析获取的数据
      var eachRepo = {
        _id: search[i]._id.toString(),
        name: search[i].name,
        owner: search[i].owner,
        stars: search[i].stars,
        uploader: search[i].uploader,
        uploaded_time: search[i]._id.getTimestamp(),
      };
      repos.push(eachRepo);                            // 存入对象中
    }
    console.log(repos);

    return res.status(201).json({ repos });
  } catch (err) {
    res.status(404).json(err);
  }
};

const GetDashboard = async (req, res,octokit) => {            // 从数据库中获取仓库数据
  try {
    const detail = await RepoSchema.findOne({ _id: ObjectId(req.body.id) });    // 查
    res.status(201).json({ detail });
  } catch (err) {
    res.status(404).json(err);
  }
};

const DeleteRepo = async (req, res) => {                                        // 将仓库数据从数据库中删除
  try {
    const test = await RepoSchema.deleteOne({ _id: ObjectId(req.body.id) });    // 删
    res.status(201).json({ msg: "success!" });
  } catch (err) {
    res.status(404).json(err);
  }
};

const UpdateRepo = async (req,res)=>{                                           // 更新数据库中仓库的数据
  try {
    var oldinfo = await RepoSchema.findOne({ _id: ObjectId(req.body.id) },{name:1,owner:1,uploader:1});
    const newRepo = await AddRepo(oldinfo.owner,oldinfo.name,oldinfo.uploader);
    RepoSchema.findOneAndReplace({ _id: ObjectId(req.body.id) },newRepo);       // 替换 
    res.status(201).json({ msg: "success!" });
  } catch (err) {
    res.status(404).json(err);
  }
}

module.exports = {
  GetMessage,
  SearchRepoName,
  GetDashboard,
  DeleteRepo,
  UpdateRepo,
};
