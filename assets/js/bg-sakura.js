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

  // ========== 桜の木 ==========
  function drawBranch(x, y, angle, length, depth, maxDepth) {
    if (depth > maxDepth || length < 3) return;

    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    const thickness = (maxDepth - depth + 1) * 1.8;
    ctx.save();
    ctx.strokeStyle = depth < 3 ? '#5a3a2a' : '#7a5040';
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();

    // 枝先に花の塊
    if (depth >= maxDepth - 2) {
      drawBlossomCluster(endX, endY, length * 0.6);
    }

    const shrink = 0.65 + Math.random() * 0.1;
    const spread = 0.3 + Math.random() * 0.25;
    drawBranch(endX, endY, angle - spread, length * shrink, depth + 1, maxDepth);
    drawBranch(endX, endY, angle + spread, length * shrink, depth + 1, maxDepth);
    // たまに3本目
    if (Math.random() < 0.3) {
      drawBranch(endX, endY, angle + (Math.random() - 0.5) * 0.5, length * shrink * 0.8, depth + 1, maxDepth);
    }
  }

  function drawBlossomCluster(x, y, radius) {
    const count = 5 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const bx = x + (Math.random() - 0.5) * radius * 2.5;
      const by = y + (Math.random() - 0.5) * radius * 2.5;
      const r = 3 + Math.random() * 5;
      drawFlower(bx, by, r);
    }
  }

  function drawFlower(x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.random() * Math.PI * 2);
    // 花びら5枚
    const petalColors = ['rgba(255,185,200,0.7)', 'rgba(255,200,215,0.65)', 'rgba(255,170,190,0.6)'];
    ctx.fillStyle = petalColors[Math.floor(Math.random() * petalColors.length)];
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.5, r * 0.4, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(Math.PI * 2 / 5);
    }
    // 中心
    ctx.fillStyle = 'rgba(255,220,180,0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 木の描画（初回のみ、別canvasにキャッシュ）
  let treeCanvas = null;
  function renderTree() {
    treeCanvas = document.createElement('canvas');
    treeCanvas.width = W;
    treeCanvas.height = H;
    const tCtx = treeCanvas.getContext('2d');

    // 左側の木
    const saved = ctx;
    // treeCanvasに描く
    const origCtx = ctx;
    // ctxを一時差し替え
    Object.defineProperty(window, '__sakuraCtx', { value: tCtx, writable: true });

    // 右端から見切れる桜の木（幹が右端、枝が左に広がる）
    drawTreeOn(tCtx, W + 15, H, -Math.PI / 2 - 0.2, H * 0.22, 8);
  }

  function drawTreeOn(c, x, y, angle, length, maxDepth) {
    const prevCtx = ctx;
    // 再帰でctxを使うのでグローバル参照を差し替え
    drawBranchOn(c, x, y, angle, length, 0, maxDepth);
  }

  function drawBranchOn(c, x, y, angle, length, depth, maxDepth) {
    if (depth > maxDepth || length < 3) return;

    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    const thickness = (maxDepth - depth + 1) * 1.8;
    c.save();
    c.strokeStyle = depth < 3 ? '#5a3a2a' : '#7a5040';
    c.lineWidth = thickness;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(endX, endY);
    c.stroke();
    c.restore();

    if (depth >= maxDepth - 2) {
      const count = 5 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        const bx = endX + (Math.random() - 0.5) * length * 1.2;
        const by = endY + (Math.random() - 0.5) * length * 1.2;
        const r = 3 + Math.random() * 5;
        c.save();
        c.translate(bx, by);
        c.rotate(Math.random() * Math.PI * 2);
        const petalColors = ['rgba(255,185,200,0.7)', 'rgba(255,200,215,0.65)', 'rgba(255,170,190,0.6)'];
        c.fillStyle = petalColors[Math.floor(Math.random() * petalColors.length)];
        for (let j = 0; j < 5; j++) {
          c.beginPath();
          c.ellipse(0, -r * 0.5, r * 0.4, r * 0.6, 0, 0, Math.PI * 2);
          c.fill();
          c.rotate(Math.PI * 2 / 5);
        }
        c.fillStyle = 'rgba(255,220,180,0.8)';
        c.beginPath();
        c.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    const shrink = 0.65 + Math.random() * 0.1;
    const spread = 0.3 + Math.random() * 0.25;
    drawBranchOn(c, endX, endY, angle - spread, length * shrink, depth + 1, maxDepth);
    drawBranchOn(c, endX, endY, angle + spread, length * shrink, depth + 1, maxDepth);
    if (Math.random() < 0.3) {
      drawBranchOn(c, endX, endY, angle + (Math.random() - 0.5) * 0.5, length * shrink * 0.8, depth + 1, maxDepth);
    }
  }

  renderTree();
  window.addEventListener('resize', function () {
    resize();
    renderTree();
  });

  // ========== 花びら（強風） ==========
  const PETAL_NORMAL = 50;    // 通常時の花びら数
  const PETAL_BURST = 200;    // 開幕の吹雪数
  const petals = [];

  // 開幕バースト制御
  let burstPhase = true;
  let burstTimer = 180;  // 約3秒間バースト（60fps想定）
  let currentMax = PETAL_BURST;

  // 突風パラメータ
  let windGust = 8;       // 開幕は強風から
  let gustTarget = 8;
  let gustTimer = 180;

  function randomPetalColor() {
    const colors = [
      'rgba(255,183,197,0.85)',
      'rgba(255,200,210,0.80)',
      'rgba(255,160,180,0.75)',
      'rgba(255,220,230,0.70)',
      'rgba(255,140,160,0.65)',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function createPetal(startFromTop) {
    // 右端の木の付近から花びらを発生させることもある
    const fromTree = Math.random() < 0.4;
    let sx, sy;
    if (fromTree) {
      sx = W * 0.85 + Math.random() * W * 0.2;
      sy = H * 0.1 + Math.random() * H * 0.4;
    } else {
      sx = startFromTop ? Math.random() * W : Math.random() * W;
      sy = startFromTop ? -20 - Math.random() * 60 : Math.random() * H;
    }

    return {
      x: sx,
      y: sy,
      size: 5 + Math.random() * 10,
      speedY: 0.3 + Math.random() * 1.0,
      speedX: 1.5 + Math.random() * 2.5, // 強めの横風
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.08, // 回転速め
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.015 + Math.random() * 0.04,
      wobbleAmp: 1.0 + Math.random() * 2.5,
      color: randomPetalColor(),
      opacity: 0.5 + Math.random() * 0.5,
      // 3D風の奥行き揺れ
      scalePhase: Math.random() * Math.PI * 2,
      scaleSpeed: 0.02 + Math.random() * 0.03,
    };
  }

  // 開幕バースト：大量の花びらを画面全体に散らす
  for (let i = 0; i < PETAL_BURST; i++) {
    petals.push(createPetal(false));
  }

  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    // 3D風のスケール変化
    const s = 0.5 + Math.abs(Math.sin(p.scalePhase)) * 0.5;
    ctx.scale(s, 1);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;

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

    ctx.strokeStyle = 'rgba(255,120,140,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -p.size * 0.35);
    ctx.lineTo(0, p.size * 0.35);
    ctx.stroke();

    ctx.restore();
  }

  function update() {
    // バーストフェーズの管理
    if (burstPhase) {
      burstTimer--;
      if (burstTimer <= 0) {
        burstPhase = false;
        currentMax = PETAL_NORMAL;
        gustTarget = 1.0;
      }
    }

    // 突風の更新
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

    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.wobble += p.wobbleSpeed;
      p.scalePhase += p.scaleSpeed;
      p.x += (p.speedX + windGust) + Math.sin(p.wobble) * p.wobbleAmp;
      p.y += p.speedY + Math.cos(p.wobble) * 0.5;
      p.rotation += p.rotSpeed + windGust * 0.01;

      if (p.y > H + 30 || p.x > W + 50) {
        // バースト後は花びらを減らしていく
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

    // 木（キャッシュを描画）
    if (treeCanvas) {
      ctx.drawImage(treeCanvas, 0, 0);
    }

    // 花びら
    for (const p of petals) drawPetal(p);
  }

  function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
  }

  animate();
})();
