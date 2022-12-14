const RepoGetReleaseTime = async (owner, name,octokit) => {     // 获取release版本时间
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

module.exports =  RepoGetReleaseTime;