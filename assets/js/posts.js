const allPosts = window.allPosts || [];

document.addEventListener("DOMContentLoaded", () => {
  populateFilters?.();
  renderPosts?.();
  // --- コードブロック装飾処理ここから ---
  document.querySelectorAll("pre code").forEach((codeBlock) => {
    const language = codeBlock.className.replace("language-", "").trim() || "txt";

    const wrapper = document.createElement("div");
    wrapper.className = "code-box";

    const top = document.createElement("div");
    top.className = "code-box-top";

    const ext = document.createElement("span");
    ext.className = "ext";
    ext.textContent = `.${language}`;

    const button = document.createElement("button");
    button.className = "copy-btn";
    button.textContent = "コピー";
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        button.textContent = "コピー済み！";
        setTimeout(() => {
          button.textContent = "コピー";
        }, 1500);
      });
    });

    top.appendChild(ext);
    top.appendChild(button);

    const mid = document.createElement("div");
    mid.className = "code-box-middle";
    const preClone = codeBlock.parentElement.cloneNode(true);
    mid.appendChild(preClone);

    const bottom = document.createElement("div");
    bottom.className = "code-box-bottom";

    wrapper.appendChild(top);
    wrapper.appendChild(mid);
    wrapper.appendChild(bottom);

    const pre = codeBlock.parentElement;
    pre.parentElement.replaceChild(wrapper, pre);
  });
  // --- コードブロック装飾処理ここまで ---
});

