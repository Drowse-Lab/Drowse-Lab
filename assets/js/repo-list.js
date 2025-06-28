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

    // Social Preview画像のURL
    const socialPreviewUrl = `https://opengraph.githubassets.com/latest/${orgName}/${repo.name}`;

    // リンク情報の追加
    const homepageLink = repo.homepage
      ? `<p><a href="${repo.homepage}" target="_blank">Homepage</a></p>`
      : "";

    // リポジトリ情報をHTMLに追加
    repoElement.innerHTML = `
      <h3>${repo.name}</h3>
      <img src="${socialPreviewUrl}" alt="Social Preview" style="max-width: 100%; margin-bottom: 10px;">
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
  const repoElement = extraInfoElement.parentElement;

  // 他のリポジトリを閉じる
  document.querySelectorAll(".repo").forEach(el => {
    if (el !== repoElement) {
      el.classList.remove("active");
      el.querySelector(".extra-info").style.display = "none";
    }
  });

  // 現在のリポジトリの表示を切り替え
  if (repoElement.classList.contains("active")) {
    repoElement.classList.remove("active");
    extraInfoElement.style.display = "none";
  } else {
    repoElement.classList.add("active");
    extraInfoElement.style.display = "block";

    // 情報をロード
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
