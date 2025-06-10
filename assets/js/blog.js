const allPosts = window.allPosts || [];

let selectedTags = new Set();
let selectedAuthors = new Set();
let selectedYearMonth = ""; // 年月選択フィルター

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

function renderPosts() {
  const filtered = allPosts.filter(post => {
    const tagMatch = selectedTags.size === 0 || post.tags.some(tag => selectedTags.has(tag));
    const authorMatch = selectedAuthors.size === 0 || selectedAuthors.has(post.author);
    const dateMatch = selectedYearMonth === "" || post.date.startsWith(selectedYearMonth);
    return tagMatch && authorMatch && dateMatch;
  });

  renderFilteredPosts(filtered);
}

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

  if (dateInput) {
    dateInput.addEventListener("change", () => {
      selectedYearMonth = dateInput.value; // "2025-06" の形式
      renderPosts();
    });
  }
});
