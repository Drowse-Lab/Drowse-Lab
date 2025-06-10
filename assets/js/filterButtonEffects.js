document.addEventListener("DOMContentLoaded", () => {
  const filterBtn = document.getElementById('filterToggle');
  const fastForwardBtn = document.getElementById('fastForwardButton');
  const resetBtn = document.getElementById('resetButton');
  const nav = document.querySelector('nav');

  let navCollisions = 0;
  const MAX_COLLISION = 5;
  let mossStage = 0;
  const MAX_MOSS = 4;
  let alreadyCollided = false; // 連続判定防止

  function spawnShards(x, y, count = 12) {
    for(let i=0; i<count; i++) {
      const shard = document.createElement('div');
      shard.className = 'shard';
      document.body.appendChild(shard);
      const angle = Math.random() * 2 * Math.PI;
      const distance = 30 + Math.random() * 40;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      shard.style.left = `${x - 4}px`;
      shard.style.top = `${y - 4}px`;
      setTimeout(() => {
        shard.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.random()*360}deg) scale(${0.6 + Math.random()*0.6})`;
        shard.style.opacity = 0;
      }, 20);
      setTimeout(() => {
        shard.remove();
      }, 850);
    }
  }

  // navの下端座標（スクロール位置の基準）
  function getNavBottomY() {
    const navRect = nav.getBoundingClientRect();
    return navRect.bottom + window.scrollY;
  }

  window.addEventListener('scroll', () => {
    if (!filterBtn || filterBtn.classList.contains('broken')) return;

    const navBottomY = getNavBottomY();

    // スクロール位置がnavの下端に到達した瞬間だけ判定
    if (window.scrollY >= navBottomY && !alreadyCollided) {
      alreadyCollided = true;
      navCollisions++;
      const rect = filterBtn.getBoundingClientRect();
      // 破片はnavにぶつかった時だけ
      if (navCollisions <= MAX_COLLISION) {
        spawnShards(rect.left + rect.width / 2, rect.top + rect.height / 2, 8);
      }
      if (navCollisions >= MAX_COLLISION) {
        filterBtn.className = 'hamburger-button broken';
        filterBtn.textContent = '💥';
        spawnShards(rect.left + rect.width / 2, rect.top + rect.height / 2, 16);
      }
    }
    if (window.scrollY < navBottomY) {
      alreadyCollided = false;
    }
  });

  fastForwardBtn.addEventListener('click', () => {
    if (filterBtn.classList.contains('broken')) {
      filterBtn.className = 'hamburger-button';
      filterBtn.textContent = '☰';
      navCollisions = 0;
      mossStage = 0;
    } else {
      mossStage++;
      filterBtn.className = 'hamburger-button moss' + mossStage;
      // 破片は出さない（苔エフェクトのみ）
      if (mossStage > MAX_MOSS) {
        filterBtn.className = 'hamburger-button broken';
        filterBtn.textContent = '💥';
        // 破片は出さない
      }
    }
  });

  resetBtn.addEventListener('click', () => {
    filterBtn.className = 'hamburger-button';
    filterBtn.textContent = '☰';
    navCollisions = 0;
    mossStage = 0;
    alreadyCollided = false;
  });
});
