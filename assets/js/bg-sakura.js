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

    // 右端に見切れる桜の木（超ズーム：上も右も見切れる）
    var trunkX = W * 0.92;
    var trunkLen = H * 2.5;

    // 幹（太い曲線で描く）
    drawTrunk(c, trunkX, H + 60, trunkLen);
  }

  function drawTrunk(c, x, y, length) {
    // 幹を太いベジェ曲線で描く（黄色の線のようにゆるくS字カーブ）
    var topX = x - length * 0.15;
    var topY = y - length;
    var cp1x = x + length * 0.05;
    var cp1y = y - length * 0.35;
    var cp2x = x - length * 0.2;
    var cp2y = y - length * 0.7;

    // 幹の太さ（下が太く上が細い）
    var widthBottom = 90;
    var widthTop = 40;

    c.save();
    c.fillStyle = '#5a3a2a';
    c.beginPath();
    // 左側のライン
    c.moveTo(x - widthBottom, y);
    c.bezierCurveTo(cp1x - widthBottom * 0.8, cp1y, cp2x - widthTop, cp2y, topX - widthTop, topY);
    // 右側のライン（逆順）
    c.lineTo(topX + widthTop, topY);
    c.bezierCurveTo(cp2x + widthTop, cp2y, cp1x + widthBottom * 0.8, cp1y, x + widthBottom, y);
    c.closePath();
    c.fill();
    c.restore();

    // 枝を生やす（幹の途中と先端から）
    drawBranchesFrom(c, topX, topY, -Math.PI / 2 - 0.3, length * 0.55, 0, 6);  // 左上に大きく
    drawBranchesFrom(c, topX, topY, -Math.PI / 2 + 0.2, length * 0.4, 0, 5);   // 右上（見切れる側）

    // 幹の途中から枝
    var midX = (x + topX) * 0.5 + 5;
    var midY = (y + topY) * 0.5;
    drawBranchesFrom(c, midX, midY, -Math.PI / 2 - 0.6, length * 0.45, 0, 6);  // 左に大きく伸びる
    drawBranchesFrom(c, midX + 15, midY + 30, -Math.PI / 2 + 0.4, length * 0.35, 0, 5); // 右へ（見切れ）

    // 下の方からも1本
    var lowX = x - 3;
    var lowY = y - length * 0.3;
    drawBranchesFrom(c, lowX, lowY, -Math.PI / 2 - 0.8, length * 0.35, 0, 5);
  }

  function drawBranchesFrom(c, x, y, angle, length, depth, maxDepth) {
    if (depth > maxDepth || length < 3) return;

    var endX = x + Math.cos(angle) * length;
    var endY = y + Math.sin(angle) * length;

    var thickness = Math.max(2, (maxDepth - depth + 1) * 4);
    c.save();
    c.strokeStyle = depth < 2 ? '#5a3a2a' : depth < 4 ? '#7a5040' : '#8a6050';
    c.lineWidth = thickness;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(endX, endY);
    c.stroke();
    c.restore();

    // 枝先に花の塊
    if (depth >= maxDepth - 2) {
      drawBlossomCluster(c, endX, endY, length * 0.7);
    }

    var shrink = 0.6 + Math.random() * 0.12;
    var spread = 0.3 + Math.random() * 0.3;
    drawBranchesFrom(c, endX, endY, angle - spread, length * shrink, depth + 1, maxDepth);
    drawBranchesFrom(c, endX, endY, angle + spread, length * shrink, depth + 1, maxDepth);
    if (Math.random() < 0.35) {
      drawBranchesFrom(c, endX, endY, angle + (Math.random() - 0.5) * 0.6, length * shrink * 0.7, depth + 1, maxDepth);
    }
  }

  function drawBlossomCluster(c, x, y, radius) {
    var count = 6 + Math.floor(Math.random() * 10);
    for (var i = 0; i < count; i++) {
      var bx = x + (Math.random() - 0.5) * radius * 2.5;
      var by = y + (Math.random() - 0.5) * radius * 2.5;
      var r = 6 + Math.random() * 10;
      drawFlower(c, bx, by, r);
    }
  }

  function drawFlower(c, x, y, r) {
    c.save();
    c.translate(x, y);
    c.rotate(Math.random() * Math.PI * 2);
    var petalColors = ['rgba(255,185,200,0.75)', 'rgba(255,200,215,0.7)', 'rgba(255,170,190,0.65)', 'rgba(255,210,220,0.6)'];
    c.fillStyle = petalColors[Math.floor(Math.random() * petalColors.length)];
    for (var j = 0; j < 5; j++) {
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

  renderTree();
  window.addEventListener('resize', function () {
    resize();
    renderTree();
  });

  // ========== 花びら（強風） ==========
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
    // 右側の木の付近から花びらが生まれやすい
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
      speedX: -1.5 - Math.random() * 2.5, // 左方向へ吹く
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
      p.x += (p.speedX - windGust) + Math.sin(p.wobble) * p.wobbleAmp; // 左方向
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
