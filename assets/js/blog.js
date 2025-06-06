// // 必要: marked.js CDN等で読み込むこと

// const fetchMarkdownPosts = async () => {
//   const response = await fetch('https://api.github.com/repos/Drowse-Lab/Drowse-Lab/contents/_posts');
//   if (!response.ok) throw new Error(`HTTPエラー: ${response.status}`);
//   return await response.json();
// };

// function parseFrontMatter(mdText) {
//   const fmRegex = /^---\s*([\s\S]*?)\s*---\s*/;
//   const match = mdText.match(fmRegex);
//   if (!match) return { content: mdText, data: {} };

//   const yamlText = match[1];
//   const content = mdText.replace(fmRegex, "");
//   let data = {};
//   yamlText.split('\n').forEach(line => {
//     const [key, ...rest] = line.split(':');
//     if (key && rest.length) {
//       let value = rest.join(':').trim();
//       // tags, categories など配列ならパース
//       if (value.startsWith('[') && value.endsWith(']')) {
//         value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
//       }
//       data[key.trim()] = value;
//     }
//   });
//   return { content, data };
// }

// const renderPosts = (posts, tagFilter = "", authorFilter = "") => {
//   const postsDiv = document.getElementById("blogPosts");
//   postsDiv.innerHTML = "";

//   posts
//     .filter(post => {
//       let tagMatch = true, authorMatch = true;
//       if (tagFilter) tagMatch = (post.data.tags || []).includes(tagFilter);
//       if (authorFilter) authorMatch = post.data.author === authorFilter;
//       return tagMatch && authorMatch;
//     })
//     .forEach(post => {
//       const postElement = document.createElement("div");
//       postElement.className = "post";
//       postElement.innerHTML =
//         `<h2>${post.data.title || "無題"}</h2>
//          <div class="post-meta">
//            <span>${post.data.date || ""}</span>　
//            <span>タグ: ${(post.data.tags || []).join(', ')}</span>　
//            <span>ユーザー: ${post.data.author || ""}</span>
//          </div>
//          <div>${marked(post.content)}</div>`;
//       postsDiv.appendChild(postElement);
//     });
// };

// const loadBlogPosts = async () => {
//   const postsDiv = document.getElementById("blogPosts");
//   postsDiv.innerHTML = "読み込み中...";

//   try {
//     const files = await fetchMarkdownPosts();
//     const markdownFiles = files.filter(file => file.name.endsWith(".md"));

//     const posts = [];
//     for (const file of markdownFiles) {
//       const fileResponse = await fetch(file.download_url);
//       const text = await fileResponse.text();
//       const parsed = parseFrontMatter(text);
//       posts.push(parsed);
//     }

//     const tagSet = new Set(), authorSet = new Set();
//     posts.forEach(post => {
//       (post.data.tags || []).forEach(tag => tagSet.add(tag));
//       if (post.data.author) authorSet.add(post.data.author);
//     });

//     const tagFilter = document.getElementById('tagFilter');
//     if (tagFilter) {
//       tagFilter.innerHTML = `<option value="">すべて</option>` +
//         [...tagSet].sort().map(tag => `<option value="${tag}">${tag}</option>`).join('');
//     }
//     const authorFilter = document.getElementById('authorFilter');
//     if (authorFilter) {
//       authorFilter.innerHTML = `<option value="">すべて</option>` +
//         [...authorSet].sort().map(author => `<option value="${author}">${author}</option>`).join('');
//     }

//     // イベントハンドラ
//     const filterHandler = () => {
//       const tag = tagFilter ? tagFilter.value : "";
//       const author = authorFilter ? authorFilter.value : "";
//       renderPosts(posts, tag, author);
//     };
//     if (tagFilter) tagFilter.onchange = filterHandler;
//     if (authorFilter) authorFilter.onchange = filterHandler;

//     // 初期表示
//     renderPosts(posts);

//   } catch (error) {
//     postsDiv.innerHTML = `記事の読み込み中にエラーが発生しました: ${error.message}`;
//     console.error('Error:', error);
//   }
// };

// window.onload = async () => {
//   await loadBlogPosts();
// };
// document.getElementById("tagFilter").addEventListener("change", renderPosts);
// document.getElementById("authorFilter").addEventListener("change", renderPosts);

// 記事データを保持する配列（JekyllでブログHTMLに埋め込む前提）
const allPosts = window.allPosts || [];

function renderPosts() {
  const tagFilter = document.getElementById("tagFilter");
  const authorFilter = document.getElementById("authorFilter");
  const selectedTag = tagFilter ? tagFilter.value : "all";
  const selectedAuthor = authorFilter ? authorFilter.value : "all";

  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = ""; // 投稿リストをリセット

  const filteredPosts = allPosts.filter(post => {
    const tagMatch = selectedTag === "all" || post.tags.includes(selectedTag);
    const authorMatch = selectedAuthor === "all" || post.author === selectedAuthor;
    return tagMatch && authorMatch;
  });

  if (filteredPosts.length === 0) {
    postsContainer.innerHTML = "<p>該当する記事がありません。</p>";
    return;
  }

  filteredPosts.forEach(post => {
    const postElement = document.createElement("div");
    postElement.className = "post";
    postElement.innerHTML = `
      <li>
        <a href="${post.url}">${post.title}</a>
        <p>${post.date} - ${post.author}</p>
        <p>タグ: ${post.tags.join(", ")}</p>
      </li>
    `;
    postsContainer.appendChild(postElement);
  });
}

function populateFilters() {
  const tagSet = new Set();
  const authorSet = new Set();

  allPosts.forEach(post => {
    post.tags.forEach(tag => tagSet.add(tag));
    authorSet.add(post.author);
  });

  const tagFilter = document.getElementById("tagFilter");
  const authorFilter = document.getElementById("authorFilter");

  // タグフィルター
  if (tagFilter) {
    tagFilter.innerHTML = `<option value="all">すべて</option>`;
    Array.from(tagSet).sort().forEach(tag => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      tagFilter.appendChild(option);
    });
  }

  // 著者フィルター
  if (authorFilter) {
    authorFilter.innerHTML = `<option value="all">すべて</option>`;
    Array.from(authorSet).sort().forEach(author => {
      const option = document.createElement("option");
      option.value = author;
      option.textContent = author;
      authorFilter.appendChild(option);
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  populateFilters(); // フィルター項目を初期化
  renderPosts();     // 初期表示

  const tagFilter = document.getElementById("tagFilter");
  const authorFilter = document.getElementById("authorFilter");

  if (tagFilter) {
    tagFilter.addEventListener("change", renderPosts);
  }
  if (authorFilter) {
    authorFilter.addEventListener("change", renderPosts);
  }
});
