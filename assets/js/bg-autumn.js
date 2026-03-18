(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'autumn-canvas';
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

  const LEAF_COUNT = 45;
  const leaves = [];

  const COLORS = [
    'rgba(200,60,20,0.8)',   // red
    'rgba(220,120,20,0.8)',  // orange
    'rgba(190,160,30,0.75)', // yellow-green
    'rgba(180,50,30,0.75)',  // dark red
    'rgba(230,170,50,0.8)',  // golden
  ];

  function createLeaf(startFromTop) {
    return {
      x: Math.random() * W,
      y: startFromTop ? -20 - Math.random() * 80 : Math.random() * H,
      size: 8 + Math.random() * 12,
      speedY: 0.6 + Math.random() * 1.0,
      speedX: 0.4 + Math.random() * 0.8,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.01 + Math.random() * 0.025,
      wobbleAmp: 0.8 + Math.random() * 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0.6 + Math.random() * 0.4,
      leafType: Math.floor(Math.random() * 2), // 0=maple, 1=oval
    };
  }

  for (let i = 0; i < LEAF_COUNT; i++) {
    leaves.push(createLeaf(false));
  }

  function drawMapleLeaf(l) {
    const s = l.size * 0.5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const outerX = Math.cos(angle) * s;
      const outerY = Math.sin(angle) * s;
      const innerAngle = angle + Math.PI / 5;
      const innerX = Math.cos(innerAngle) * s * 0.4;
      const innerY = Math.sin(innerAngle) * s * 0.4;
      if (i === 0) ctx.moveTo(outerX, outerY);
      else ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
    // stem
    ctx.strokeStyle = 'rgba(100,50,20,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, s * 1.2);
    ctx.stroke();
  }

  function drawOvalLeaf(l) {
    const s = l.size;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.3, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // vein
    ctx.strokeStyle = 'rgba(100,50,20,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.45);
    ctx.lineTo(0, s * 0.6);
    ctx.stroke();
  }

  function update() {
    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i];
      l.wobble += l.wobbleSpeed;
      l.x += l.speedX + Math.sin(l.wobble) * l.wobbleAmp;
      l.y += l.speedY;
      l.rotation += l.rotSpeed;

      if (l.y > H + 30 || l.x > W + 30) {
        leaves[i] = createLeaf(true);
        leaves[i].x = Math.random() * W;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const l of leaves) {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.rotation);
      ctx.globalAlpha = l.opacity;
      ctx.fillStyle = l.color;
      if (l.leafType === 0) drawMapleLeaf(l);
      else drawOvalLeaf(l);
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
