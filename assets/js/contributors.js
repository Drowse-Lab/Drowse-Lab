document.addEventListener('DOMContentLoaded', async () => {
    const membersDiv = document.getElementById('members');

    try {
        const response = await fetch('assets/data/members.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const members = await response.json();

        if (!Array.isArray(members) || members.length === 0) {
            membersDiv.textContent = 'メンバーが見つかりませんでした。';
            return;
        }

        for (const member of members) {
            const memberElement = document.createElement('div');
            memberElement.classList.add('member');
            if (member.theme) memberElement.classList.add(member.theme); // ← ここでテーマクラス追加

            const urlParts = member.github_link.split('/');
            const username = urlParts[urlParts.length - 1];

            const avatar = document.createElement('img');
            avatar.src = `https://github.com/${username}.png`;
            avatar.alt = `${username}'s avatar`;
            avatar.classList.add('avatar');

            const usernameEl = document.createElement('p');
            usernameEl.textContent = `userid: ${username}`;

            const profileLink = document.createElement('a');
            profileLink.href = member.github_link;
            profileLink.textContent = 'GitHub Profile';

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
