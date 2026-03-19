(function () {
  const canvas = document.createElement('canvas');
  canvas.id = 'sakura-canvas';
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

  // ========== 桜の木（キャッシュ描画） ==========
  let treeCanvas = null;

  function renderTree() {
    treeCanvas = document.createElement('canvas');
    treeCanvas.width = W;
    treeCanvas.height = H;
    const c = treeCanvas.getContext('2d');

    // 右下から生えて、上と右が見切れる
    // シンプルに再帰的な枝描画のみで木を作る
    var baseX = W * 0.88;
    var baseY = H + 30;
    var len = Math.min(W, H) * 0.32;

    // 1本の幹から自然に分岐
    drawBranch(c, baseX, baseY, -Math.PI / 2 + 0.08, len, 0);
  }

  function drawBranch(c, x, y, angle, length, depth) {
    if (depth > 8 || length < 4) return;

    var endX = x + Math.cos(angle) * length;
    var endY = y + Math.sin(angle) * length;

    // 太さ: 深さに応じて細くなる
    var thick = Math.max(1, length * 0.12);

    c.save();
    c.strokeStyle = depth < 3 ? '#5a3a2a' : '#7a5040';
    c.lineWidth = thick;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(endX, endY);
    c.stroke();
    c.restore();

    // 花（先端付近）
    if (depth >= 4) {
      drawBlossoms(c, endX, endY, length * 0.8);
    }

    // 分岐
    var shrink = 0.62 + Math.random() * 0.1;
    var spread = 0.35 + Math.random() * 0.2;

    // 左右に分岐（左寄りを少し長くして画面内に花が来るように）
    drawBranch(c, endX, endY, angle - spread, length * shrink * 1.05, depth + 1);
    drawBranch(c, endX, endY, angle + spread, length * shrink * 0.95, depth + 1);

    // たまに3本目
    if (depth < 5 && Math.random() < 0.4) {
      var extraAngle = angle + (Math.random() - 0.6) * 0.5;
      drawBranch(c, endX, endY, extraAngle, length * shrink * 0.7, depth + 1);
    }
  }

  function drawBlossoms(c, x, y, radius) {
    var count = 4 + Math.floor(Math.random() * 8);
    for (var i = 0; i < count; i++) {
      var bx = x + (Math.random() - 0.5) * radius * 2;
      var by = y + (Math.random() - 0.5) * radius * 2;
      var r = 4 + Math.random() * 7;

      c.save();
      c.translate(bx, by);
      c.rotate(Math.random() * Math.PI * 2);

      var colors = ['rgba(255,185,200,0.75)', 'rgba(255,200,215,0.7)', 'rgba(255,170,190,0.65)'];
      c.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      for (var j = 0; j < 5; j++) {
        c.beginPath();
        c.ellipse(0, -r * 0.5, r * 0.35, r * 0.55, 0, 0, Math.PI * 2);
        c.fill();
        c.rotate(Math.PI * 2 / 5);
      }
      // 中心
      c.fillStyle = 'rgba(255,230,190,0.8)';
      c.beginPath();
      c.arc(0, 0, r * 0.15, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  renderTree();
  window.addEventListener('resize', function () {
    resize();
    renderTree();
  });

  // ========== 花びら ==========
  var PETAL_NORMAL = 50;
  var PETAL_BURST = 500;
  var petals = [];

  var burstPhase = true;
  var burstTimer = 180;
  var currentMax = PETAL_BURST;

  var windGust = 8;
  var gustTarget = 8;
  var gustTimer = 180;

  var PETAL_COLORS = [
    'rgba(255,183,197,0.85)',
    'rgba(255,200,210,0.80)',
    'rgba(255,160,180,0.75)',
    'rgba(255,220,230,0.70)',
    'rgba(255,140,160,0.65)',
  ];

  function createPetal(startFromTop) {
    var fromTree = Math.random() < 0.45;
    var sx, sy;
    if (fromTree) {
      sx = W * 0.7 + Math.random() * W * 0.25;
      sy = H * 0.05 + Math.random() * H * 0.5;
    } else {
      sx = startFromTop ? Math.random() * W : Math.random() * W;
      sy = startFromTop ? -20 - Math.random() * 60 : Math.random() * H;
    }

    return {
      x: sx, y: sy,
      size: 10 + Math.random() * 18,
      speedY: 0.3 + Math.random() * 1.0,
      speedX: -1.5 - Math.random() * 2.5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.015 + Math.random() * 0.04,
      wobbleAmp: 1.0 + Math.random() * 2.5,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
      opacity: 0.5 + Math.random() * 0.5,
      scalePhase: Math.random() * Math.PI * 2,
      scaleSpeed: 0.02 + Math.random() * 0.03,
    };
  }

  for (var i = 0; i < PETAL_BURST; i++) {
    petals.push(createPetal(false));
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    var s = 0.5 + Math.abs(Math.sin(p.scalePhase)) * 0.5;
    ctx.scale(s, 1);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;

    ctx.beginPath();
    ctx.moveTo(0, -p.size * 0.5);
    ctx.bezierCurveTo(p.size * 0.5, -p.size * 0.3, p.size * 0.4, p.size * 0.4, 0, p.size * 0.5);
    ctx.bezierCurveTo(-p.size * 0.4, p.size * 0.4, -p.size * 0.5, -p.size * 0.3, 0, -p.size * 0.5);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,120,140,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -p.size * 0.35);
    ctx.lineTo(0, p.size * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  function update() {
    if (burstPhase) {
      burstTimer--;
      if (burstTimer <= 0) {
        burstPhase = false;
        currentMax = PETAL_NORMAL;
        gustTarget = 1.0;
      }
    }

    gustTimer--;
    if (gustTimer <= 0) {
      if (burstPhase) {
        gustTarget = 6 + Math.random() * 4;
        gustTimer = 30;
      } else {
        gustTarget = Math.random() < 0.3 ? 3 + Math.random() * 5 : 0.5 + Math.random() * 1.5;
        gustTimer = 60 + Math.floor(Math.random() * 180);
      }
    }
    windGust += (gustTarget - windGust) * 0.02;

    for (var i = petals.length - 1; i >= 0; i--) {
      var p = petals[i];
      p.wobble += p.wobbleSpeed;
      p.scalePhase += p.scaleSpeed;
      p.x += (p.speedX - windGust) + Math.sin(p.wobble) * p.wobbleAmp;
      p.y += p.speedY + Math.cos(p.wobble) * 0.5;
      p.rotation += p.rotSpeed + windGust * 0.01;

      if (p.y > H + 30 || p.x < -50) {
        if (petals.length > currentMax) {
          petals.splice(i, 1);
        } else {
          petals[i] = createPetal(true);
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (treeCanvas) ctx.drawImage(treeCanvas, 0, 0);
    for (var i = 0; i < petals.length; i++) drawPetal(petals[i]);
  }

  function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
  }

  animate();
})();
