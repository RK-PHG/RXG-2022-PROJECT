const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/custom-error");
const RepoSchema = require("../models/repo");  // database shcema
const ObjectId = require("mongodb").ObjectId;  // Objected Id
const { Octokit } = require("@octokit/core");  // GitHub API
const res = require("express/lib/response");   // response
const { default: axios } = require("axios");
const { off } = require("../models/repo");

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

      base: repoMessage,
      name: repoMessage.data.name,  // name
      owner: repoMessage.data.owner.login,  // login
      uploader: req.body.user,  // user
      forks: repoMessage.data.forks,
      stars: repoMessage.data.watchers,
      open_issues: repoMessage.data.open_issues,
      commit_frequency: await RepoGetCommitFrequency(
        repoMessage.data.owner.login,
        repoMessage.data.name
      ),
      issue_frequency: await RepoGetIssueFrequency(
        repoMessage.data.owner.login,
        repoMessage.data.name
      ),
      contributors: await RepoGetContributors(
        repoMessage.data.owner.login,
        repoMessage.data.name
      ),
      timeline: {
        created_at: repoMessage.data.created_at,
        updated_at: repoMessage.data.updated_at,
        pushed_at: repoMessage.data.pushed_at,
        recent_released_at: await RepoGetReleaseTime(
          repoMessage.data.owner.login,
          repoMessage.data.name
        ),
      },
      language: await RepoGetLanguage(
        repoMessage.data.owner.login,
        repoMessage.data.name
      ),
      pull_requests: await RepoGetPullRequests(
        repoMessage.data.owner.login,
        repoMessage.data.name
      ),

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

const GetDashboard = async (req, res) => {
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

const RepoGetCommitFrequency = async (owner, name) => {
  console.log("Getting Commmit...");
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/commits",
    {
      owner: owner,
      repo: name,
      per_page: 100,
      page: 1,
    }
  );

  if (repoMessage.data.length == 0) return { 2021: "0", 2020: "0", 2019: "0" };
  for (var i = 2; i <= 5; i++) {
    const NextRepoMessage = await octokit.request(
      "GET /repos/{owner}/{repo}/commits",
      {
        owner: owner,
        repo: name,
        per_page: 100,
        page: i,
      }
    );
    if (NextRepoMessage.data.length == 0) break;
    else repoMessage.data = repoMessage.data.concat(NextRepoMessage.data);
  }
  var orgs = [];
  var urls = []
  try {
    /** analysis the company info */
    for (var i = 1; i < repoMessage.data.length; i++) {
      var url = repoMessage.data[i].author.url;
      // await octokit.request(
      //   "GET /users/{login}",
      //   {
      //     login: login
      //   }
      // ).then(
      //     res=>{
      //         if(res.data.company)
      //           orgs.push(res.data.company.toLowerCase().replace("@","").trim()) 
      //     });
      // }
      urls.push(url);
    }
    if (urls.length != 0) {
      var res = [];
      try {
        const resp = await axios.get("http://127.0.0.1:5000/", {
          params: {
            urls: JSON.stringify(urls)
          }
        });
        res = resp.data

      }catch(err){
         res = []   
      }finally{
        orgs = res;
        console.log(orgs)
      }
    }
  } catch (err) { }

  orgs = orgs.filter(res=>res!==null);
  orgs = orgs.map(org=>org.toLowerCase().trim().replace("@",""));

  const x1 = repoMessage.data[0].commit.committer.date;
  const x2 =
    repoMessage.data[repoMessage.data.length - 1].commit.committer.date;
  const t1 = TransDate(x1);
  const t2 = TransDate(x2);
  var frequency = {};

  if (t1 - t2 < 2) {
    frequency = CountDayCommit(repoMessage);
  } else if (t1 - t2 > 15) {
    year1 = Math.floor(t1 / 12);
    year2 = Math.floor(t2 / 12);
    frequency = CountYearCommit(year1, year2, repoMessage.data);
  } else {
    frequency = CountMonthCommit(t1, t2, repoMessage.data);
  }
  return {
    "orgs": SortCompanyNumbers(orgs),
    "freq": frequency
  };
};

const CountDayCommit = (Msg) => {
  var order = {};
  var result = {};

  for (var i in Msg.data) {
    var t = Msg.data[i].commit.committer.date.substring(0, 10);
    formalLength = Object.keys(order).length;
    if (!(t in result)) {
      order[formalLength.toString()] = t;
      result[t] = 1;
    } else {
      result[t] += 1;
    }
  }
  var pra = Math.floor((Object.keys(order).length - 1) / 6) + 1;
  var answer = {};
  var a = Math.floor(Object.keys(order).length / pra);
  if (pra == 1) {
    for (var i = 0; i < a; i++) {
      answer[order[i.toString()]] = result[order[i.toString()]];
    }
    return answer;
  }
  for (var i = 0; i < a; i++) {
    pp = order[i * pra];
    var sum = 0;
    for (var j = i * pra; j <= i * pra + pra - 1; j++) {
      sum += result[order[j.toString()]];
    }
    answer[pp] = sum;
  }
  return answer;
};

