(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'sakura-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  document.body.prepend(canvas);

  // Ensure page content stays above petals
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

  const PETAL_COUNT = 60;
  const petals = [];

  function randomPetalColor() {
    const colors = [
      'rgba(255,183,197,0.85)',  // pink
      'rgba(255,200,210,0.80)',  // light pink
      'rgba(255,160,180,0.75)',  // deeper pink
      'rgba(255,220,230,0.70)',  // very light pink
      'rgba(255,140,160,0.65)',  // rose
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function createPetal(startFromTop) {
    return {
      x: Math.random() * W,
      y: startFromTop ? -20 - Math.random() * 100 : Math.random() * H,
      size: 6 + Math.random() * 10,
      speedY: 0.5 + Math.random() * 1.5,
      speedX: 0.3 + Math.random() * 1.0,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.01 + Math.random() * 0.03,
      wobbleAmp: 0.5 + Math.random() * 1.5,
      color: randomPetalColor(),
      opacity: 0.5 + Math.random() * 0.5,
    };
  }

  // Initial burst — fill screen
  for (let i = 0; i < PETAL_COUNT; i++) {
    petals.push(createPetal(false));
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;

    // Petal shape (elliptical with a point)
    ctx.beginPath();
    ctx.moveTo(0, -p.size * 0.5);
    ctx.bezierCurveTo(
      p.size * 0.5, -p.size * 0.3,
      p.size * 0.4, p.size * 0.4,
      0, p.size * 0.5
    );
    ctx.bezierCurveTo(
      -p.size * 0.4, p.size * 0.4,
      -p.size * 0.5, -p.size * 0.3,
      0, -p.size * 0.5
    );
    ctx.fill();

    // Subtle vein line
    ctx.strokeStyle = 'rgba(255,120,140,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -p.size * 0.4);
    ctx.lineTo(0, p.size * 0.4);
    ctx.stroke();

    ctx.restore();
  }

  function update() {
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.wobble += p.wobbleSpeed;
      p.x += p.speedX + Math.sin(p.wobble) * p.wobbleAmp;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;

      // Reset when off screen
      if (p.y > H + 30 || p.x > W + 30) {
        petals[i] = createPetal(true);
        petals[i].x = Math.random() * W;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of petals) drawPetal(p);
  }

  function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
  }

  animate();
})();
