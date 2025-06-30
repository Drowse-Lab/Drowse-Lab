const fs = require("fs");
const path = require("path");

const repos = require("./repos.json");

function getThemeImg(repo) {
  // drowse-lab/theme/リポジトリ名.md を参照
  const themeFilePath = path.join(__dirname, "../drowse-lab/theme", `${repo.name}.md`);
  try {
    if (!fs.existsSync(themeFilePath)) return null;
    const content = fs.readFileSync(themeFilePath, "utf-8");
    const imgMatch = content.match(/^img:\s*(\w+)/m);
    return imgMatch ? imgMatch[1] : null;
  } catch (e) {
    return null;
  }
}

(async () => {
  const results = [];
  for (const repo of repos) {
    const themeImg = getThemeImg(repo);
    results.push({
      repo: repo.name,
      img: themeImg
    });
  }
  fs.writeFileSync("theme-list.json", JSON.stringify(results, null, 2));
  console.log("done");
})();
