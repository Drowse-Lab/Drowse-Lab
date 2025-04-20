// postsフォルダからMarkdownファイルを取得して表示
const loadBlogPosts = async () => {
  const postsDiv = document.getElementById("blogPosts");
  postsDiv.innerHTML = "読み込み中...";

  try {
    // postsフォルダ内のファイルを指定
    const posts = ["2025-04-20-welcome.md"]; // 必要に応じてファイル名を追加
    postsDiv.innerHTML = ""; // 初期化

    for (const post of posts) {
      const response = await fetch(`posts/${post}`);
      const text = await response.text();

      // MarkdownをHTMLに変換
      const html = parseMarkdownToHtml(text);

      const postElement = document.createElement("div");
      postElement.className = "post";
      postElement.innerHTML = html;
      postsDiv.appendChild(postElement);
    }
  } catch (error) {
    postsDiv.innerHTML = "記事の読み込み中にエラーが発生しました。";
    console.error(error);
  }
};

// MarkdownをHTMLに変換
const parseMarkdownToHtml = (markdown) => {
  const lines = markdown.split("\n");
  let html = "";

  lines.forEach((line) => {
    if (line.startsWith("# ")) {
      html += `<h1>${line.substring(2)}</h1>`;
    } else if (line.startsWith("## ")) {
      html += `<h2>${line.substring(3)}</h2>`;
    } else if (line.startsWith("---")) {
      // メタデータはスキップ
    } else {
      html += `<p>${line}</p>`;
    }
  });

  return html;
};

// ページロード時にブログ記事を読み込む
window.onload = () => {
  loadBlogPosts();
};