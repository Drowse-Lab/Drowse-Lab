const orgName = "Drowse-Lab";
const repoListElement = document.getElementById("repo-list");

let themeMap = {};
let languagesMap = {};
let issuesMap = {};

// まとめてロード
Promise.all([
  fetch("assets/data/theme-list.json").then(res => res.json()).catch(() => []),
  fetch("assets/data/languages.json").then(res => res.json()).catch(() => ({})),
  fetch("assets/data/issues.json").then(res => res.json()).catch(() => ({}))
]).then(([themeList, languagesJson, issuesJson]) => {
  themeMap = Object.fromEntries(themeList.map(item => [item.repo, item.img]));
  languagesMap = languagesJson;
  issuesMap = issuesJson;
  fetchRepos();
});

async function getThemeForRepo(repoName) {
    const path = `assets/theme/${repoName}.md`;
    try {
        const res = await fetch(path);
        if (!res.ok) return "default";
        const text = await res.text();
        const match = text.match(/^img:\s*(\S+)/m);
        return match ? match[1] : "default";
    } catch {
        return "default";
    }
}
async function fetchRepos() {
  try {
    const response = await fetch("assets/data/repos.json");
    if (!response.ok) {
      throw new Error(`Error fetching repos: ${response.statusText}`);
    }
    const repos = await response.json();
    displayRepos(repos);
  } catch (error) {
    console.error(error);
    repoListElement.innerHTML = `<p>リポジトリ情報を取得できませんでした。</p>`;
  }
}

function displayRepos(repos) {
  // 重複防止
  repoListElement.innerHTML = "";
  repos.forEach(repo => {
    const repoElement = document.createElement("div");
    repoElement.className = "repo";

    const socialPreviewUrl = `https://opengraph.githubassets.com/latest/${orgName}/${repo.name}`;
    const themeClass = themeMap[repo.name] || "";
    if (themeClass) repoElement.classList.add(themeClass);

    let htmlUrl = repo.html_url;
    if (typeof htmlUrl === "string" && htmlUrl.endsWith("#")) {
      htmlUrl = htmlUrl.slice(0, -1);
    }

    const homepageLink = repo.homepage
      ? `<p><a href="${repo.homepage}" target="_blank">Homepage</a></p>`
      : "";

    repoElement.innerHTML = `
      <h3>${repo.name}</h3>
      <img src="${socialPreviewUrl}" alt="Social Preview" style="max-width: 100%; margin-bottom: 10px;">
      <p>${repo.description || "No description provided."}</p>
      <p><strong>Main Language:</strong> ${repo.language || "Not specified"}</p>
      <p><a href="${htmlUrl}" target="_blank">View on GitHub</a></p>
      ${homepageLink}
      <div class="extra-info" style="display: none;">
        <p>Loading additional info...</p>
      </div>
    `;
    repoListElement.appendChild(repoElement);

    repoElement.addEventListener("click", () => handleRepoClick(repo, repoElement.querySelector(".extra-info")));
  });
}

function handleRepoClick(repo, extraInfoElement) {
  const repoElement = extraInfoElement.parentElement;

  document.querySelectorAll(".repo").forEach(el => {
    if (el !== repoElement) {
      el.classList.remove("active");
      el.querySelector(".extra-info").style.display = "none";
    }
  });

  if (repoElement.classList.contains("active")) {
    repoElement.classList.remove("active");
    extraInfoElement.style.display = "none";
  } else {
    repoElement.classList.add("active");
    extraInfoElement.style.display = "block";

    const languages = languagesMap[repo.name] || {};
    const issues = issuesMap[repo.name] || [];

    extraInfoElement.innerHTML = `
      <h4>Languages:</h4>
      <ul>
        ${Object.entries(languages).map(([lang, count]) => `<li>${lang}: ${count} bytes</li>`).join("")}
      </ul>
      <h4>Issues:</h4>
      <ul>
        ${issues.length > 0
          ? issues.map(issue => `<li><a href="${issue.html_url}" target="_blank">${issue.title}</a></li>`).join("")
          : "<li>No issues found.</li>"}
      </ul>
    `;
  }
}
