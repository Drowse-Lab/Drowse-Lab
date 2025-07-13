const allPosts = window.allPosts || [];

let selectedTags = new Set();
let selectedAuthors = new Set();
let selectedDate = null;

function renderPosts() {
  const postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = "";

console.log("----- DEBUG FILTER START -----");
console.log(allPosts);
console.log("selectedDate:", selectedDate);
allPosts.forEach(post => {
  const isPublished = post.published;
  const matchesDate = selectedDate ? (post.date === selectedDate) : true;
  const tagMatch = selectedTags.size === 0 || post.tags.some(tag => selectedTags.has(tag));
  const authorMatch = selectedAuthors.size === 0 || selectedAuthors.has(post.author);
  const result = (isPublished !== false && isPublished !== "false") &&
                 ((isPublished === true || isPublished === "true") && selectedDate !== null ? post.date === selectedDate : true) &&
                 tagMatch && authorMatch;
  console.log(`[${result ? "✔" : "✘"}] "${post.title}" | published: ${isPublished} | date: ${post.date} | selectedDate: ${selectedDate}`);
});
console.log("----- DEBUG FILTER END -----");

console.log("Filtering posts... published + date check");


  
const filtered = allPosts.filter(post => {
  console.log("▶️ raw onlydate:", post.onlydate, "| type:", typeof post.onlydate);

  const onlyDate = post.onlydate === true || post.onlydate === "true";

  // post.date から "YYYY-MM-DD" を抽出
  const postDate = typeof post.date === "string"
    ? post.date.slice(0, 10) // 例: "2025-06-08"
    : "";

  const matchesDate = selectedDate && postDate === selectedDate;

  if (onlyDate && !matchesDate) {
    console.log(`[SKIP] "${post.title}" onlyDate:trueだけど日付不一致: ${postDate} vs ${selectedDate}`);
    return false;
  }

  // タグとユーザーのフィルター（常にチェック）
  const tagMatch = selectedTags.size === 0 || post.tags?.some(tag => selectedTags.has(tag));
  const authorMatch = selectedAuthors.size === 0 || selectedAuthors.has(post.author);

  const ok = tagMatch && authorMatch;

  console.log(`[RESULT] "${post.title}" → onlyDate:${onlyDate}, matchesDate:${matchesDate}, tag:${tagMatch}, author:${authorMatch}, pass:${ok}`);
  return ok;
});





console.log("=== FILTERED POSTS ===");
console.log(filtered);

  if (filtered.length === 0) {
    postsContainer.innerHTML = '<h2 style="text-align:center; margin:2em 0; color:#000;">該当する記事がありません</h2>';
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
  container.innerHTML = "";

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
  populateFilters?.();
  renderPosts?.();

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
      filterSidebar?.classList.contains("open") &&
      !filterSidebar.contains(event.target) &&
      !toggleBtn.contains(event.target)
    ) {
      filterSidebar.classList.remove("open");
    }
  });

  if (dateInput) {
    dateInput.addEventListener("change", () => {
      const date = new Date(dateInput.value);
      if (!isNaN(date.getTime())) {
        selectedDate = date.toISOString().slice(0, 10);
      } else {
        selectedDate = null;
      }
      renderPosts();
    });
  }
});
