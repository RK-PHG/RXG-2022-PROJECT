const RepoSchema = require("../models/repo");  // database shcema
const ObjectId = require("mongodb").ObjectId;  // Objected Id
const { Octokit } = require("@octokit/core");  // GitHub API
const {
  RepoGetPullRequests,
  RepoGetCommitFrequency,
  RepoGetContributors,
  RepoGetIssueFrequency,
  RepoGetLanguage,
  RepoGetReleaseTime
 }  = require("./dash/index")

const octokit = new Octokit({
  auth: `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`,
});

const GetMessage = async (req, res) => {
  console.log("Getting Message...");
  try {
    const repoMessage = await octokit.request("GET /repos/{owner}/{repo}", {
      owner: req.body.owner,   // owner
      repo: req.body.repoName, // repoName
    });
    const CreateRepo = await RepoSchema.create({
    //   base: repoMessage,
    //   name: repoMessage.data.name,  // name
    //   owner: repoMessage.data.owner.login,  // login
    //   uploader: req.body.user,  // user
    //   forks: repoMessage.data.forks,
    //   stars: repoMessage.data.watchers,
    //   open_issues: repoMessage.data.open_issues,
      commit_frequency: await RepoGetCommitFrequency(
        repoMessage.data.owner.login,
        repoMessage.data.name,
        octokit
      ),
      // issue_frequency: await RepoGetIssueFrequency(
      //   repoMessage.data.owner.login,
      //   repoMessage.data.name,
      //   octokit
      // ),
      // contributors: await RepoGetContributors(
      //   repoMessage.data.owner.login,
      //   repoMessage.data.name,
      //   octokit
      // ),
      // timeline: {
      //   created_at: repoMessage.data.created_at,
      //   updated_at: repoMessage.data.updated_at,
      //   pushed_at: repoMessage.data.pushed_at,
      //   recent_released_at: await RepoGetReleaseTime(
      //     repoMessage.data.owner.login,
      //     repoMessage.data.name,
      //     octokit
      //   ),
      // },
      // language: await RepoGetLanguage(
      //   repoMessage.data.owner.login,
      //   repoMessage.data.name,
      //   octokit
      // ),
      // pull_requests: await RepoGetPullRequests(
      //   repoMessage.data.owner.login,
      //   repoMessage.data.name,
      //   octokit
      // ),

    });
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
      var search = await RepoSchema.find({});
    } else
      search = await RepoSchema.find({
        name: { $regex: SearchKey, $options: "$i" },
      });
    var repos = [];
    for (var i in search) {
      var eachRepo = {
        _id: search[i]._id.toString(),
        name: search[i].name,
        owner: search[i].owner,
        stars: search[i].stars,
        uploader: search[i].uploader,
        uploaded_time: search[i]._id.getTimestamp(),
      };
      repos.push(eachRepo);
    }
    console.log(repos);

    return res.status(201).json({ repos });
  } catch (err) {
    res.status(404).json(err);
  }
};

const GetDashboard = async (req, res,octokit) => {
  try {
    const detail = await RepoSchema.findOne({ _id: ObjectId(req.body.id) });
    res.status(201).json({ detail });
  } catch (err) {
    res.status(404).json(err);
  }
};

const DeleteRepo = async (req, res) => {
  try {
    const test = await RepoSchema.deleteOne({ _id: ObjectId(req.body.id) });
    res.status(201).json({ msg: "success!" });
  } catch (err) {
    res.status(404).json(err);
  }
};

const UpdateRepo = async (req,res)=>{
  try {
    await RepoSchema.deleteOne({ _id: ObjectId(req.body.id) });
    
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
};
