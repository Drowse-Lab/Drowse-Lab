// 必要: marked.js CDN等で読み込むこと

const fetchMarkdownPosts = async () => {
  const response = await fetch('https://api.github.com/repos/Drowse-Lab/Drowse-Lab/contents/posts');
  if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);
  return await response.json();
};

// front-matter(---で囲む部分)を抜き出してオブジェクト化
function parseFrontMatter(mdText) {
  const fmRegex = /^---\s*([\s\S]*?)\s*---\s*/;
  const match = mdText.match(fmRegex);
  if (!match) return { content: mdText, data: {} };

  const yamlText = match[1];
  const content = mdText.replace(fmRegex, "");
  let data = {};
  yamlText.split('\n').forEach(line => {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) {
      let value = rest.join(':').trim();
      // tags, categories など配列ならパース
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      }
      data[key.trim()] = value;
    }
  });
  return { content, data };
}

const renderPosts = (posts, tagFilter = "", authorFilter = "") => {
  const postsDiv = document.getElementById("blogPosts");
  postsDiv.innerHTML = "";

  posts
    .filter(post => {
      let tagMatch = true, authorMatch = true;
      if (tagFilter) tagMatch = (post.data.tags || []).includes(tagFilter);
      if (authorFilter) authorMatch = post.data.author === authorFilter;
      return tagMatch && authorMatch;
    })
    .forEach(post => {
      const postElement = document.createElement("div");
      postElement.className = "post";
      postElement.innerHTML =
        `<h2>${post.data.title || "無題"}</h2>
         <div class="post-meta">
           <span>${post.data.date || ""}</span>　
           <span>タグ: ${(post.data.tags || []).join(', ')}</span>　
           <span>ユーザー: ${post.data.author || ""}</span>
         </div>
         <div>${marked(post.content)}</div>`;
      postsDiv.appendChild(postElement);
    });
};

const loadBlogPosts = async () => {
  const postsDiv = document.getElementById("blogPosts");
  postsDiv.innerHTML = "読み込み中...";

  try {
    const files = await fetchMarkdownPosts();
    const markdownFiles = files.filter(file => file.name.endsWith(".md"));

    // すべての記事データを取得
    const posts = [];
    for (const file of markdownFiles) {
      const fileResponse = await fetch(file.download_url);
      const text = await fileResponse.text();
      const parsed = parseFrontMatter(text);
      posts.push(parsed);
    }

    // タグとユーザーを抽出してセレクトボックスにセット
    const tagSet = new Set(), authorSet = new Set();
    posts.forEach(post => {
      (post.data.tags || []).forEach(tag => tagSet.add(tag));
      if (post.data.author) authorSet.add(post.data.author);
    });

    const tagFilter = document.getElementById('tagFilter');
    if (tagFilter) {
      tagFilter.innerHTML = `<option value="">すべて</option>` +
        [...tagSet].sort().map(tag => `<option value="${tag}">${tag}</option>`).join('');
    }
    const authorFilter = document.getElementById('authorFilter');
    if (authorFilter) {
      authorFilter.innerHTML = `<option value="">すべて</option>` +
        [...authorSet].sort().map(author => `<option value="${author}">${author}</option>`).join('');
    }

    // イベントハンドラ
    const filterHandler = () => {
      const tag = tagFilter ? tagFilter.value : "";
      const author = authorFilter ? authorFilter.value : "";