const RepoGetIssueFrequency = async (owner, name) => {
  console.log("Getting Issues...");
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/issues",
    {
      owner: owner,
      repo: name,
      per_page: 100,
      page: 1,
    }
  );

  if (repoMessage.data.length == 0) return { 2021: "0", 2020: "0", 2019: "0" };
  for (var i = 2; i <= 5; i++) {
    const NextRepoMessage = await octokit.request(
      "GET /repos/{owner}/{repo}/issues",
      {
        owner: owner,
        repo: name,
        per_page: 100,
        page: i,
      }
    );
    if (NextRepoMessage.data.length == 0) break;
    else repoMessage.data = repoMessage.data.concat(NextRepoMessage.data);
  }

  var orgs = [];
  var urls = []
  try {
    /** analysis the company info */
    for (var i = 1; i < repoMessage.data.length; i++) {
      var url = repoMessage.data[i].user.url;
      // await octokit.request(
      //   "GET /users/{login}",
      //   {
      //     login: login
      //   }
      // ).then(
      //     res=>{
      //         if(res.data.company)
      //           orgs.push(res.data.company.toLowerCase().replace("@","").trim()) 
      //     });
      // }
      urls.push(url);
    }
    if (urls.length != 0) {
      var res = [];
      try {
        const resp = await axios.get("http://127.0.0.1:5000/", {
          params: {
            urls: JSON.stringify(urls)
          }
        });
        res = resp.data

      }catch(err){
         res = []   
      }finally{
        orgs = res;
        console.log(orgs)
      }
    }
  } catch (err) { }
  
  orgs = orgs.filter(res=>res!==null);
  orgs = orgs.map(org=>org.toLowerCase().trim().replace("@",""));
  
  const x1 = repoMessage.data[0].created_at;
  const x2 = repoMessage.data[repoMessage.data.length - 1].created_at;
  const t1 = TransDate(x1);
  const t2 = TransDate(x2);

  var frequency = {};
  if (t1 - t2 < 2) {
    frequency = CountDayIssue(repoMessage);
  } else if (t1 - t2 > 15) {
    year1 = Math.floor(t1 / 12);
    year2 = Math.floor(t2 / 12);
    frequency = CountYearIssue(year1, year2, repoMessage.data);
  } else {
    frequency = CountMonthIssue(t1, t2, repoMessage.data);
  }
  return {
    orgs: SortCompanyNumbers(orgs),
    freq: frequency,
  };
};

const CountDayIssue = (Msg) => {
  var order = {};
  var result = {};

  for (var i in Msg.data) {
    var t = Msg.data[i].created_at.substring(0, 10);
    formalLength = Object.keys(order).length;
    if (!(t in result)) {
      order[formalLength.toString()] = t;
      result[t] = 1;
    } else {
      result[t] += 1;
    }
  }
  var pra = Math.floor((Object.keys(order).length - 1) / 6) + 1;
  var answer = {};
  var a = Math.floor(Object.keys(order).length / pra);
  if (pra == 1) {
    for (var i = 0; i < a; i++) {
      answer[order[i.toString()]] = result[order[i.toString()]];
    }
    return answer;
  }
  for (var i = 0; i < a; i++) {
    pp = order[i * pra];
    var sum = 0;
    for (var j = i * pra; j <= i * pra + pra - 1; j++) {
      sum += result[order[j.toString()]];
    }
    answer[pp] = sum;
  }
  return answer;
};

const TransDate = (date) => {
  year = date.substring(0, 4);
  month = date.substring(5, 7);
  year1 = parseInt(year, 10);
  month1 = parseInt(month, 10);
  return (year1 - 2000) * 12 + month1 - 1;
};

const CountYearCommit = (year1, year2, commitmsg) => {
  var countNum = new Array(year1 - year2 + 1).fill(0);
  commitmsg.map((x) => {
    year0 = Math.floor(TransDate(x.commit.committer.date) / 12);
    countNum[year1 - year0] += 1;
  });

  var obj = {};
  for (var i = year1; i >= year2; i--) {
    nn = i + 2000;
    cc = nn + "";
    obj[cc] = countNum[year1 - i];
  }
  return obj;
};

const CountYearIssue = (year1, year2, commitmsg) => {
  var countNum = new Array(year1 - year2 + 1).fill(0);
  commitmsg.map((x) => {
    year0 = Math.floor(TransDate(x.created_at) / 12);
    countNum[year1 - year0] += 1;
  });
  var obj = {};
  for (var i = year1; i >= year2; i--) {
    nn = i + 2000;
    cc = nn + "";
    obj[cc] = countNum[year1 - i];
  }
  return obj;
};

