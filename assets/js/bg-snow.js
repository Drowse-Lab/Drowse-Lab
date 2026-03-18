(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'snow-canvas';
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

  const FLAKE_COUNT = 80;
  const flakes = [];

  function createFlake(startFromTop) {
    return {
      x: Math.random() * W,
      y: startFromTop ? -10 - Math.random() * 60 : Math.random() * H,
      r: 1.5 + Math.random() * 3.5,
      speedY: 0.4 + Math.random() * 1.2,
      speedX: (Math.random() - 0.5) * 0.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.005 + Math.random() * 0.02,
      wobbleAmp: 0.3 + Math.random() * 0.8,
      opacity: 0.5 + Math.random() * 0.5,
    };
  }

  for (let i = 0; i < FLAKE_COUNT; i++) {
    flakes.push(createFlake(false));
  }

  function update() {
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.wobble += f.wobbleSpeed;
      f.x += f.speedX + Math.sin(f.wobble) * f.wobbleAmp;
      f.y += f.speedY;

      if (f.y > H + 10 || f.x < -10 || f.x > W + 10) {
        flakes[i] = createFlake(true);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const f of flakes) {
      ctx.save();
      ctx.globalAlpha = f.opacity;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(200,220,255,0.8)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
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
