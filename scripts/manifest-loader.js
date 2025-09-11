// /script/manifest-loader.js
function addManifestTag(manifestUrl = "/assets/data/manifest.json") {
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = manifestUrl;
    document.head.appendChild(link);
  }
}

// ページロード時に自動追加
window.addEventListener("DOMContentLoaded", () => {
  addManifestTag();
});
