/** handle and getting pull requesets */

const RepoGetPullRequests = async (owner, name, octokit) => {

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
  
    for (var i=0; i<repoMessage.data.length;i++){
        var body = repoMessage.data[i].body;
        // darr.push(body);
        if(body)
           fs.appendFile("pull_requests.txt",body,err=>{console.log(err)});
    }
  
    // for (var i = 0; i < repoMessage.data.length; i++) {
    //   for (var j = 0; j < KeyWords.length; j++) {
    //     var body = repoMessage.data[i].body;
    //     if (body && body.toLowerCase().indexOf(KeyWords[j]) != -1) {
    //       design++;
    //       darr.push(repoMessage.data[i]);
    //       break;
    //     }
    //   }
    //   if (j >= KeyWords.length) {
    //     no_darr.push(repoMessage.data[i]);
    //     no_design++;
    //   }
    // }
  
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

module.exports =  RepoGetPullRequests;