// GitHub APIトークン（安全な方法で管理する必要があります）
const GITHUB_TOKEN = 'YOUR_GITHUB_ACCESS_TOKEN';

// プライベートリポジトリの情報
const REPO_OWNER = 'Drowse-Lab';
const REPO_NAME = 'mail-address';

// GitHub APIを使用してリポジトリのコミット情報を取得
const fetchCommits = async (branch = 'main', since = '2025-01-01T00:00:00Z') => {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?sha=${branch}&since=${since}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  const commits = await response.json();
  return commits;
};

// コミット情報を表示
const displayCommits = async () => {
  const commits = await fetchCommits();
  const commitsDiv = document.getElementById('commits');
  commitsDiv.innerHTML = ''; // 既存の内容をクリア
  commits.forEach(commit => {
    const commitElement = document.createElement('div');
    commitElement.className = 'commit';
    commitElement.innerHTML = `
      <input type="radio" name="commit" value="${commit.sha}">
      <p>${commit.commit.message}</p>
      <small>作者: ${commit.commit.author.name} - 日付: ${new Date(commit.commit.author.date).toLocaleString()}</small>
    `;
    commitsDiv.appendChild(commitElement);
  });
};