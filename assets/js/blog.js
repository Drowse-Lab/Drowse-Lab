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

// 年フィルター生成
function populateYearFilter() {
  const yearSelect = document.getElementById("yearFilter");
  const years = new Set();

  allPosts.forEach(post => {
    years.add(post.date.slice(0, 4));
  });

  Array.from(years).sort().reverse().forEach(year => {
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

// 月ボタン作成
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
      if (selectedMonth === month) {
        selectedMonth = "";
        selectedDay = "";
        button.classList.remove("active");
        document.getElementById("dayGrid").innerHTML = "";
      } else {
        selectedMonth = month;
        selectedDay = "";
        document.querySelectorAll(".month-button").forEach(b => b.classList.remove("active"));
        button.classList.add("active");
        populateDayButtons(selectedYear, month);
      }
      renderPosts();
    });
    monthGrid.appendChild(button);
  });
}

// 日ボタン作成
function populateDayButtons(year, month) {
  const dayGrid = document.getElementById("dayGrid");
  dayGrid.innerHTML = "";

  if (!year || !month) return;

  const daysInMonth = new Date(year, parseInt(month), 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = d.toString().padStart(2, "0");
    const btn = document.createElement("button");
    btn.textContent = `${d}日`;
    btn.className = "day-button";
    btn.dataset.value = dayStr;
    btn.addEventListener("click", () => {
      if (selectedDay === dayStr) {
        selectedDay = "";
        btn.classList.remove("active");
      } else {
        selectedDay = dayStr;
        document.querySelectorAll(".day-button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      }
      renderPosts();
    });
    dayGrid.appendChild(btn);
  }
}

// 初期化処理
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
