const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const membersDir = path.join(__dirname, '_members'); // _membersディレクトリのパス
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG_NAME = 'Drowse-Lab'; // 組織名

// GitHub API で組織メンバーを取得
async function fetchMembers() {
    try {
        const response = await fetch(`https://api.github.com/orgs/${ORG_NAME}/members`, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch members: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching members:', error);
        throw error;
    }
}

// メンバーごとのファイルを生成
async function generateMemberFiles() {
    try {
        // _membersディレクトリを作成（存在しない場合）
        if (!fs.existsSync(membersDir)) {
            fs.mkdirSync(membersDir, { recursive: true });
        }

        const members = await fetchMembers();

        members.forEach((member) => {
            const filePath = path.join(membersDir, `${member.login}.md`); // メンバーID用のファイル名

            if (!fs.existsSync(filePath)) {
                const content = `# ${member.login}\n\nparticles:\n  - type: default\n`;
                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`Created file: ${filePath}`);
            } else {
                console.log(`File already exists: ${filePath}`);
            }
        });
    } catch (error) {
        console.error('Error generating member files:', error);
        process.exit(1);
    }
}

// 実行
generateMemberFiles();
