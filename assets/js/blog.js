const allPosts = window.allPosts || [];

let selectedTags = new Set();
let selectedAuthors = new Set();
let selectedYear = "";
let selectedMonth = "";

// 投稿カード描画
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

// 投稿フィルター処理
function renderPosts() {
  const filtered = allPosts.filter(post => {
    const tagMatch = selectedTags.size === 0 || post.tags.some(tag => selectedTags.has(tag));
    const authorMatch = selectedAuthors.size === 0 || selectedAuthors.has(post.author);
    const yearMatch = selectedYear === "" || post.date.startsWith(selectedYear);
    const monthMatch = selectedMonth === "" || post.date.slice(5, 7) === selectedMonth;
    return tagMatch && authorMatch && yearMatch && monthMatch;
  });

  renderFilteredPosts(filtered);
}

// タグ・投稿者フィルターUI
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

// タグ・投稿者の初期化
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

// 年セレクト生成
function populateYearFilter() {
  const yearSelect = document.getElementById("yearFilter");
  const years = new Set();

  allPosts.forEach(post => {
    const year = post.date.slice(0, 4);
    years.add(year);
  });

  const sortedYears = Array.from(years).sort().reverse();
  sortedYears.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = `${year}年`;
    yearSelect.appendChild(option);
  });

  yearSelect.addEventListener("change", () => {
    selectedYear = yearSelect.value;
    renderPosts();
  });
}

// 月ボタン生成（カレンダー風）
function populateMonthButtons() {
  const monthGrid = document.getElementById("monthGrid");
  const months = [
    "01", "02", "03", "04", "05", "06",
    "07", "08", "09", "10", "11", "12"
  ];

  months.forEach(month => {
    const button = document.createElement("button");
    button.textContent = `${parseInt(month)}月`;
    button.className = "month-button";
    button.dataset.value = month;
    button.addEventListener("click", () => {
      // 選択状態トグル
      if (selectedMonth === month) {
        selectedMonth = "";
        button.classList.remove("active");
      } else {
        selectedMonth = month;
        document.querySelectorAll(".month-button").forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
      }
      renderPosts();
    });
    monthGrid.appendChild(button);
  });
}

// DOM準備完了後の初期化
document.addEventListener("DOMContentLoaded", () => {
  populateFilters();
  populateYearFilter();
  populateMonthButtons();
  renderPosts();

  const filterSidebar = document.getElementById("filterSidebar");
  const toggleBtn = document.getElementById("filterToggle");
  const closeBtn = document.getElementById("filterClose");

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
});
