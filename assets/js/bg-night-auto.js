(function () {
  const hour = new Date().getHours();
  // 18:00〜5:59 を夜とする
  const isNight = hour >= 18 || hour < 6;
  if (!isNight) return;

  // 夜用背景を適用
  document.documentElement.style.setProperty('--night-active', '1');

  const style = document.createElement('style');
  style.textContent = [
    'body { background: linear-gradient(180deg, #0b1026 0%, #1a1a3a 40%, #10102a 100%) fixed !important; color: #d0d0d8 !important; }',
    '.post-header .title { color: #e8e8f0 !important; }',
    '.post-meta, .post-date { color: #9090a8 !important; }',
    '.post-content { color: #c8c8d8 !important; }',
    '.post-content a { color: #7dafea !important; }',
    '.post-content h1,.post-content h2,.post-content h3 { color: #e0e0f0 !important; }',
    '.site-header { background: rgba(10,12,30,0.9) !important; }',
    '.wrapper { background: transparent !important; }',
  ].join('\n');
  document.head.appendChild(style);

  // 星空キャンバス
  const canvas = document.createElement('canvas');
  canvas.id = 'night-canvas';
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
    createStars();
  }

  // 星
  const STAR_COUNT = 100;
  let stars = [];

  function createStars() {
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.7,
        r: 0.3 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.008 + Math.random() * 0.02,
        baseOpacity: 0.3 + Math.random() * 0.7,
      });
    }
  }

  // 流れ星
  const shootingStars = [];

  function maybeSpawnShootingStar() {
    if (Math.random() < 0.003 && shootingStars.length < 2) {
      shootingStars.push({
        x: Math.random() * W * 0.8,
        y: Math.random() * H * 0.3,
        vx: 4 + Math.random() * 4,
        vy: 2 + Math.random() * 3,
        life: 1.0,
        len: 30 + Math.random() * 40,
      });
    }
  }

  resize();
  window.addEventListener('resize', resize);

  function update() {
    for (const s of stars) {
      s.phase += s.twinkleSpeed;
    }

    maybeSpawnShootingStar();
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const ss = shootingStars[i];
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life -= 0.015;
      if (ss.life <= 0 || ss.x > W || ss.y > H) {
        shootingStars.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // 星
    for (const s of stars) {
      const twinkle = (Math.sin(s.phase) + 1) * 0.5;
      const alpha = s.baseOpacity * (0.4 + twinkle * 0.6);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(200,220,255,0.6)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 流れ星
    for (const ss of shootingStars) {
      ctx.save();
      ctx.globalAlpha = ss.life;
      const grad = ctx.createLinearGradient(
        ss.x, ss.y,
        ss.x - ss.vx * ss.len * 0.15, ss.y - ss.vy * ss.len * 0.15
      );
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - ss.vx * ss.len * 0.15, ss.y - ss.vy * ss.len * 0.15);
      ctx.stroke();

      // 先端の光
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(180,200,255,0.8)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
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
