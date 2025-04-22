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

    // 特定のリポジトリをハイライト
    if (repo.name.includes("The Four Primitive and Weapons")) {
      repoElement.classList.add("highlight");
    }

    // リポジトリ情報をHTMLに追加
    repoElement.innerHTML = `
      <h3>${repo.name}</h3>
      <p>${repo.description || "No description provided."}</p>
      <p><strong>Main Language:</strong> ${repo.language || "Not specified"}</p>
      <p><a href="${repo.html_url}" target="_blank">View on GitHub</a></p>
    `;
    repoListElement.appendChild(repoElement);
  });
}

// 実行
fetchRepos();
