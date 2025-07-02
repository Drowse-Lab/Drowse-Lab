document.addEventListener('DOMContentLoaded', async () => {
    const membersDiv = document.getElementById('members');

    try {
        // ローカルの members.json からメンバー情報を取得
        const response = await fetch('assets/data/members.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const members = await response.json();

        if (members.length === 0) {
            membersDiv.textContent = 'メンバーが見つかりませんでした。';
            return;
        }

        // メンバー情報を表示
        for (const member of members) {
            const memberElement = document.createElement('div');
            memberElement.classList.add('member');

            // メンバーの基本情報（JSONに含まれている値を使う）
            const avatar = document.createElement('img');
            avatar.src = member.avatar_url;
            avatar.alt = `${member.login}'s avatar`;
            avatar.classList.add('avatar');

            const id = document.createElement('p');
            id.textContent = `ID: ${member.login}`;

            const username = document.createElement('p');
            username.textContent = `username: ${member.name || ''}`;

            const profileLink = document.createElement('a');
            profileLink.href = member.html_url;
            profileLink.textContent = 'GitHub Profile';

            // パーティクル情報を取得
            const particlesResponse = await fetch(`_members/${member.login}.md`);
            if (particlesResponse.ok) {
                const particleText = await particlesResponse.text();

                // Markdownを解析してパーティクルを表示
                const particleElement = document.createElement('pre');
                particleElement.textContent = `Particles: \n${particleText}`;
                memberElement.appendChild(particleElement);
            } else {
                console.warn(`No particle file found for user: ${member.login}`);
            }

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
