// ─────────────────────────────────────────────────────────────────────────────
//  SeaGrass  v3  — 5 distinct animated plant types
//
//  FIXES from v2:
//    • branch: complete rewrite using proper angle/cos/sin geometry
//      (old code used dx/dy ratio which made near-horizontal lines)
//    • broadleaf: redesigned as sea-anemone (tentacles + bulb body)
//    • blade: tightened midrib highlight
//    • silhouette: slightly more natural taper
//    • kelp: smoother segment curves
//
//  Types:
//    blade      — bright vivid-green thin upright blades (front layer)
//    silhouette — dark navy shadow blades (background depth layer)
//    anemone    — sea anemone: round body + swaying tentacles (was broadleaf)
//    branch     — proper angle-based fractal teal coral tree
//    kelp       — wide flat undulating ribbon fronds, olive-green
// ─────────────────────────────────────────────────────────────────────────────

export type GrassType = 'blade' | 'silhouette' | 'anemone' | 'branch' | 'kelp';

interface Stem {
  relX:       number;
  height:     number;
  width:      number;
  swaySpeed:  number;
  swayOffset: number;
  lean:       number;
  depth:      number;
  angle:      number;
  hue:        number;
}

interface Cluster {
  x:         number;
  baseY:     number;
  stems:     Stem[];
  type:      GrassType;
  baseWidth: number;
  scale:     number;
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
      { type: 'silhouette', count: 4 },   // fewer, shorter (was 6)
      { type: 'kelp',       count: 4 },
      { type: 'branch',     count: 5 },   // more but much smaller/darker
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
      x, baseY: this.gameHeight,
      stems, type: t,
      baseWidth: this.clusterWidth(t),
      // Branch gets a much smaller scale to keep it as a subtle shadow
      scale: t === 'branch'
        ? 0.35 + Math.random() * 0.30   // 0.35–0.65 (was 0.85–1.25)
        : t === 'silhouette'
          ? 0.55 + Math.random() * 0.35  // 0.55–0.90
          : 0.80 + Math.random() * 0.45, // other types
    });
  }

  private stemCount(t: GrassType): number {
    switch (t) {
      case 'blade':      return 4 + Math.floor(Math.random() * 5);   // 4–8 (was 5–13)
      case 'silhouette': return 3 + Math.floor(Math.random() * 3);   // 3–5 (was 4–9)
      case 'anemone':    return 6 + Math.floor(Math.random() * 6);
      case 'branch':     return 1;
      case 'kelp':       return 2 + Math.floor(Math.random() * 2);   // 2–3
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
        // Varied heights but capped lower — 40–160px (was 55–235px)
        base.height = 40 + Math.random() * 120;
        base.width  = 5  + Math.random() * 8;
        base.angle  = (Math.random() - 0.5) * 0.30;
        break;
      case 'silhouette':
        // Shorter shadow blades — 60–130px (was 140–280px)
        base.height = 60 + Math.random() * 70;
        base.width  = 5  + Math.random() * 4;
        base.swaySpeed *= 0.65;
        break;
      case 'anemone':
        // Each "stem" is a tentacle — height = tentacle length
        base.height = 28 + Math.random() * 36;
        base.width  = 4  + Math.random() * 5;
        base.swaySpeed *= 1.20; // tentacles sway faster
        break;
      case 'branch':
        // Short shadow branch — 40–90px (was 90–180px)
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
  //  UPDATE
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

      // Player lean — blade + kelp only
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
  //  DRAW
  // ─────────────────────────────────────────────────────────────────────────
  draw(ctx: CanvasRenderingContext2D): void {
    const time = Date.now();
    const order: GrassType[] = ['branch','silhouette','kelp','anemone','blade'];
    order.forEach(type => {
      this.clusters
        .filter(c => c.type === type)
        .forEach(c => this.drawCluster(ctx, c, time));
    });
  }

  private drawCluster(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    switch (c.type) {
      case 'blade':      this.drawBlades(ctx, c, time);    break;
      case 'silhouette': this.drawSilhouette(ctx, c, time);break;
      case 'anemone':    this.drawAnemone(ctx, c, time);   break;
      case 'branch':     this.drawBranch(ctx, c, time);    break;
      case 'kelp':       this.drawKelp(ctx, c, time);      break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  TYPE 1: BLADE  — organic curved seagrass with tapered pointed tip,
  //  varying heights, natural splaying angles, rooted into sand
  // ─────────────────────────────────────────────────────────────────────────
  private drawBlades(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    // ── Sand root mound — blades emerge FROM the sand ──────────────
    ctx.save();
    const moundW = c.baseWidth * 0.65;
    const grad2  = ctx.createRadialGradient(c.x, c.baseY, 0, c.x, c.baseY, moundW);
    grad2.addColorStop(0,   'rgba(185,148,85,0.55)');
    grad2.addColorStop(0.5, 'rgba(165,128,68,0.35)');
    grad2.addColorStop(1,   'rgba(145,110,55,0.0)');
    ctx.beginPath();
    ctx.ellipse(c.x, c.baseY, moundW, 13, 0, 0, Math.PI);
    ctx.fillStyle = grad2;
    ctx.fill();
    ctx.restore();

    // Sort blades tallest-to-shortest so shorter ones overlap in front
    const sorted = [...c.stems].sort((a, b) => b.height - a.height);

    sorted.forEach((stem, i) => {
      const h  = stem.height * c.scale;
      const w  = stem.width  * c.scale;

      // Each blade has a fixed natural lean (stem.angle) PLUS live sway
      // Sway is stronger for tall blades, weaker for short stubby ones
      const swayMag = 8 + (h / 200) * 22;
      const sway =
        Math.sin(time * stem.swaySpeed + stem.swayOffset)         * swayMag +
        Math.sin(time * stem.swaySpeed * 1.9 + stem.swayOffset + 1.2) * swayMag * 0.28;

      // Base position — anchored exactly at sand surface
      const bx = c.x + stem.relX;
      const by = c.baseY; // exactly at ground level

      // Natural lean from angle + sway
      const totalLean  = stem.angle * h + sway + stem.lean;

      // Control points for the S-curve:
      // Lower third: mostly upright (roots hold it)
      // Upper third: bends with current (tip follows sway)
      const cp1x = bx + totalLean * 0.18;
      const cp1y = by - h * 0.38;
      const cp2x = bx + totalLean * 0.62;
      const cp2y = by - h * 0.70;
      const tipX  = bx + totalLean;
      const tipY  = by - h;

      // Blade width tapers: wide at base → nearly 0 at pointed tip
      // We draw the blade as a filled bezier path with left and right edges
      const baseHalfW  = w * 0.50;
      const midHalfW   = w * 0.32;
      const tipHalfW   = 0.8; // pointed tip

      // Colour: rich dark green at root → vivid lime at tip
      // Slightly different hue per blade using stem.hue for variety
      const hueShift = Math.round(stem.hue * 25);
      const grad = ctx.createLinearGradient(bx, by, tipX, tipY);
      grad.addColorStop(0,    `rgba(${22+hueShift},${78+hueShift},${28},0.92)`);
      grad.addColorStop(0.28, `rgba(${38+hueShift},${130+hueShift},${45},0.94)`);
      grad.addColorStop(0.62, `rgba(${58+hueShift},${175+hueShift},${62},0.96)`);
      grad.addColorStop(0.88, `rgba(${95+hueShift},${210+hueShift},${78},0.90)`);
      grad.addColorStop(1,    `rgba(${145+hueShift},${230+hueShift},${100},0.55)`);

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();

      // LEFT edge: base → tip using cubic bezier
      ctx.moveTo(bx - baseHalfW, by);
      ctx.bezierCurveTo(
        cp1x - midHalfW,  cp1y,         // control 1 (lower)
        cp2x - midHalfW,  cp2y,         // control 2 (upper)
        tipX - tipHalfW,  tipY          // pointed tip left
      );

      // Tip — tiny pointed arc connecting left to right edge
      ctx.quadraticCurveTo(tipX, tipY - 2, tipX + tipHalfW, tipY);

      // RIGHT edge: tip → base (reverse bezier)
      ctx.bezierCurveTo(
        cp2x + midHalfW,  cp2y,
        cp1x + midHalfW,  cp1y,
        bx   + baseHalfW, by
      );

      ctx.closePath();
      ctx.fill();

      // ── Midrib — central vein catching light ─────────────────────
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tipX, tipY);
      ctx.strokeStyle = `rgba(185,240,140,0.38)`;
      ctx.lineWidth   = Math.max(0.5, w * 0.10);
      ctx.stroke();

      // ── Edge highlight — bright rim on the lit side ───────────────
      ctx.beginPath();
      ctx.moveTo(bx + baseHalfW * 0.6, by);
      ctx.bezierCurveTo(
        cp1x + midHalfW * 0.5, cp1y,
        cp2x + midHalfW * 0.3, cp2y,
        tipX, tipY
      );
      ctx.strokeStyle = `rgba(200,250,160,0.22)`;
      ctx.lineWidth   = Math.max(0.4, w * 0.07);
      ctx.stroke();

      ctx.restore();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  TYPE 2: SILHOUETTE
  // ─────────────────────────────────────────────────────────────────────────
  private drawSilhouette(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    c.stems.forEach(stem => {
      const sway =
        Math.sin(time * stem.swaySpeed + stem.swayOffset) * (8 + stem.depth * 12) +
        Math.sin(time * stem.swaySpeed * 2.1 + stem.swayOffset + 1) * 3;

      const bx   = c.x + stem.relX;
      const by   = c.baseY;
      const h    = stem.height * c.scale;
      const w    = stem.width  * c.scale;
      const tipX = bx + sway + stem.angle * h;
      const tipY = by - h;

      const grad = ctx.createLinearGradient(bx, by, tipX, tipY);
      grad.addColorStop(0,   'rgba(16,30,68,0.92)');
      grad.addColorStop(0.5, 'rgba(26,50,105,0.82)');
      grad.addColorStop(1,   'rgba(42,75,145,0.38)');

      ctx.save();
      ctx.fillStyle = grad;
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
  //  TYPE 3: ANEMONE  — round bulb body + swaying tentacles
  //  Replaces the old "broadleaf" that rendered as a plain white blob
  // ─────────────────────────────────────────────────────────────────────────
  private drawAnemone(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    const bw   = c.baseWidth * c.scale;
    const bulbR = bw * 0.50;
    const bulbX = c.x;
    const bulbY = c.baseY - bulbR * 0.55;

    // ── Bulb body ──────────────────────────────────────────────────
    const bodyGrad = ctx.createRadialGradient(
      bulbX - bulbR * 0.25, bulbY - bulbR * 0.25, bulbR * 0.05,
      bulbX, bulbY, bulbR
    );
    // Warm orange-yellow anemone body matching reference palette
    bodyGrad.addColorStop(0,   'rgba(255,200,80,0.95)');
    bodyGrad.addColorStop(0.5, 'rgba(220,140,40,0.90)');
    bodyGrad.addColorStop(1,   'rgba(170,85,20,0.80)');

    ctx.save();
    ctx.beginPath();
    // Slightly squashed ellipse sitting on the sand
    ctx.ellipse(bulbX, bulbY, bulbR, bulbR * 0.72, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,110,30,0.50)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Body texture dots
    for (let d = 0; d < 5; d++) {
      const dx = bulbX + (Math.random() - 0.5) * bulbR * 1.2;
      const dy = bulbY + (Math.random() - 0.5) * bulbR * 0.7;
      ctx.beginPath();
      ctx.arc(dx, dy, 2 + Math.random() * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,240,140,0.45)';
      ctx.fill();
    }
    ctx.restore();

    // ── Tentacles — each stem is one swaying arm ───────────────────
    c.stems.forEach((stem, idx) => {
      const totalTentacles = c.stems.length;
      // Spread tentacles evenly across top of bulb (arc 180°)
      const baseAngle = Math.PI + (idx / (totalTentacles - 1)) * Math.PI;
      const tentLen   = stem.height * c.scale;

      // Per-tentacle sway — each gets its own phase so they ripple
      const swayAngle =
        Math.sin(time * stem.swaySpeed + stem.swayOffset) * 0.38 +
        Math.sin(time * stem.swaySpeed * 1.9 + stem.swayOffset + idx) * 0.16;

      const angle = baseAngle + swayAngle;

      // Start from top of bulb
      const startX = bulbX + Math.cos(baseAngle) * bulbR * 0.70;
      const startY = bulbY + Math.sin(baseAngle) * bulbR * 0.55;

      // Tentacle tip with sway
      const tipX = startX + Math.cos(angle) * tentLen;
      const tipY = startY + Math.sin(angle) * tentLen;

      // Control point creates natural curve
      const ctrlX = startX + Math.cos(angle - 0.4) * tentLen * 0.55;
      const ctrlY = startY + Math.sin(angle - 0.4) * tentLen * 0.55;

      const w = stem.width * c.scale;

      // Tentacle colour — orange-pink gradient fading to transparent tip
      const tGrad = ctx.createLinearGradient(startX, startY, tipX, tipY);
      tGrad.addColorStop(0,   'rgba(230,100,60,0.90)');
      tGrad.addColorStop(0.5, 'rgba(255,140,80,0.80)');
      tGrad.addColorStop(1,   'rgba(255,200,140,0.30)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX - w * 0.40, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.quadraticCurveTo(ctrlX + w * 0.5, ctrlY, startX + w * 0.40, startY);
      ctx.closePath();
      ctx.fillStyle = tGrad;
      ctx.fill();

      // Tip knob (sucker)
      ctx.beginPath();
      ctx.arc(tipX, tipY, w * 0.65, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,220,160,0.75)';
      ctx.fill();
      ctx.restore();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  TYPE 4: BRANCH  — dark navy shadow silhouette (background depth marker)
  //
  //  Deliberately NOT colored — these are distance shadows like the dark
  //  seaweed silhouettes in the reference image. No teal, no glowing dots.
  //  Short, semi-transparent, drawn far behind everything else.
  // ─────────────────────────────────────────────────────────────────────────
  private drawBranch(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    const stem      = c.stems[0];
    const totalH    = stem.height * c.scale;
    const masterSway = Math.sin(time * stem.swaySpeed + stem.swayOffset) * 0.055;

    // Very low opacity — these are background shadows, not focal points
    ctx.save();
    ctx.globalAlpha = 0.28 + Math.random() * 0.18; // 0.28–0.46
    ctx.translate(c.x, c.baseY);

    this.drawBranchNode(
      ctx,
      0, 0,
      -Math.PI / 2,
      totalH * 0.40,
      4,              // only 4 levels deep (was 5) — less dense
      totalH,
      masterSway,
      1.0
    );

    ctx.restore();
  }

  // Dark shadow branch — no colour gradient, pure dark navy
  private drawBranchNode(
    ctx:        CanvasRenderingContext2D,
    x:          number, y: number,
    angle:      number,
    segLen:     number,
    depth:      number,
    totalH:     number,
    masterSway: number,
    swayMult:   number
  ): void {
    if (depth <= 0 || segLen < 3) return;

    const swayedAngle = angle + masterSway * swayMult;
    const ex = x + Math.cos(swayedAngle) * segLen;
    const ey = y + Math.sin(swayedAngle) * segLen;

    const progress  = 1 - depth / 4;
    const thickness = Math.max(0.5, depth * 1.4 - 0.3);

    // Single dark navy color — no teal, no cyan gradient
    // Gets slightly lighter toward tips for natural ink look
    const lightness = Math.round(28 + progress * 22);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = `rgba(${lightness}, ${lightness + 10}, ${lightness + 35}, ${0.75 - progress * 0.25})`;
    ctx.lineWidth   = thickness;
    ctx.lineCap     = 'round';
    ctx.stroke();
    ctx.restore();

    // NO dots at nodes — they made it look like a sci-fi coral, not a shadow

    const nextLen    = segLen * 0.58;
    const spread     = 0.50 + depth * 0.035;

    this.drawBranchNode(ctx, ex, ey, swayedAngle - spread, nextLen, depth - 1, totalH, masterSway, swayMult * 0.70);
    this.drawBranchNode(ctx, ex, ey, swayedAngle + spread, nextLen, depth - 1, totalH, masterSway, swayMult * 0.70);
    if (depth >= 3 && Math.random() > 0.42) {
      this.drawBranchNode(ctx, ex, ey, swayedAngle + (Math.random() - 0.5) * 0.18, nextLen * 0.75, depth - 1, totalH, masterSway, swayMult * 0.50);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  TYPE 5: KELP  — wide undulating ribbon fronds, olive-green
  // ─────────────────────────────────────────────────────────────────────────
  private drawKelp(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    // Thick rubbery stalk
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

    c.stems.forEach(stem => {
      const bx = c.x + stem.relX;
      const by = c.baseY - stalkH;
      const h  = stem.height * c.scale;
      const w  = stem.width  * c.scale;

      const t      = time * stem.swaySpeed;
      const wave1  = Math.sin(t + stem.swayOffset)             * (12 + stem.depth * 10) + stem.lean;
      const wave2  = Math.sin(t * 1.6 + stem.swayOffset + 1.5) * 7;
      const wave3  = Math.sin(t * 2.4 + stem.swayOffset + 3.0) * 4;

      // 6 waypoints along the frond for smoother curve
      const segs = 6;
      const pts: { x: number; y: number }[] = [];
      for (let s = 0; s <= segs; s++) {
        const f = s / segs;
        const wx = wave1*f + wave2*f*f + wave3*Math.sin(f * Math.PI);
        pts.push({ x: bx + wx, y: by - h * f });
      }

      const grad = ctx.createLinearGradient(bx, by, pts[segs].x, pts[segs].y);
      grad.addColorStop(0,    'rgba(55,85,18,0.90)');
      grad.addColorStop(0.35, 'rgba(85,130,28,0.92)');
      grad.addColorStop(0.70, 'rgba(105,165,38,0.88)');
      grad.addColorStop(1,    'rgba(145,195,55,0.52)');

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();

      ctx.moveTo(pts[0].x - w * 0.5, pts[0].y);
      for (let s = 1; s <= segs; s++) {
        const prev = pts[s-1], curr = pts[s];
        const tapW = w * (0.5 - s * 0.03); // tapers toward tip
        ctx.quadraticCurveTo(
          prev.x - tapW, (prev.y + curr.y) / 2,
          curr.x - tapW, curr.y
        );
      }
      for (let s = segs; s >= 1; s--) {
        const prev = pts[s], curr = pts[s-1];
        const tapW = w * (0.5 - s * 0.03);
        ctx.quadraticCurveTo(
          prev.x + tapW + 2, (prev.y + curr.y) / 2,
          curr.x + w * 0.5, curr.y
        );
      }
      ctx.closePath();
      ctx.fill();

      // Midrib line
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = 'rgba(175,215,75,0.28)';
      ctx.lineWidth   = Math.max(0.8, w * 0.09);
      ctx.stroke();

      ctx.restore();
    });
  }
}