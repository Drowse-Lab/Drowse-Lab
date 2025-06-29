const fetch = require("node-fetch");
const fs = require("fs");

const orgName = "Drowse-Lab";
const repos = require("./repos.json"); // 事前に取得したrepos.json

async function getThemeImg(repo) {
  const themeFileUrl = `https://api.github.com/repos/${orgName}/${repo.name}/contents/theme/${repo.name}.md`;
  try {
    const res = await fetch(themeFileUrl);
    if (!res.ok) return null;
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString();
    const imgMatch = content.match(/^img:\s*(\w+)/m);
    return imgMatch ? imgMatch[1] : null;
  } catch (e) {
    return null;
  }
}

(async () => {
  const results = [];
  for (const repo of repos) {
    const themeImg = await getThemeImg(repo);
    results.push({
      repo: repo.name,
      img: themeImg
    });
  }
  fs.writeFileSync("theme-list.json", JSON.stringify(results, null, 2));
  console.log("done");
})();
