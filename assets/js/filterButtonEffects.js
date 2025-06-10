document.addEventListener("DOMContentLoaded", () => {
  const filterBtn = document.getElementById('filterToggle');
  const fastForwardBtn = document.getElementById('fastForwardButton');
  const resetBtn = document.getElementById('resetButton');
  const nav = document.querySelector('nav');

  let navCollisions = 0;
  const MAX_COLLISION = 5;
  let mossStage = 0;
  const MAX_MOSS = 4;

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

  window.addEventListener('scroll', () => {
    if (!filterBtn || filterBtn.classList.contains('broken')) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = filterBtn.getBoundingClientRect();
    if (
      btnRect.top <= navRect.bottom &&
      btnRect.bottom >= navRect.top
    ) {
      navCollisions++;
      if (navCollisions <= MAX_COLLISION) {
        const rect = filterBtn.getBoundingClientRect();
        spawnShards(rect.left + rect.width / 2, rect.top + rect.height / 2, 8);
      }
      if (navCollisions >= MAX_COLLISION) {
        filterBtn.className = 'hamburger-button broken';
        filterBtn.textContent = '💥';
        const rect = filterBtn.getBoundingClientRect();
        spawnShards(rect.left + rect.width / 2, rect.top + rect.height / 2, 16);
      }
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
      const rect = filterBtn.getBoundingClientRect();
      spawnShards(rect.left + rect.width / 2, rect.top + rect.height / 2, 4);
      if (mossStage > MAX_MOSS) {
        filterBtn.className = 'hamburger-button broken';
        filterBtn.textContent = '💥';
        const rect = filterBtn.getBoundingClientRect();
        spawnShards(rect.left + rect.width / 2, rect.top + rect.height / 2, 18);
      }
    }
  });

  resetBtn.addEventListener('click', () => {
    filterBtn.className = 'hamburger-button';
    filterBtn.textContent = '☰';
    navCollisions = 0;
    mossStage = 0;
  });
});
