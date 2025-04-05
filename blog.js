// ローカルストレージにユーザー情報を保存
const saveUser = (username, email, password) => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));
};

// ローカルストレージからユーザー情報を取得
const getUserByEmail = (email) => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    return users.find(user => user.email === email);
};

const getUserByUsername = (username) => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    return users.find(user => user.username === username);
};

// ローカルストレージからユーザー情報を削除
const deleteUser = (username) => {
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.filter(user => user.username !== username);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.removeItem('currentUser');
};

// ローカルストレージに投稿を保存
const savePost = (username, content) => {
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    posts.push({ username, content, date: new Date().toLocaleString() });
    localStorage.setItem('posts', JSON.stringify(posts));
};

// ローカルストレージから投稿を取得
const getPosts = () => {
    return JSON.parse(localStorage.getItem('posts')) || [];
};

// アカウント作成
document.getElementById('signup-button').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const existingUserByEmail = getUserByEmail(email);
    const existingUserByUsername = getUserByUsername(username);

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
    const user = getUserByEmail(email);

    if (user && user.password === password) {
        alert('ログイン成功');
        localStorage.setItem('currentUser', JSON.stringify({ username: user.username }));
        showUserInfo(user);
    } else {
        alert('メールアドレスまたはパスワードが間違っています。');
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

// ページ読み込み時に現在のユーザーを確認
window.onload = () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        showUserInfo(currentUser);
    } else {
        displayPosts();
    }
};

// 投稿フォームの送信処理
document.getElementById('blogForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const blogContent = document.getElementById('blogContent').value;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (blogContent && currentUser) {
        savePost(currentUser.username, blogContent);
        alert('投稿が完了しました');
        document.getElementById('blogContent').value = '';
        displayPosts();
    } else {
        alert('投稿内容を入力してください。');
    }
});

// 投稿を表示
const displayPosts = () => {
    const posts = getPosts();
    const blogPostsDiv = document.getElementById('blogPosts');
    blogPostsDiv.innerHTML = '';
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.innerHTML = `<p>${post.content}</p><small>投稿者: ${post.username} - 日付: ${post.date}</small>`;
        blogPostsDiv.appendChild(postElement);
    });
};