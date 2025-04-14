document.addEventListener('DOMContentLoaded', async () => {
    const contributorsDiv = document.getElementById('contributors');

    // GitHub APIのリポジトリ情報
    const REPO_OWNER = 'Drowse-Lab';
    const REPO_NAME = 'Drowse-Lab';

    try {
        // GitHub APIからコミット情報を取得
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const commits = await response.json();

        // コミッターのリストを作成
        const committers = new Map(); // 重複を避けるためMapを使用

        commits.forEach(commit => {
            const committer = commit.commit.committer;
            if (committer) {
                const name = committer.name;
                const email = committer.email;

                // コミッター情報をMapに追加
                if (!committers.has(email)) {
                    committers.set(email, { name, email });
                }
            }
        });

        if (committers.size === 0) {
            contributorsDiv.textContent = 'コミッターが見つかりませんでした。';
            return;
        }

        // コミッター情報を表示
        committers.forEach((committer, email) => {
            const committerElement = document.createElement('div');
            committerElement.classList.add('committer');

            const nameElement = document.createElement('h2');
            nameElement.textContent = committer.name;

            const emailElement = document.createElement('p');
            emailElement.textContent = `Email: ${committer.email}`;

            committerElement.appendChild(nameElement);
            committerElement.appendChild(emailElement);

            contributorsDiv.appendChild(committerElement);
        });
    } catch (error) {
        console.error('Error fetching committers:', error);
        contributorsDiv.textContent = 'コミッター情報の読み込み中にエラーが発生しました。';
    }
});
