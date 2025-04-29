document.addEventListener('DOMContentLoaded', async () => {
    const membersDiv = document.getElementById('members');

    try {
        // GitHub APIからメンバー情報を取得
        const response = await fetch('https://api.github.com/orgs/Drowse-Lab/members');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const members = await response.json();

        if (members.length === 0) {
            membersDiv.textContent = 'メンバーが見つかりませんでした。';
            return;
        }

        // メンバーの詳細情報を取得・表示
        for (const member of members) {
            const memberElement = document.createElement('div');
            memberElement.classList.add('member');

            // メンバーの基本情報
            const avatar = document.createElement('img');
            avatar.src = member.avatar_url;
            avatar.alt = `${member.login}'s avatar`;
            avatar.classList.add('avatar');

            const id = document.createElement('p');
            id.textContent = `ID: ${member.login}`;

            // 詳細情報をAPIから取得
            const detailsResponse = await fetch(member.url);
            const details = await detailsResponse.json();

            const username = document.createElement('p');
            username.textContent = `username: ${details.name || '不明'}`; // 名前が公開されていない場合は「不明」を表示

            const profileLink = document.createElement('a');
            profileLink.href = member.html_url;
            profileLink.textContent = 'GitHub Profile';

            // DOMに要素を追加
            memberElement.appendChild(avatar);
            memberElement.appendChild(id);
            memberElement.appendChild(username);
            memberElement.appendChild(profileLink);

            membersDiv.appendChild(memberElement);
        }
    } catch (error) {
        console.error('Error fetching members:', error);
        membersDiv.textContent = 'メンバー情報の読み込み中にエラーが発生しました。';
    }
});