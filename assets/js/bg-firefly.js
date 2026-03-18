(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'firefly-canvas';
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

  const FLY_COUNT = 35;
  const flies = [];

  function createFly() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      r: 2 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      hue: 55 + Math.random() * 15, // warm yellow-green
    };
  }

  for (let i = 0; i < FLY_COUNT; i++) {
    flies.push(createFly());
  }

  function update() {
    for (const f of flies) {
      f.phase += f.pulseSpeed;
      f.vx += (Math.random() - 0.5) * 0.1;
      f.vy += (Math.random() - 0.5) * 0.1;
      f.vx *= 0.98;
      f.vy *= 0.98;
      f.x += f.vx;
      f.y += f.vy;

      if (f.x < -20) f.x = W + 20;
      if (f.x > W + 20) f.x = -20;
      if (f.y < -20) f.y = H + 20;
      if (f.y > H + 20) f.y = -20;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const f of flies) {
      const glow = (Math.sin(f.phase) + 1) * 0.5; // 0..1
      const alpha = 0.2 + glow * 0.8;
      const glowR = f.r + glow * 8;

      ctx.save();
      ctx.globalAlpha = alpha * 0.3;
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowR);
      grad.addColorStop(0, 'hsla(' + f.hue + ',100%,70%,1)');
      grad.addColorStop(1, 'hsla(' + f.hue + ',100%,70%,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      // core
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'hsla(' + f.hue + ',100%,85%,1)';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
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
