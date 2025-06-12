const allPosts = window.allPosts || [];

let selectedTags = new Set();
let selectedAuthors = new Set();
let selectedYear = "";
let selectedMonth = "";
let selectedDay = "";

// 投稿表示処理
function renderFilteredPosts(posts) {
  const container = document.getElementById("posts");
  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML = "<p>該当する記事がありません。</p>";
    return;
  }

  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "post-card";
    div.innerHTML = `
      <h2><a href="${post.url}">${post.title}</a></h2>
      <p class="excerpt">${post.date} に投稿</p>
      <div class="post-meta">
        <span>タグ: ${post.tags.join(", ")}</span>
        <span>投稿者: ${post.author}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

// 絞り込み処理
function renderPosts() {
  const filtered = allPosts.filter(post => {
    const tagMatch = selectedTags.size === 0 || post.tags.some(tag => selectedTags.has(tag));
    const authorMatch = selectedAuthors.size === 0 || selectedAuthors.has(post.author);
    const yearMatch = selectedYear === "" || post.date.startsWith(selectedYear);
    const monthMatch = selectedMonth === "" || post.date.slice(5, 7) === selectedMonth;
    const dayMatch = selectedDay === "" || post.date.slice(8, 10) === selectedDay;
    return tagMatch && authorMatch && yearMatch && monthMatch && dayMatch;
  });

  renderFilteredPosts(filtered);
}

// タグ・投稿者ボタン作成
function createFilterButtons(set, containerId, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  set.forEach(item => {
    const button = document.createElement("button");
    button.textContent = item;
    button.className = "filter-button";
    button.addEventListener("click", () => {
      const targetSet = type === "tag" ? selectedTags : selectedAuthors;
      if (targetSet.has(item)) {
        targetSet.delete(item);
        button.classList.remove("active");
      } else {
        targetSet.add(item);
        button.classList.add("active");
      }
      renderPosts();
    });
    container.appendChild(button);
  });
}

// タグ・投稿者初期化
function populateFilters() {
  const tagSet = new Set();
  const authorSet = new Set();

  allPosts.forEach(post => {
    post.tags.forEach(tag => tagSet.add(tag));
    authorSet.add(post.author);
  });

  createFilterButtons(tagSet, "tag-buttons", "tag");
  createFilterButtons(authorSet, "author-buttons", "author");
}

// 年・月・日をまとめた日付フィルター
// function populateDateDropdown() {
//   const dateInput = document.getElementById("date-filter");
//   if (!dateInput) return;

//   const dates = [...new Set(allPosts.map(post => post.date))].sort().reverse();

//   dates.forEach(date => {
//     const option = document.createElement("option");
//     option.value = date;
//     option.textContent = date;
//     dateInput.appendChild(option);
//   });

//   dateInput.addEventListener("change", () => {
//     const selected = dateInput.value;
//     if (selected === "") {
//       selectedYear = selectedMonth = selectedDay = "";
//       renderPosts();
//       return;
//     }

//     selectedYear = selected.slice(0, 4);
//     selectedMonth = selected.slice(5, 7);
//     selectedDay = selected.slice(8, 10);
//     renderPosts();
//   });
// }

// 初期化処理
document.addEventListener("DOMContentLoaded", () => {
  populateFilters();
  renderPosts();

  const filterSidebar = document.getElementById("filterSidebar");
  const toggleBtn = document.getElementById("filterToggle");
  const closeBtn = document.getElementById("filterClose");
  const dateInput = document.getElementById("date-filter");

  if (toggleBtn && filterSidebar) {
    toggleBtn.addEventListener("click", () => {
      filterSidebar.classList.toggle("open");
    });
  }

  if (closeBtn && filterSidebar) {
    closeBtn.addEventListener("click", () => {
      filterSidebar.classList.remove("open");
    });
  }

  document.addEventListener("click", (event) => {
    if (
      filterSidebar.classList.contains("open") &&
      !filterSidebar.contains(event.target) &&
      !toggleBtn.contains(event.target)
    ) {
      filterSidebar.classList.remove("open");
    }
  });

  // 日付フィルターのイベント
  if (dateInput) {
    dateInput.addEventListener("change", () => {
      const selectedDate = dateInput.value;
      const filtered = window.allPosts.filter(post => post.date === selectedDate);
      renderFilteredPosts(filtered);
    });
  }
});

// 投稿一覧を描画する関数（通常表示用）
function renderPosts() {
  renderFilteredPosts(window.allPosts);
}

// フィルター適用時用
function renderFilteredPosts(posts) {
  const container = document.getElementById("posts");
  container.innerHTML = "";

  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "post-card";
    div.innerHTML = <a href="${post.url}"><h2>${post.title}</h2></a><p>${post.date}</p>;
    container.appendChild(div);
  });
}
