const loadBlogPosts = async () => {
  const postsDiv = document.getElementById("blogPosts");
  postsDiv.innerHTML = "読み込み中...";

  try {
    // GitHub APIからMarkdownファイルを取得
    const headers = {
      Authorization: `Bearer YOUR_PERSONAL_ACCESS_TOKEN` // 必要に応じてトークンを追加
    };
    const response = await fetch('https://api.github.com/repos/Drowse-Lab/Drowse-Lab/contents/posts', { headers });
    if (!response.ok) {
      throw new Error("Markdownファイルの取得に失敗しました");
    }

    const files = await response.json();
    const markdownFiles = files.filter(file => file.name.endsWith(".md"));

    postsDiv.innerHTML = ""; // 初期化

    for (const file of markdownFiles) {
      const fileResponse = await fetch(file.download_url);
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

window.onload = async () => {
  await loadBlogPosts();
};
