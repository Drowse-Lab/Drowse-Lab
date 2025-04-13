document.addEventListener('DOMContentLoaded', async () => {
    const membersDiv = document.getElementById('members');

    // GitHub Personal Access Token (必要に応じて設定)
    const GITHUB_TOKEN = 'your_github_personal_access_token'; // トークンを入力

    try {
        // APIからDrowse-Labのメンバー情報を取得
        const response = await fetch('https://api.github.com/orgs/Drowse-Lab/members', {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`, // 認証トークンを追加
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const members = await response.json();

        if (members.length === 0) {
            membersDiv.textContent = 'メンバーが見つかりませんでした。';
            return;
        }

        // メンバー情報を表示
        members.forEach(member => {
            const memberElement = document.createElement('div');
            memberElement.classList.add('member');

            const avatar = document.createElement('img');
            avatar.src = member.avatar_url;
            avatar.alt = `${member.login}'s avatar`;
            avatar.classList.add('avatar');

            const name = document.createElement('h2');
            name.textContent = member.login;

            const profileLink = document.createElement('a');
            profileLink.href = member.html_url;
            profileLink.textContent = 'GitHub Profile';

            memberElement.appendChild(avatar);
            memberElement.appendChild(name);
            memberElement.appendChild(profileLink);

            membersDiv.appendChild(memberElement);
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        membersDiv.textContent = 'メンバー情報の読み込み中にエラーが発生しました。';
    }
});