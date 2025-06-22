const allPosts = window.allPosts || [];

let selectedTags = new Set();
let selectedAuthors = new Set();

function renderPosts() {
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = ""; // 投稿リセット

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
    const postElement = document.createElement("div");
    postElement.className = "post-card";
    postElement.innerHTML = `
      <h2><a href="${post.url}">${post.title}</a></h2>
      <p class="excerpt">${post.date} に投稿</p>
      <div class="post-meta">
        <span>タグ: ${post.tags.join(", ")}</span>
        <span>投稿者: ${post.author}</span>
      </div>
    `;
    postsContainer.appendChild(postElement);
  });
}

function createFilterButtons(set, containerId, type) {
  const container = document.getElementById(containerId);
  container.innerHTML = ""; // 一度リセット

  set.forEach(item => {
    const button = document.createElement("button");
    button.textContent = item;
    button.className = "filter-button";
    button.addEventListener("click", () => {
      const activeSet = type === "tag" ? selectedTags : selectedAuthors;
      if (activeSet.has(item)) {
        activeSet.delete(item);
        button.classList.remove("active");
      } else {
        activeSet.add(item);
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
      const selectedDate = dateInput.value;
      const filtered = window.allPosts.filter(post => post.date === selectedDate);
      renderFilteredPosts(filtered);
    });
  }

  // --- コードブロック装飾処理ここから ---
  document.querySelectorAll("pre code").forEach((codeBlock) => {
    const language = codeBlock.className.replace("language-", "").trim();
    const wrapper = document.createElement("div");
    wrapper.className = "code-embed";

    const header = document.createElement("div");
    header.className = "code-header";

    const ext = document.createElement("span");
    ext.className = "extension";
    ext.textContent = "." + (language || "txt");

    const button = document.createElement("button");
    button.className = "copy-button";
    button.textContent = "コピー";
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        button.textContent = "コピー済み！";
        setTimeout(() => {
          button.textContent = "コピー";
        }, 1500);
      });
    });

    header.appendChild(ext);
    header.appendChild(button);

    const pre = codeBlock.parentElement;
    pre.parentElement.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
  });
  // --- コードブロック装飾ここまで ---
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
    div.innerHTML = `<a href="${post.url}"><h2>${post.title}</h2></a><p>${post.date}</p>`;
    container.appendChild(div);
  });
}
