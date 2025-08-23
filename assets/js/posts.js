// Wait for allPosts to be defined
let allPosts = window.allPosts || [];

// Initialize when script loads (called after data is loaded)
if (typeof populateFilters === 'function') {
  try { populateFilters(); } catch (e) { console.error('Error in populateFilters:', e); }
}
if (typeof renderPosts === 'function') {
  try { renderPosts(); } catch (e) { console.error('Error in renderPosts:', e); }
}

document.addEventListener("DOMContentLoaded", () => {

  // --- コードブロック装飾処理ここから ---
  document.querySelectorAll("pre code").forEach((codeBlock) => {
    // 正確に language-XXX を取得する（複数クラス対応）
    let language = "txt";
    codeBlock.classList.forEach(cls => {
      if (cls.startsWith("language-")) {
        language = cls.substring(9).trim(); // "language-".length === 9
      }
    });

    const wrapper = document.createElement("div");
    wrapper.className = "code-box";

    // ┌ .ext [コピー] ┐
    const top = document.createElement("div");
    top.className = "code-box-top";
    top.innerHTML = `
      <span class="corner">┌</span>
      <span class="label">.${language}</span>
      <button class="copy-btn">[コピー]</button>
      <span class="corner">┐</span>
    `;

    // │ 1行ずつ │
    const mid = document.createElement("div");
    mid.className = "code-box-middle";
    const lines = codeBlock.textContent.split("\n");
    lines.forEach(line => {
      const lineEl = document.createElement("div");
      lineEl.className = "code-line";
      lineEl.textContent = `│ ${line}`;
      mid.appendChild(lineEl);
    });

    // └────────────┘
    const bottom = document.createElement("div");
    bottom.className = "code-box-bottom";
    bottom.innerHTML = `
      <span class="corner">└</span>
      <span class="filler">──────────────────────────────</span>
      <span class="corner">┘</span>
    `;

    // コピーボタン
    const copyBtn = top.querySelector(".copy-btn");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        copyBtn.textContent = "[コピー済み！]";
        setTimeout(() => {
          copyBtn.textContent = "[コピー]";
        }, 1500);
      });
    });

    wrapper.appendChild(top);
    wrapper.appendChild(mid);
    wrapper.appendChild(bottom);

    const pre = codeBlock.parentElement;
    pre.parentElement.replaceChild(wrapper, pre);
  });
  // --- コードブロック装飾処理ここまで ---
});
