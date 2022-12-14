const RepoGetLanguage = async (owner, name,octokit) => {        // 代码语言
    const repoMessage = await octokit.request(
      "GET /repos/{owner}/{repo}/languages",
      {
        owner: owner,
        repo: name,
      }
    );
    return repoMessage.data;
};

module.exports =  RepoGetLanguage;