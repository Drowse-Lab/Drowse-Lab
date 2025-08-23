const fs = require('fs');
const path = require('path');

const membersJsonPath = path.join(__dirname, '../../assets/data/members.json'); // JSONのパス
const membersDir = path.join(__dirname, '..'); // _membersディレクトリのパス

// JSONからgithubユーザー名リストを作成
function getMembersFromJson() {
    const json = fs.readFileSync(membersJsonPath, 'utf-8');
    const membersArr = JSON.parse(json);
    return membersArr.map(member => {
        // github_linkからユーザー名だけ取り出す
        const match = member.github_link.match(/github\.com\/([A-Za-z0-9_-]+)$/);
        return match ? match[1] : null;
    }).filter(Boolean).map(login => ({ login }));
}

// メンバーの設定を確認またはデフォルト設定を適用
function ensureDefaultSettings() {
    try {
        const members = getMembersFromJson();

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

ensureDefaultSettings();
