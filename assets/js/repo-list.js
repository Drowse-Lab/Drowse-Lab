const orgName = "Drowse-Lab";
const repoListElement = document.getElementById("repo-list");

// theme-list.json を事前に fetch
let themeMap = {};
fetch("assets/data/theme-list.json")
  .then(res => res.json())
  .then(list => {
    themeMap = Object.fromEntries(list.map(item => [item.repo, item.img]));
    fetchRepos();
  })
  .catch(() => {
    // 失敗しても空で続行
    fetchRepos();
  });

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
  repos.forEach(repo => {
    const repoElement = document.createElement("div");
    repoElement.className = "repo";

    const socialPreviewUrl = `https://opengraph.githubassets.com/latest/${orgName}/${repo.name}`;

    // theme-list.json からテーマ名を取得
    const themeClass = themeMap[repo.name] || "";

    if (themeClass) {
      repoElement.classList.add(themeClass);
    }

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

// handleRepoClick 以降はそのままでOK

// リポジトリをクリックしたときの処理（そのまま）
async function handleRepoClick(repo, extraInfoElement) {
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

    extraInfoElement.innerHTML = `<p>Loading additional info...</p>`;
    try {
      const languagesResponse = await fetch(repo.languages_url);
      const languages = await languagesResponse.json();

      const issuesResponse = await fetch(repo.issues_url.replace("{/number}", ""));
      const issues = await issuesResponse.json();

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
    } catch (error) {
      console.error("Error fetching additional info:", error);
      extraInfoElement.innerHTML = `<p>Error loading additional info.</p>`;
    }
  }
}

// 実行
fetchRepos();
