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

// 選択したコミットを投稿
document.getElementById('post-selected-commit').addEventListener('click', async () => {
  const selectedCommitSha = document.querySelector('input[name="commit"]:checked');
  if (selectedCommitSha) {
    const selectedCommit = await fetchCommitBySha(selectedCommitSha.value);
    if (selectedCommit) {
      const postContent = `${selectedCommit.commit.message}\n作者: ${selectedCommit.commit.author.name}\n日付: ${new Date(selectedCommit.commit.author.date).toLocaleString()}`;
      savePost(selectedCommit.commit.author.name, postContent);
      alert('コミットが投稿されました');
      displayPosts();
    } else {
      alert('選択したコミットが見つかりませんでした');
    }
  } else {
    alert('コミットを選択してください');
  }
});

// コミットSHAでコミット情報を取得
const fetchCommitBySha = async (sha) => {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${sha}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  const commit = await response.json();
  return commit;
};

// ページ読み込み時に現在のユーザーを確認
window.onload = () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) {
    showUserInfo(currentUser);
  } else {
    displayPosts();
  }
  displayCommits();
};

// ユーザー情報を表示
const showUserInfo = (user) => {
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('user-info').style.display = 'block';
  document.getElementById('user-username').textContent = 'ログイン中: ' + user.username;
  document.getElementById('blogForm').style.display = 'block';
  displayPosts();
};

// ユーザー情報を非表示
const hideUserInfo = () => {
  document.getElementById('login-container').style.display = 'block';
  document.getElementById('user-info').style.display = 'none';
  document.getElementById('blogForm').style.display = 'none';
  displayPosts();
};

// アカウント作成
document.getElementById('signup-button').addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  console.log('アカウント作成試行:', { username, email, password });
  const existingUserByEmail = getUserByEmail(email);
  const existingUserByUsername = getUserByUsername(username);
  console.log('既存ユーザー情報:', { existingUserByEmail, existingUserByUsername });

  if (existingUserByEmail) {
    alert('このメールアドレスは既に使用されています。');
  } else if (existingUserByUsername) {
    alert('このユーザー名は既に使用されています。');
  } else {
    saveUser(username, email, password);
    alert('アカウントが作成されました');
    localStorage.setItem('currentUser', JSON.stringify({ username }));
    showUserInfo({ username });
  }
});

// ログイン
document.getElementById('login-button').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  console.log('ログイン試行:', { email, password });
  const user = getUserByEmail(email);
  console.log('ユーザー情報:', user);

  if (user && user.password === password) {
    alert('ログイン成功');
    localStorage.setItem('currentUser', JSON.stringify({ username: user.username }));
    showUserInfo(user);
  } else {
    alert('メールアドレスまたはパスワードが間違っています。');
    console.log('ログイン失敗');
  }
});

// ログアウト
document.getElementById('logout-button').addEventListener('click', () => {
  alert('ログアウトしました');
  localStorage.removeItem('currentUser');
  hideUserInfo();
});

// アカウント削除
document.getElementById('delete-account-button').addEventListener('click', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const password = prompt('パスワードを入力してください:');
  if (password) {
    const user = getUserByUsername(currentUser.username);
    if (user && user.password === password) {
      deleteUser(currentUser.username);
      alert('アカウントが削除されました');
      hideUserInfo();
    } else {
      alert('パスワードが正しくありません');
    }
  }
});

// 投稿を表示
const displayPosts = () => {
  const posts = getPosts();
  const blogPostsDiv = document.getElementById('blogPosts');
  blogPostsDiv.innerHTML = '';
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const currentUserEmail = currentUser ? getUserByUsername(currentUser.username).email : null;

  posts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.innerHTML = `
      <p>${post.content}</p>
      <small>投稿者: ${post.username} - 日付: ${post.date}</small>
      ${(currentUser && (currentUser.username === post.username || adminEmails.includes(currentUserEmail))) ? `<button onclick="handleDeletePost('${post.username}', '${post.date}')">削除</button>` : ''}
    `;
    blogPostsDiv.appendChild(postElement);
  });
};

// 投稿削除ボタンのクリックイベントハンドラ
const handleDeletePost = async (username, date) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const currentUserEmail = getUserByUsername(currentUser.username).email;
  const adminEmails = await fetchAdminEmails();

  if (confirm('本当にこの投稿を削除しますか？')) {
    if (currentUser.username === username || adminEmails.includes(currentUserEmail)) {
      deletePost(username, date);
      alert('投稿が削除されました');
      displayPosts();
    } else {
      alert('この投稿を削除する権限がありません');
    }
  }
};

// GitHub APIを使用してプライベートリポジトリから管理者アカウント情報を取得
const fetchAdminEmails = async () => {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/admin_accounts.json`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3.raw'
    }
  });
  const data = await response.json();
  return JSON.parse(atob(data.content)).adminEmails;
};

// ユーザー管理関数の実装
const USERS_KEY = 'users';

// ユーザーを保存
const saveUser = (username, email, password) => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  users.push({ username, email, password });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// ユーザーを取得 (メールアドレスで取得)
const getUserByEmail = (email) => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  return users.find(user => user.email === email);
};

// ユーザーを取得 (ユーザー名で取得)
const getUserByUsername = (username) => {
  const users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  return users.find(user => user.username === username);
};

// ユーザーを削除
const deleteUser = (username) => {
  let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  users = users.filter(user => user.username !== username);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// 投稿を保存
const savePost = (username, content) => {
  const posts = JSON.parse(localStorage.getItem('posts')) || [];
  const date = new Date().toISOString();
  posts.push({ username, content, date });
  localStorage.setItem('posts', JSON.stringify(posts));
};

// 投稿を取得
const getPosts = () => {
  return JSON.parse(localStorage.getItem('posts')) || [];
};

// 投稿を削除
const deletePost = (username, date) => {
  let posts = JSON.parse(localStorage.getItem('posts')) || [];
  posts = posts.filter(post => !(post.username === username && post.date === date));
  localStorage.setItem('posts', JSON.stringify(posts));
};