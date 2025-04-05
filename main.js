// Firebaseの設定
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebaseの初期化
firebase.initializeApp(firebaseConfig);

// Firebase Authenticationのインスタンスを取得
const auth = firebase.auth();

// アカウント作成
document.getElementById('signup-button').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('アカウントが作成されました');
            showUserInfo(userCredential.user);
        })
        .catch((error) => {
            console.error('Error:', error.message);
            alert('アカウント作成エラー: ' + error.message);
        });
});

// ログイン
document.getElementById('login-button').addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('ログイン成功');
            showUserInfo(userCredential.user);
        })
        .catch((error) => {
            console.error('Error:', error.message);
            alert('ログインエラー: ' + error.message);
        });
});

// ログアウト
document.getElementById('logout-button').addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            alert('ログアウトしました');
            hideUserInfo();
        })
        .catch((error) => {
            console.error('Error:', error.message);
            alert('ログアウトエラー: ' + error.message);
        });
});

// ユーザー情報を表示
const showUserInfo = (user) => {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('user-email').textContent = 'ログイン中: ' + user.email;
    document.getElementById('blogForm').style.display = 'block';
};

// ユーザー情報を非表示
const hideUserInfo = () => {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('blogForm').style.display = 'none';
};

auth.onAuthStateChanged((user) => {
    if (user) {
        showUserInfo(user);
    } else {
        hideUserInfo();
    }
});