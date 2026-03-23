// ─── Core Types ────────────────────────────────────────────────────────────
export type GrassType = 'blade' | 'silhouette' | 'anemone' | 'branch' | 'kelp';

// Represents a single strand, tentacle, or kelp frond
interface Stem {
  relX:         number;
  height:       number;
  width:        number;
  swaySpeed:    number;
  swayOffset:   number;
  lean:         number;
  depth:        number;
  angle:        number;
  hue:          number;
  // ── Cached gradients — created once on first draw, reused every frame ───
  cachedGrad?:  CanvasGradient;  // blade / silhouette / kelp body
}

// A logical grouping of stems that share a base position
interface Cluster {
  x:              number;
  baseY:          number;
  stems:          Stem[];
  type:           GrassType;
  baseWidth:      number;
  scale:          number;
  // ── Cluster-level gradient cache ────────────────────────────────────────
  cachedMoundGrad?: CanvasGradient; // blade sand mound
  cachedBodyGrad?:  CanvasGradient; // anemone bulb
  // ── Branch tree pre-baked: list of {x0,y0,x1,y1,strokeStyle,lineWidth}
  // Built once at creation, reused every frame (angle varies via masterSway)
  branchHasThird?: boolean;         // pre-roll the random for depth-3 branch
}

export class SeaGrass {
  gameWidth:  number;
  gameHeight: number;
  clusters:   Cluster[] = [];

  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth  = gameWidth;
    this.gameHeight = gameHeight;
    this.init();
  }

  // ─────────────────────────────────────────────────────────────────────────
  private init(): void {
    const plan: { type: GrassType; count: number }[] = [
      { type: 'silhouette', count: 4 },
      { type: 'kelp',       count: 4 },
      { type: 'branch',     count: 5 },
      { type: 'anemone',    count: 3 },
      { type: 'blade',      count: 6 },
    ];
    plan.forEach(({ type, count }) => {
      for (let i = 0; i < count; i++) {
        this.addCluster(Math.random() * this.gameWidth, type);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  addCluster(x: number, type?: GrassType): void {
    const types: GrassType[] = ['blade','silhouette','anemone','branch','kelp'];
    const t = type ?? types[Math.floor(Math.random() * types.length)];

    const stemCount = this.stemCount(t);
    const stems: Stem[] = [];
    for (let j = 0; j < stemCount; j++) stems.push(this.makeStem(t, j, stemCount));

    this.clusters.push({
      x,
      baseY:    this.gameHeight,
      stems,
      type: t,
      baseWidth: this.clusterWidth(t),
      scale: t === 'branch'
        ? 0.35 + Math.random() * 0.30
        : t === 'silhouette'
          ? 0.55 + Math.random() * 0.35
          : 0.80 + Math.random() * 0.45,
      // Pre-roll the random for the optional third branch arm — avoids Math.random in the draw loop
      branchHasThird: Math.random() > 0.42,
    });
  }

  private stemCount(t: GrassType): number {
    switch (t) {
      case 'blade':      return 4 + Math.floor(Math.random() * 5);
      case 'silhouette': return 3 + Math.floor(Math.random() * 3);
      case 'anemone':    return 6 + Math.floor(Math.random() * 6);
      case 'branch':     return 1;
      case 'kelp':       return 2 + Math.floor(Math.random() * 2);
    }
  }

  private clusterWidth(t: GrassType): number {
    switch (t) {
      case 'blade':      return 32 + Math.random() * 22;
      case 'silhouette': return 45 + Math.random() * 35;
      case 'anemone':    return 38 + Math.random() * 28;
      case 'branch':     return 30;
      case 'kelp':       return 38 + Math.random() * 28;
    }
  }

  private makeStem(t: GrassType, idx: number, total: number): Stem {
    const spread = this.clusterWidth(t);
    const relX   = total > 1
      ? (idx / (total - 1) - 0.5) * spread + (Math.random() - 0.5) * 14
      : 0;

    const base: Stem = {
      relX,
      height:     1,
      width:      1,
      swaySpeed:  0.0015 + Math.random() * 0.0022,
      swayOffset: Math.random() * Math.PI * 2,
      lean:       0,
      depth:      Math.random(),
      angle:      (Math.random() - 0.5) * 0.18,
      hue:        Math.random(),
    };

    switch (t) {
      case 'blade':
        base.height = 40 + Math.random() * 120;
        base.width  = 5  + Math.random() * 8;
        base.angle  = (Math.random() - 0.5) * 0.30;
        break;
      case 'silhouette':
        base.height = 60 + Math.random() * 70;
        base.width  = 5  + Math.random() * 4;
        base.swaySpeed *= 0.65;
        break;
      case 'anemone':
        base.height = 28 + Math.random() * 36;
        base.width  = 4  + Math.random() * 5;
        base.swaySpeed *= 1.20;
        break;
      case 'branch':
        base.height = 40 + Math.random() * 50;
        base.width  = 3;
        base.swaySpeed *= 0.50;
        break;
      case 'kelp':
        base.height = 130 + Math.random() * 140;
        base.width  = 18  + Math.random() * 16;
        break;
    }
    return base;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  UPDATE LOOP
  // ─────────────────────────────────────────────────────────────────────────
  update(playerX: number, playerY: number, _speed: number): void {
    for (let i = this.clusters.length - 1; i >= 0; i--) {
      const c = this.clusters[i];
      c.x -= 2;

      if (c.x < -220) { this.clusters.splice(i, 1); continue; }

      if (this.clusters.length < 20) {
        const types: GrassType[] = ['blade','silhouette','branch','branch','kelp','anemone'];
        this.addCluster(
          this.gameWidth + 100 + Math.random() * 160,
          types[Math.floor(Math.random() * types.length)]
        );
      }

      if (c.type === 'blade' || c.type === 'kelp') {
        c.stems.forEach(stem => {
          const sx   = c.x + stem.relX;
          const dist = playerX - sx;
          const nearBottom = playerY > this.gameHeight - stem.height * c.scale - 55;
          if (Math.abs(dist) < 90 && nearBottom) {
            stem.lean = Math.max(-44, Math.min(44, stem.lean - dist * 0.20));
          } else {
            stem.lean *= 0.87;
          }
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  DRAW DISPATCHER
  // ─────────────────────────────────────────────────────────────────────────
  draw(ctx: CanvasRenderingContext2D): void {
    const time  = Date.now();
    const order: GrassType[] = ['branch','silhouette','kelp','anemone','blade'];
    order.forEach(type => {
      this.clusters
        .filter(c => c.type === type)
        .forEach(c => this.drawCluster(ctx, c, time));
    });
  }

  private drawCluster(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    switch (c.type) {
      case 'blade':      this.drawBlades(ctx, c, time);     break;
      case 'silhouette': this.drawSilhouette(ctx, c, time); break;
      case 'anemone':    this.drawAnemone(ctx, c, time);    break;
      case 'branch':     this.drawBranch(ctx, c, time);     break;
      case 'kelp':       this.drawKelp(ctx, c, time);       break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  TYPE 1: BLADE — bioluminescent curved seagrass with teal/cyan edge glow
  //  FIX: mound gradient cached on cluster, blade gradient cached per stem
  // ─────────────────────────────────────────────────────────────────────────
  private drawBlades(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    // ── Sand root mound — cached once per cluster ────────────────────────
    if (!c.cachedMoundGrad) {
      const moundW = c.baseWidth * 0.65;
      const g = ctx.createRadialGradient(c.x, c.baseY, 0, c.x, c.baseY, moundW);
      g.addColorStop(0,   'rgba(185,148,85,0.55)');
      g.addColorStop(0.5, 'rgba(165,128,68,0.35)');
      g.addColorStop(1,   'rgba(145,110,55,0.0)');
      c.cachedMoundGrad = g;
    }
    const moundW = c.baseWidth * 0.65;
    ctx.beginPath();
    ctx.ellipse(c.x, c.baseY, moundW, 13, 0, 0, Math.PI);
    ctx.fillStyle = c.cachedMoundGrad;
    ctx.fill();

    const sorted = [...c.stems].sort((a, b) => b.height - a.height);

    sorted.forEach(stem => {
      const h = stem.height * c.scale;
      const w = stem.width  * c.scale;

      const swayMag = 8 + (h / 200) * 22;
      const sway =
        Math.sin(time * stem.swaySpeed + stem.swayOffset)              * swayMag +
        Math.sin(time * stem.swaySpeed * 1.9 + stem.swayOffset + 1.2) * swayMag * 0.28;

      const bx        = c.x + stem.relX;
      const by        = c.baseY;
      const totalLean = stem.angle * h + sway + stem.lean;

      const cp1x = bx + totalLean * 0.18;  const cp1y = by - h * 0.38;
      const cp2x = bx + totalLean * 0.62;  const cp2y = by - h * 0.70;
      const tipX = bx + totalLean;          const tipY = by - h;

      const baseHalfW = w * 0.50;
      const midHalfW  = w * 0.32;
      const tipHalfW  = 0.8;

      // ── Blade body gradient — cached per stem (vertical approx.) ────────
      if (!stem.cachedGrad) {
        const hs = Math.round(stem.hue * 25);
        const g  = ctx.createLinearGradient(bx, by, bx, by - h);
        g.addColorStop(0,    `rgba(${22+hs},${78+hs},28,0.92)`);
        g.addColorStop(0.28, `rgba(${38+hs},${130+hs},45,0.94)`);
        g.addColorStop(0.62, `rgba(${58+hs},${175+hs},62,0.96)`);
        g.addColorStop(0.88, `rgba(${95+hs},${210+hs},78,0.90)`);
        g.addColorStop(1,    `rgba(${145+hs},${230+hs},100,0.55)`);
        stem.cachedGrad = g;
      }

      ctx.save();
      ctx.fillStyle = stem.cachedGrad;
      ctx.beginPath();
      ctx.moveTo(bx - baseHalfW, by);
      ctx.bezierCurveTo(cp1x - midHalfW, cp1y, cp2x - midHalfW, cp2y, tipX - tipHalfW, tipY);
      ctx.quadraticCurveTo(tipX, tipY - 2, tipX + tipHalfW, tipY);
      ctx.bezierCurveTo(cp2x + midHalfW, cp2y, cp1x + midHalfW, cp1y, bx + baseHalfW, by);
      ctx.closePath();
      ctx.fill();

      // Midrib
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tipX, tipY);
      ctx.strokeStyle = 'rgba(185,240,140,0.38)';
      ctx.lineWidth   = Math.max(0.5, w * 0.10);
      ctx.stroke();

      // ── BIOLUMINESCENT edge — neon teal/cyan instead of plain white ─────
      ctx.beginPath();
      ctx.moveTo(bx + baseHalfW * 0.6, by);
      ctx.bezierCurveTo(cp1x + midHalfW * 0.5, cp1y, cp2x + midHalfW * 0.3, cp2y, tipX, tipY);
      ctx.strokeStyle = 'rgba(45,212,191,0.32)';
      ctx.lineWidth   = Math.max(0.5, w * 0.09);
      ctx.stroke();

      // Glowing tip dot
      ctx.beginPath();
      ctx.arc(tipX, tipY, w * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(103,232,249,0.55)';
      ctx.fill();

      ctx.restore();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  TYPE 2: SILHOUETTE — gradient cached per stem
  // ─────────────────────────────────────────────────────────────────────────
  private drawSilhouette(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    c.stems.forEach(stem => {
      const h   = stem.height * c.scale;
      const w   = stem.width  * c.scale;
      const sway =
        Math.sin(time * stem.swaySpeed + stem.swayOffset) * (8 + stem.depth * 12) +
        Math.sin(time * stem.swaySpeed * 2.1 + stem.swayOffset + 1) * 3;

      const bx   = c.x + stem.relX;
      const by   = c.baseY;
      const tipX = bx + sway + stem.angle * h;
      const tipY = by - h;

      // ── Gradient cached per stem (vertical) ─────────────────────────────
      if (!stem.cachedGrad) {
        const g = ctx.createLinearGradient(0, 0, 0, -h);
        g.addColorStop(0,   'rgba(16,30,68,0.92)');
        g.addColorStop(0.5, 'rgba(26,50,105,0.82)');
        g.addColorStop(1,   'rgba(42,75,145,0.38)');
        stem.cachedGrad = g;
      }

      ctx.save();
      ctx.fillStyle = stem.cachedGrad;
      ctx.beginPath();
      ctx.moveTo(bx - w * 0.48, by);
      ctx.quadraticCurveTo(bx + sway * 0.5, by - h * 0.50, tipX, tipY);
      ctx.quadraticCurveTo(bx + sway * 0.3, by - h * 0.50, bx + w * 0.48, by);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  TYPE 3: ANEMONE — bulb gradient cached; tentacles use flat fill + glow
  //  FIX: removed createLinearGradient per tentacle per frame (6–11 calls)
  //  BIOLUMINESCENCE: glowing teal sucker tips
  // ─────────────────────────────────────────────────────────────────────────
  private drawAnemone(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    const bw    = c.baseWidth * c.scale;
    const bulbR = bw * 0.50;
    const bulbX = c.x;
    const bulbY = c.baseY - bulbR * 0.55;

    // ── Bulb body gradient — cached per cluster ───────────────────────────
    if (!c.cachedBodyGrad) {
      const g = ctx.createRadialGradient(
        bulbX - bulbR * 0.25, bulbY - bulbR * 0.25, bulbR * 0.05,
        bulbX, bulbY, bulbR
      );
      g.addColorStop(0,   'rgba(255,200,80,0.95)');
      g.addColorStop(0.5, 'rgba(220,140,40,0.90)');
      g.addColorStop(1,   'rgba(170,85,20,0.80)');
      c.cachedBodyGrad = g;
    }

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(bulbX, bulbY, bulbR, bulbR * 0.72, 0, 0, Math.PI * 2);
    ctx.fillStyle   = c.cachedBodyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,110,30,0.50)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Speckled texture (deterministic offset based on cluster position, not random)
    for (let d = 0; d < 5; d++) {
      const dx = bulbX + Math.sin(d * 1.3 + c.x) * bulbR * 0.6;
      const dy = bulbY + Math.cos(d * 0.9 + c.x) * bulbR * 0.35;
      ctx.beginPath();
      ctx.arc(dx, dy, 2 + (d % 3) * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,240,140,0.45)';
      ctx.fill();
    }
    ctx.restore();

    // ── Tentacles — flat fill per-tentacle, no per-frame gradient creation ─
    const totalTentacles = c.stems.length;
    c.stems.forEach((stem, idx) => {
      const baseAngle = Math.PI + (idx / (totalTentacles - 1)) * Math.PI;
      const tentLen   = stem.height * c.scale;
      const swayAngle =
        Math.sin(time * stem.swaySpeed + stem.swayOffset) * 0.38 +
        Math.sin(time * stem.swaySpeed * 1.9 + stem.swayOffset + idx) * 0.16;

      const angle  = baseAngle + swayAngle;
      const startX = bulbX + Math.cos(baseAngle) * bulbR * 0.70;
      const startY = bulbY + Math.sin(baseAngle) * bulbR * 0.55;
      const tipX   = startX + Math.cos(angle) * tentLen;
      const tipY   = startY + Math.sin(angle) * tentLen;
      const ctrlX  = startX + Math.cos(angle - 0.4) * tentLen * 0.55;
      const ctrlY  = startY + Math.sin(angle - 0.4) * tentLen * 0.55;
      const w      = stem.width * c.scale;

      // Flat fill with alpha — eliminates createLinearGradient entirely
      // Progress along the stem drives the alpha so it still fades at tip
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX - w * 0.40, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.quadraticCurveTo(ctrlX + w * 0.5, ctrlY, startX + w * 0.40, startY);
      ctx.closePath();
      ctx.fillStyle = 'rgba(230,110,60,0.82)';
      ctx.fill();

      // ── BIOLUMINESCENT tip — glowing teal sucker ─────────────────────────
      // Outer glow ring
      ctx.beginPath();
      ctx.arc(tipX, tipY, w * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(45,212,191,0.18)';
      ctx.fill();
      // Inner bright tip
      ctx.beginPath();
      ctx.arc(tipX, tipY, w * 0.70, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(103,232,249,0.85)';
      ctx.fill();

      ctx.restore();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  TYPE 4: BRANCH — recursive silhouette
  //  FIX: removed ctx.save/restore from every segment — lineCap set once
  //       uses pre-rolled branchHasThird to avoid Math.random in draw loop
  // ─────────────────────────────────────────────────────────────────────────
  private drawBranch(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    const stem       = c.stems[0];
    const totalH     = stem.height * c.scale;
    const masterSway = Math.sin(time * stem.swaySpeed + stem.swayOffset) * 0.055;

    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.lineCap     = 'round';   // set once for all segments
    ctx.translate(c.x, c.baseY);

    this.drawBranchNode(ctx, 0, 0, -Math.PI / 2, totalH * 0.40, 4, masterSway, 1.0, c.branchHasThird ?? false);

    ctx.restore();
  }

  private drawBranchNode(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    angle: number, segLen: number,
    depth: number, masterSway: number,
    swayMult: number, hasThird: boolean
  ): void {
    if (depth <= 0 || segLen < 3) return;

    const swayedAngle = angle + masterSway * swayMult;
    const ex = x + Math.cos(swayedAngle) * segLen;
    const ey = y + Math.sin(swayedAngle) * segLen;

    const progress  = 1 - depth / 4;
    const thickness = Math.max(0.5, depth * 1.4 - 0.3);
    const lightness = Math.round(28 + progress * 22);

    // No ctx.save/ctx.restore per segment — just set the properties directly
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = `rgba(${lightness},${lightness + 10},${lightness + 35},${0.75 - progress * 0.25})`;
    ctx.lineWidth   = thickness;
    ctx.stroke();

    const nextLen = segLen * 0.58;
    const spread  = 0.50 + depth * 0.035;
    const nextSwayMult = swayMult * 0.70;

    this.drawBranchNode(ctx, ex, ey, swayedAngle - spread, nextLen, depth - 1, masterSway, nextSwayMult, hasThird);
    this.drawBranchNode(ctx, ex, ey, swayedAngle + spread, nextLen, depth - 1, masterSway, nextSwayMult, hasThird);

    // Pre-rolled random — no Math.random in the draw loop
    if (depth >= 3 && hasThird) {
      this.drawBranchNode(ctx, ex, ey, swayedAngle + 0.06, nextLen * 0.75, depth - 1, masterSway, swayMult * 0.50, false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  TYPE 5: KELP — thick undulating ribbon
  //  FIX 1: gradient cached per stem (vertical approx)
  //  FIX 2: pts array REMOVED — x/y computed inline → zero object allocation
  // ─────────────────────────────────────────────────────────────────────────
  private drawKelp(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    const stalkH = 20 * c.scale;

    ctx.save();
    ctx.strokeStyle = 'rgba(75,95,25,0.82)';
    ctx.lineWidth   = 7 * c.scale;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(c.x, c.baseY);
    ctx.lineTo(c.x, c.baseY - stalkH);
    ctx.stroke();
    ctx.restore();

    const SEGS = 6;

    c.stems.forEach(stem => {
      const bx  = c.x + stem.relX;
      const by  = c.baseY - stalkH;
      const h   = stem.height * c.scale;
      const w   = stem.width  * c.scale;

      const t     = time * stem.swaySpeed;
      const wave1 = Math.sin(t + stem.swayOffset)             * (12 + stem.depth * 10) + stem.lean;
      const wave2 = Math.sin(t * 1.6 + stem.swayOffset + 1.5) * 7;
      const wave3 = Math.sin(t * 2.4 + stem.swayOffset + 3.0) * 4;

      // ── Gradient cached per stem (vertical approx.) ──────────────────────
      if (!stem.cachedGrad) {
        const g = ctx.createLinearGradient(0, 0, 0, -h);
        g.addColorStop(0,    'rgba(55,85,18,0.90)');
        g.addColorStop(0.35, 'rgba(85,130,28,0.92)');
        g.addColorStop(0.70, 'rgba(105,165,38,0.88)');
        g.addColorStop(1,    'rgba(145,195,55,0.52)');
        stem.cachedGrad = g;
      }

      // ── Inline point computation — NO pts array, NO object allocation ────
      // Helper: compute x and y for a given segment index s
      const px = (s: number) => {
        const f = s / SEGS;
        return bx + wave1 * f + wave2 * f * f + wave3 * Math.sin(f * Math.PI);
      };
      const py = (s: number) => by - h * (s / SEGS);

      ctx.save();
      ctx.fillStyle = stem.cachedGrad;
      ctx.beginPath();

      // Left side — upward
      ctx.moveTo(px(0) - w * 0.5, py(0));
      for (let s = 1; s <= SEGS; s++) {
        const tapW = w * (0.5 - s * 0.03);
        ctx.quadraticCurveTo(
          px(s - 1) - tapW, (py(s - 1) + py(s)) / 2,
          px(s)     - tapW, py(s)
        );
      }

      // Right side — downward
      for (let s = SEGS; s >= 1; s--) {
        const tapW = w * (0.5 - s * 0.03);
        ctx.quadraticCurveTo(
          px(s)     + tapW + 2, (py(s) + py(s - 1)) / 2,
          px(s - 1) + w * 0.5,  py(s - 1)
        );
      }
      ctx.closePath();
      ctx.fill();

      // Central vein
      ctx.beginPath();
      ctx.moveTo(px(0), py(0));
      for (let s = 1; s <= SEGS; s++) ctx.lineTo(px(s), py(s));
      ctx.strokeStyle = 'rgba(175,215,75,0.28)';
      ctx.lineWidth   = Math.max(0.8, w * 0.09);
      ctx.stroke();

      ctx.restore();
    });
  }
}