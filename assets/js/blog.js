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

function renderPosts() {
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = "";

  const filteredPosts = allPosts.filter(post => {
    const tagMatch = selectedTags.size === 0 || post.tags.some(tag => selectedTags.has(tag));
    const authorMatch = selectedAuthors.size === 0 || selectedAuthors.has(post.author);
    return tagMatch && authorMatch;
  });

  if (filteredPosts.length === 0) {
    postsContainer.innerHTML = "<p>該当する記事がありません。</p>";
    return;
  }

  filteredPosts.forEach(post => {
    const postElement = document.createElement("div");
    postElement.className = "post-card";
    postElement.innerHTML = `
      <h2><a href="${post.url}">${post.title}</a></h2>
      <p class="excerpt">この記事は ${post.date} に投稿されました。</p>
      <div class="post-meta">
        <span class="post-date">${post.date}</span>
        <span class="category">タグ: ${post.tags.join(", ")}</span>
        <span class="author">投稿者: ${post.author}</span>
      </div>
    `;
    postsContainer.appendChild(postElement);
  });
}

function createFilterButton(name, set, container) {
  const button = document.createElement("button");
  button.textContent = name;
  button.className = "filter-button";
  button.addEventListener("click", () => {
    if (set.has(name)) {
      set.delete(name);
      button.classList.remove("active");
    } else {
      set.add(name);
      button.classList.add("active");
    }
    renderPosts();
  });
  container.appendChild(button);
}

function populateFilters() {
  const tagSet = new Set();
  const authorSet = new Set();

  allPosts.forEach(post => {
    post.tags.forEach(tag => tagSet.add(tag));
    authorSet.add(post.author);
  });

  const tagGroup = document.getElementById("tagFilterGroup");
  const authorGroup = document.getElementById("authorFilterGroup");

  tagSet.forEach(tag => createFilterButton(tag, selectedTags, tagGroup));
  authorSet.forEach(author => createFilterButton(author, selectedAuthors, authorGroup));
}

document.addEventListener("DOMContentLoaded", () => {
  populateFilters();
  renderPosts();
});
