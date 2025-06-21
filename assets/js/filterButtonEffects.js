// document.addEventListener("DOMContentLoaded", () => {
//   const filterBtn = document.getElementById('filterToggle');
//   const navLinks = document.querySelectorAll('nav ul li a');

//   let navCollisions = 0;
//   const MAX_COLLISION = 5;
//   let alreadyCollided = Array.from({ length: navLinks.length }, () => false);

//   function spawnShards(x, y, count = 12) {
//     for(let i=0; i<count; i++) {
//       const shard = document.createElement('div');
//       shard.className = 'shard';
//       document.body.appendChild(shard);
//       const angle = Math.random() * 2 * Math.PI;
//       const distance = 30 + Math.random() * 40;
//       const dx = Math.cos(angle) * distance;
//       const dy = Math.sin(angle) * distance;
//       shard.style.left = `${x - 4}px`;
//       shard.style.top = `${y - 4}px`;
//       setTimeout(() => {
//         shard.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.random()*360}deg) scale(${0.6 + Math.random()*0.6})`;
//         shard.style.opacity = 0;
//       }, 20);
//       setTimeout(() => {
//         shard.remove();
//       }, 850);
//     }
//   }

//   window.addEventListener('scroll', () => {
//     if (!filterBtn) return;

//     const btnRect = filterBtn.getBoundingClientRect();
//     navLinks.forEach((link, idx) => {
//       const linkRect = link.getBoundingClientRect();
//       // 枠（リンク）の上下左右どこかがフィルターボタンと重なったら"ぶつかった"
//       const isOverlap = !(
//         btnRect.right < linkRect.left ||
//         btnRect.left > linkRect.right ||
//         btnRect.bottom < linkRect.top ||
//         btnRect.top > linkRect.bottom
//       );
//       if(isOverlap && !alreadyCollided[idx]) {
//         alreadyCollided[idx] = true;
//         navCollisions++;
//         const rect = filterBtn.getBoundingClientRect();
//         spawnShards(rect.left + rect.width / 2, rect.top + rect.height / 2, 10);
//       }
//       if(!isOverlap) {
//         alreadyCollided[idx] = false;
//       }
//     });
//   });
// });
