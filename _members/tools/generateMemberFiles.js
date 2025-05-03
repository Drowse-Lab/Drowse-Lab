const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const membersDir = path.join(__dirname, '_members'); // _membersディレクトリのパス
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ORG_NAME = 'Drowse-Lab'; // 組織名

// GitHub APIで組織メンバーを取得
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

// メンバーの設定を確認またはデフォルト設定を適用
async function ensureDefaultSettings() {
    try {
        const members = await fetchMembers();

        members.forEach((member) => {
            const filePath = path.join(membersDir, `${member.login}.md`); // メンバーID用のファイル名

            if (!fs.existsSync(filePath)) {
                // ファイルがない場合、デフォルト設定を適用（ファイル生成はしない）
                console.log(`No file found for ${member.login}, using default settings.`);
                const defaultContent = `# ${member.login}\n\nparticles:\n  - type: default\n`;
                // 必要に応じて、defaultContent を他の処理に渡す
            } else {
                console.log(`File exists for ${member.login}: ${filePath}`);
            }
        });
    } catch (error) {
        console.error('Error ensuring default settings:', error);
        process.exit(1);
    }
}

// 実行
ensureDefaultSettings();
