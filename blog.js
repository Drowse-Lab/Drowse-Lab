// GitHub APIからMarkdownファイルを取得して表示
const loadBlogPosts = async () => {
  const postsDiv = document.getElementById("blogPosts");
  postsDiv.innerHTML = "読み込み中...";

  try {
    // GitHub APIを使用して_postsディレクトリ内のファイル一覧を取得
    const headers = {
      Authorization: `Bearer YOUR_PERSONAL_ACCESS_TOKEN` // トークンを置き換えてください
    };
    const response = await fetch('https://api.github.com/repos/Drowse-Lab/Drowse-Lab/contents/_posts', { headers });
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
      const html = marked(text);

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

// ページロード時にブログ記事を読み込む
window.onload = async () => {
  await loadBlogPosts();
};
