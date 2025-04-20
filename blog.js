// postsフォルダからMarkdownファイルを動的に取得して表示
const response = await fetch('https://api.github.com/repos/Drowse-Lab/Drowse-Lab/contents/_posts');
const files = await response.json();
const markdownFiles = files.filter(file => file.name.endsWith(".md"));
const loadBlogPosts = async () => {
  const postsDiv = document.getElementById("blogPosts");
  postsDiv.innerHTML = "読み込み中...";

  try {
    // GitHub APIを使用してpostsフォルダ内のファイル一覧を取得
    const response = await fetch('https://api.github.com/repos/Drowse-Lab/Drowse-Lab/contents/posts');
    if (!response.ok) {
      throw new Error("Markdownファイルの取得に失敗しました");
    }

    const files = await response.json();
    const markdownFiles = files.filter(file => file.name.endsWith(".md")); // .mdファイルのみを取得

    postsDiv.innerHTML = ""; // 初期化

    for (const file of markdownFiles) {
      const fileResponse = await fetch(file.download_url); // ファイルの内容を取得
      const text = await fileResponse.text();

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
    } else if (line.startsWith("### ")) {
      html += `<h3>${line.substring(4)}</h3>`;
    } else if (line.startsWith("- ")) {
      html += `<li>${line.substring(2)}</li>`;
    } else if (line.trim() === "") {
      html += "<br>";
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