const CountMonthCommit = (t1, t2, commitmsg) => {
  var countNum = new Array(t1 - t2 + 1).fill(0);
  commitmsg.map((x) => {
    t = TransDate(x.commit.committer.date);
    countNum[t1 - t] += 1;
  });

  var obj = {};
  for (var i = t1; i >= t2; i--) {
    mm = (i % 12) + 1;
    nn = (i - mm + 1) / 12 + 2000;
    cc = mm > 9 ? nn + "-" + mm : nn + "-0" + mm;
    obj[cc] = countNum[t1 - i];
  }
  return obj;
};

const CountMonthIssue = (t1, t2, commitmsg) => {
  var countNum = new Array(t1 - t2 + 1).fill(0);
  commitmsg.map((x) => {
    t = TransDate(x.created_at);
    countNum[t1 - t] += 1;
  });

  var obj = {};
  for (var i = t1; i >= t2; i--) {
    mm = (i % 12) + 1;
    nn = (i - mm + 1) / 12 + 2000;
    cc = mm > 9 ? nn + "-" + mm : nn + "-0" + mm;
    obj[cc] = countNum[t1 - i];
  }
  return obj;
};

/** sort comany numbers */
const SortCompanyNumbers = (comanys) => {
  var orgs = []
  var map = new Map();
  for (var i = 0; i < comanys.length; i++) {

    if (map.has(comanys[i])) {
      var n = map.get(comanys[i])
      map.set(comanys[i], n + 1);
    }
    else
      map.set(comanys[i], 1);
  }
  orgs = Array.from(map);
  orgs = orgs.sort(
    (a, b) => {
      return b[1] - a[1]
    }
  )
  orgs = orgs.map(com => ({ name: com[0], num: com[1] }))
  return orgs;
}


/** get pull requests */
const RepoGetPullRequests = async (owner, name) => {

  /** get 500 pull requests*/
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls",
    {
      owner: owner,
      repo: name,
      per_page: 100,
      page: 1,
    }
  );

  if (repoMessage.data.length == 0) return "none";
  for (var i = 2; i <= 5; i++) {
    const NextRepoMessage = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls",
      {
        owner: owner,
        repo: name,
        per_page: 100,
        page: i,
      }
    );
    if (NextRepoMessage.data.length == 0) break;
    else repoMessage.data = repoMessage.data.concat(NextRepoMessage.data);
  }

  const KeyWords = ["implementation", "future plans",
    "os support", "code standards", "testability",
    "robustness", "safety", "security", "performance",
    "runtime", "optimization", "configuration", "flags",
    "documentation", "in-code", "off-code", "generic",]

  var design = 0, no_design = 0;
  var darr = [], no_darr = [];
  /** do the pull request's analizes */
  for (var i = 0; i < repoMessage.data.length; i++) {
    for (var j = 0; j < KeyWords.length; j++) {
      var body = repoMessage.data[i].body;
      if (body && body.toLowerCase().indexOf(KeyWords[j]) != -1) {
        design++;
        darr.push(repoMessage.data[i]);
        break;
      }
    }
    if (j >= KeyWords.length) {
      no_darr.push(repoMessage.data[i]);
      no_design++;
    }
  }

  return {
    "design": {
      num: design,
      arr: darr
    },
    "no_design": {
      num: no_design,
      arr: no_darr
    }
  }
}

/** get repocode qualities */
const RepoCodeQuality = async (owner, name) => {

}


const RepoGetContributors = async (owner, name) => {
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/contributors",
    {
      owner: owner,
      repo: name,
      page: 1,
      per_page: 100,
    }
  );

  /** const the contribute's numbers */
  var contribute_number = 0;
  for (var i = 0; i < repoMessage.data.length; i++) {
    contribute_number += repoMessage.data[i].contributions;
  }
  var result = [];
  var num = 0;
  for (var i = 0; i < repoMessage.data.length; i++) {
    const userMessage = await octokit.request("GET /users/{username}", {
      username: repoMessage.data[i].login,
    });
    var active = true;
    if (num / contribute_number > 0.8)
      active = false

    var ss = {
      name: repoMessage.data[i].login,
      avatar_url: repoMessage.data[i].avatar_url,
      contributions: repoMessage.data[i].contributions,
      company: userMessage.data.company,
      public_repos: userMessage.data.public_repos,
      public_gists: userMessage.data.public_gists,
      followers: userMessage.data.followers,
      created_at: userMessage.data.created_at,
      is_active: active
    };
    result.push(ss);
    num += repoMessage.data[i].contributions;
  }
  return result;
};

const RepoGetReleaseTime = async (owner, name) => {
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/releases",
    {
      owner: owner,
      repo: name,
    }
  );
  if (!repoMessage.data.length) return "not published yet!";
  return repoMessage.data[0].published_at;
};

const RepoGetLanguage = async (owner, name) => {
  const repoMessage = await octokit.request(
    "GET /repos/{owner}/{repo}/languages",
    {
      owner: owner,
      repo: name,
    }
  );
  return repoMessage.data;
};



module.exports = {
  GetMessage,
  SearchRepoName,
  GetDashboard,
  DeleteRepo,
};
