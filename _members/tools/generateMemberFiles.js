const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// `_members/` ディレクトリのパス
const membersDir = path.join(__dirname, '_members');

// GitHub API トークン (GitHub Actions の GITHUB_TOKEN を使用)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG_NAME = 'Drowse-Lab'; // 組織名

// GitHub API からメンバー情報を取得
async function fetchMembers() {
    const response = await fetch(`https://api.github.com/orgs/${ORG_NAME}/members`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.statusText}`);
    }

    return response.json();
}

// メンバー用のファイルを生成
async function generateMemberFiles() {
    if (!fs.existsSync(membersDir)) {
        fs.mkdirSync(membersDir);
    }

    const members = await fetchMembers();

    members.forEach((member) => {
        const filePath = path.join(membersDir, `${member.login}.md`);

        if (!fs.existsSync(filePath)) {
            const content = `# ${member.login}\n\nparticles:\n  - type: default\n`;
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Created file: ${filePath}`);
        } else {
            console.log(`File already exists: ${filePath}`);
        }
    });
}

// 実行
generateMemberFiles().catch((error) => {
    console.error('Error generating member files:', error);
    process.exit(1);
});
