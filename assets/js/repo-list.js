// GitHub API から Drowse Lab のリポジトリ一覧を取得して表示
const orgName = "Drowse-Lab"; // Organization名
const repoListElement = document.getElementById("repo-list");

// リポジトリ情報を取得
async function fetchRepos() {
  try {
    const response = await fetch(`https://api.github.com/orgs/${orgName}/repos`);
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

// リポジトリ情報を表示
function displayRepos(repos) {
  repos.forEach(repo => {
    const repoElement = document.createElement("div");
    repoElement.className = "repo";

    // リンク情報の追加
    const homepageLink = repo.homepage
      ? `<p><a href="${repo.homepage}" target="_blank">Homepage</a></p>`
      : "";

    // リポジトリ情報をHTMLに追加
    repoElement.innerHTML = `
      <h3>${repo.name}</h3>
      <p>${repo.description || "No description provided."}</p>
      <p><strong>Main Language:</strong> ${repo.language || "Not specified"}</p>
      <p><a href="${repo.html_url}" target="_blank">View on GitHub</a></p>
      ${homepageLink} <!-- ホームページリンクを追加 -->
      <div class="extra-info" style="display: none;">
        <p>Loading additional info...</p>
      </div>
    `;
    repoListElement.appendChild(repoElement);

    // イベントリスナーを追加
    repoElement.addEventListener("click", () => handleRepoClick(repo, repoElement.querySelector(".extra-info")));
  });
}

// リポジトリをクリックしたときの処理
async function handleRepoClick(repo, extraInfoElement) {
  if (extraInfoElement.style.display === "block") {
    extraInfoElement.style.display = "none"; // 閉じる
    return;
  }

  // 表示をリセット
  extraInfoElement.style.display = "block";
  extraInfoElement.innerHTML = `<p>Loading additional info...</p>`;

  try {
    // 全ての言語を取得
    const languagesResponse = await fetch(repo.languages_url);
    const languages = await languagesResponse.json();

    // Issuesを取得
    const issuesResponse = await fetch(repo.issues_url.replace("{/number}", ""));
    const issues = await issuesResponse.json();

    // 表示内容を更新
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

// 実行
fetchRepos();
