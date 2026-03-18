(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'rain-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  document.body.prepend(canvas);

  const pageContent = document.querySelector('.page-content');
  if (pageContent) pageContent.style.position = 'relative';
  const header = document.querySelector('.site-header');
  if (header) header.style.position = 'relative';

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const DROP_COUNT = 120;
  const drops = [];

  function createDrop(startFromTop) {
    const speed = 4 + Math.random() * 8;
    return {
      x: Math.random() * W,
      y: startFromTop ? -20 - Math.random() * H : Math.random() * H,
      len: 10 + Math.random() * 20,
      speed: speed,
      opacity: 0.15 + Math.random() * 0.25,
      width: 0.5 + Math.random() * 1,
    };
  }

  for (let i = 0; i < DROP_COUNT; i++) {
    drops.push(createDrop(false));
  }

  function update() {
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      d.y += d.speed;
      d.x -= d.speed * 0.05; // slight wind

      if (d.y > H + 30) {
        drops[i] = createDrop(true);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const d of drops) {
      ctx.save();
      ctx.globalAlpha = d.opacity;
      ctx.strokeStyle = 'rgba(174,194,224,0.9)';
      ctx.lineWidth = d.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.len * 0.05, d.y - d.len);
      ctx.stroke();
      ctx.restore();
    }
  }

  function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
  }

  animate();
})();
