document.addEventListener('DOMContentLoaded', async () => {
    const membersDiv = document.getElementById('members');

    try {
        // ローカルの members.json からメンバー情報を取得
        const response = await fetch('assets/data/members.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const members = await response.json();

        if (!Array.isArray(members) || members.length === 0) {
            membersDiv.textContent = 'メンバーが見つかりませんでした。';
            return;
        }

        // メンバー情報を表示
        for (const member of members) {
            const memberElement = document.createElement('div');
            memberElement.classList.add('member');

            // github_link からユーザーネームを抽出
            const urlParts = member.github_link.split('/');
            const username = urlParts[urlParts.length - 1];

            // アバター画像（GitHubの公式URL形式）
            const avatar = document.createElement('img');
            avatar.src = `https://github.com/${username}.png`;
            avatar.alt = `${username}'s avatar`;
            avatar.classList.add('avatar');

            // ユーザーネーム表示
            const usernameEl = document.createElement('p');
            usernameEl.textContent = `userid: ${username}`;

            // プロフィールリンク
            const profileLink = document.createElement('a');
            profileLink.href = member.github_link;
            profileLink.textContent = 'GitHub Profile';

            // DOMに要素を追加
            memberElement.appendChild(avatar);
            memberElement.appendChild(usernameEl);
            memberElement.appendChild(profileLink);

            membersDiv.appendChild(memberElement);
        }
    } catch (error) {
        console.error('Error fetching members:', error);
        membersDiv.textContent = 'メンバー情報の読み込み中にエラーが発生しました。';
    }
});
