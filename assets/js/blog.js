// // 記事データを保持する配列（JekyllでブログHTMLに埋め込む前提）
// const allPosts = window.allPosts || [];


// function renderPosts() {
//   const tagFilter = document.getElementById("tagFilter");
//   const authorFilter = document.getElementById("authorFilter");
//   const selectedTag = tagFilter ? tagFilter.value : "all";
//   const selectedAuthor = authorFilter ? authorFilter.value : "all";

//   const postsContainer = document.getElementById("posts");
//   postsContainer.innerHTML = ""; // 投稿リストをリセット

//   const filteredPosts = allPosts.filter(post => {
//     const tagMatch = selectedTag === "all" || post.tags.includes(selectedTag);
//     const authorMatch = selectedAuthor === "all" || post.author === selectedAuthor;
//     return tagMatch && authorMatch;
//   });

//   if (filteredPosts.length === 0) {
//     postsContainer.innerHTML = "<p>該当する記事がありません。</p>";
//     return;
//   }

//   filteredPosts.forEach(post => {
//     const postElement = document.createElement("div");
//     postElement.className = "post-card"; // ここを変更！

//     postElement.innerHTML = `
//       <h2><a href="${post.url}">${post.title}</a></h2>
//       <p class="excerpt">この記事は ${post.date} に投稿されました。</p>
//       <div class="post-meta">
//         <span class="post-date">${post.date}</span>
//         <span class="category">タグ: ${post.tags.join(", ")}</span>
//         <span class="author">投稿者: ${post.author}</span>
//       </div>
//     `;

//     postsContainer.appendChild(postElement);
//   });
// }

// function populateFilters() {
//   const tagSet = new Set();
//   const authorSet = new Set();

//   allPosts.forEach(post => {
//     post.tags.forEach(tag => tagSet.add(tag));
//     authorSet.add(post.author);
//   });

//   const tagFilter = document.getElementById("tagFilter");
//   const authorFilter = document.getElementById("authorFilter");

//   // タグフィルター
//   if (tagFilter) {
//     tagFilter.innerHTML = `<option value="all">すべて</option>`;
//     Array.from(tagSet).sort().forEach(tag => {
//       const option = document.createElement("option");
//       option.value = tag;
//       option.textContent = tag;
//       tagFilter.appendChild(option);
//     });
//   }

//   // 著者フィルター
//   if (authorFilter) {
//     authorFilter.innerHTML = `<option value="all">すべて</option>`;
//     Array.from(authorSet).sort().forEach(author => {
//       const option = document.createElement("option");
//       option.value = author;
//       option.textContent = author;
//       authorFilter.appendChild(option);
//     });
//   }
// }

// document.addEventListener("DOMContentLoaded", function () {
//   populateFilters(); // フィルター項目を初期化
//   renderPosts();     // 初期表示

//   const tagFilter = document.getElementById("tagFilter");
//   const authorFilter = document.getElementById("authorFilter");

//   if (tagFilter) {
//     tagFilter.addEventListener("change", renderPosts);
//   }
//   if (authorFilter) {
//     authorFilter.addEventListener("change", renderPosts);
//   }
// });
const allPosts = window.allPosts || [];

const selectedTags = new Set();
const selectedAuthors = new Set();

function createFilterButtons(filterId, items, selectedSet, onClickCallback) {
  const container = document.getElementById(filterId);
  container.querySelectorAll("button").forEach(btn => btn.remove());

  items.forEach(item => {
    const btn = document.createElement("button");
    btn.className = "filter-button";
    btn.textContent = item;
    btn.addEventListener("click", () => {
      if (selectedSet.has(item)) {
        selectedSet.delete(item);
        btn.classList.remove("active");
      } else {
        selectedSet.add(item);
        btn.classList.add("active");
      }
      onClickCallback(); // フィルター再描画
    });
    container.appendChild(btn);
  });
}

function renderPosts() {
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = "";

  const filtered = allPosts.filter(post => {
    const tagMatch = selectedTags.size === 0 || post.tags.some(tag => selectedTags.has(tag));
    const authorMatch = selectedAuthors.size === 0 || selectedAuthors.has(post.author);
    return tagMatch && authorMatch;
  });

  if (filtered.length === 0) {
    postsContainer.innerHTML = "<p>該当する記事がありません。</p>";
    return;
  }

  filtered.forEach(post => {
    const div = document.createElement("div");
    div.className = "post-card";
    div.innerHTML = `
      <h2><a href="${post.url}">${post.title}</a></h2>
      <p>${post.date} - ${post.author}</p>
      <p>タグ: ${post.tags.join(", ")}</p>
    `;
    postsContainer.appendChild(div);
  });
}

function setupFilters() {
  const tagSet = new Set();
  const authorSet = new Set();

  allPosts.forEach(post => {
    post.tags.forEach(tag => tagSet.add(tag));
    authorSet.add(post.author);
  });

  createFilterButtons("filter-tags", Array.from(tagSet).sort(), selectedTags, renderPosts);
  createFilterButtons("filter-authors", Array.from(authorSet).sort(), selectedAuthors, renderPosts);
}

document.addEventListener("DOMContentLoaded", () => {
  setupFilters();
  renderPosts();
});
