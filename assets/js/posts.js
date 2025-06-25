const allPosts = window.allPosts || [];

document.addEventListener("DOMContentLoaded", () => {
  try { populateFilters(); } catch (e) {}
  try { renderPosts(); } catch (e) {}

  // --- コードブロック装飾処理ここから ---
  document.querySelectorAll("pre code").forEach((codeBlock) => {
  const classList = codeBlock.className.split(" ");
  const langClass = classList.find(cls => cls.startsWith("language-"));
  const language = langClass ? langClass.replace("language-", "").trim() : "txt";

    // ラッパー
    const wrapper = document.createElement("div");
    wrapper.className = "code-box";

    // ┌───────
    const top = document.createElement("div");
    top.className = "code-box-top";
    top.innerHTML = `
      <span class="corner">┌</span>
      <span class="label">.${language}</span>
      <button class="copy-btn">[コピー]</button>
      <span class="corner">┐</span>`;

    // │ 中身
    const mid = document.createElement("div");
    mid.className = "code-box-middle";

    const lines = codeBlock.textContent.split("\n");
    lines.forEach(line => {
      const lineEl = document.createElement("div");
      lineEl.className = "code-line";
      lineEl.textContent = `│ ${line}`;
      mid.appendChild(lineEl);
    });

    // └───────
    const bottom = document.createElement("div");
    bottom.className = "code-box-bottom";
    bottom.innerHTML = `
      <span class="corner">└</span>
      <span class="filler">──────────────────────────────</span>
      <span class="corner">┘</span>`;

    // コピーイベント
    const copyBtn = top.querySelector(".copy-btn");
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        copyBtn.textContent = "[コピー済み！]";
        setTimeout(() => {
          copyBtn.textContent = "[コピー]";
        }, 1500);
      });
    });

    // DOM置換
    const pre = codeBlock.parentElement;
    pre.parentElement.replaceChild(wrapper, pre);
    wrapper.appendChild(top);
    wrapper.appendChild(mid);
    wrapper.appendChild(bottom);
  });
  // --- コードブロック装飾処理ここまで ---
});
