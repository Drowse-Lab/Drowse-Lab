// scripts/get-theme-img.js

const fs = require('fs');
const path = require('path');

const themeDir = path.join(__dirname, '/theme');
const outPath = path.join(__dirname, '/assets/data/theme-list.json');

// themeディレクトリ内の全ての.mdファイルを取得
const files = fs.readdirSync(themeDir).filter(f => f.endsWith('.md'));

const result = [];

for (const file of files) {
  const repoName = path.basename(file, '.md');
  const content = fs.readFileSync(path.join(themeDir, file), 'utf-8');
  // img: xxx の値を抽出（なければnull）
  const imgMatch = content.match(/^img:\s*(\S+)/m);
  result.push({
    repo: repoName,
    img: imgMatch ? imgMatch[1] : null
  });
}

// JSONとして書き出し
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
console.log('theme-list.json generated:', outPath);
