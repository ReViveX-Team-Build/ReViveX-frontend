// ─── Core Types ────────────────────────────────────────────────────────────
// Defines the visual styles available for our sea flora
export type GrassType = 'blade' | 'silhouette' | 'anemone' | 'branch' | 'kelp';

// Represents a single strand, tentacle, or kelp frond
interface Stem {
  relX:       number;  // Position relative to the cluster's center
  height:     number;
  width:      number;
  swaySpeed:  number;  // Base speed for the sine wave animation
  swayOffset: number;  // Phase shift so they don't sway in perfect unison
  lean:       number;  // Interactive bend caused by the player
  depth:      number;  // Used for parallax or shadow intensity
  angle:      number;  // Natural resting angle
  hue:        number;  // Slight color variation per stem
}

// A logical grouping of stems that share a base position
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
  // Initial scene seeding. Adjust counts here to change overall density.
  private init(): void {
    const plan: { type: GrassType; count: number }[] = [
      { type: 'silhouette', count: 4 },   // Fewer, shorter background elements
      { type: 'kelp',       count: 4 },
      { type: 'branch',     count: 5 },   // More but much smaller/darker shadows
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
  // Generates a new grouping of flora at a specific X coordinate
  addCluster(x: number, type?: GrassType): void {
    const types: GrassType[] = ['blade','silhouette','anemone','branch','kelp'];
    const t = type ?? types[Math.floor(Math.random() * types.length)];

    const stemCount = this.stemCount(t);
    const stems: Stem[] = [];
    for (let j = 0; j < stemCount; j++) {
      stems.push(this.makeStem(t, j, stemCount));
    }

    this.clusters.push({
      x, 
      baseY: this.gameHeight,
      stems, 
      type: t,
      baseWidth: this.clusterWidth(t),
      // Specific scaling rules: Branches are kept small to act as subtle shadows
      scale: t === 'branch'
        ? 0.35 + Math.random() * 0.30   // 0.35–0.65 range
        : t === 'silhouette'
          ? 0.55 + Math.random() * 0.35  // 0.55–0.90 range
          : 0.80 + Math.random() * 0.45, // other types
    });
  }

  // Helper to determine the density of a cluster based on its type
  private stemCount(t: GrassType): number {
    switch (t) {
      case 'blade':      return 4 + Math.floor(Math.random() * 5);   // 4–8
      case 'silhouette': return 3 + Math.floor(Math.random() * 3);   // 3–5
      case 'anemone':    return 6 + Math.floor(Math.random() * 6);   // 6-11
      case 'branch':     return 1;                                   // Single distinct shape
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

  // Constructs the individual properties for a single stem/frond
  private makeStem(t: GrassType, idx: number, total: number): Stem {
    const spread = this.clusterWidth(t);
    
    // Distribute stems evenly across the cluster's width with a slight random jitter
    const relX = total > 1
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

    // Apply type-specific dimensions and animation overrides
    switch (t) {
      case 'blade':
        base.height = 40 + Math.random() * 120;
        base.width  = 5  + Math.random() * 8;
        base.angle  = (Math.random() - 0.5) * 0.30;
        break;
      case 'silhouette':
        base.height = 60 + Math.random() * 70;
        base.width  = 5  + Math.random() * 4;
        base.swaySpeed *= 0.65; // Moves slower in the background
        break;
      case 'anemone':
        base.height = 28 + Math.random() * 36;
        base.width  = 4  + Math.random() * 5;
        base.swaySpeed *= 1.20; // Tentacles are more active
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
  //  UPDATE LOOP
  // ─────────────────────────────────────────────────────────────────────────
  update(playerX: number, playerY: number, _speed: number): void {
    for (let i = this.clusters.length - 1; i >= 0; i--) {
      const c = this.clusters[i];
      c.x -= 2; // Move left to simulate camera scrolling right
      
      // Clean up clusters that have moved completely off-screen
      if (c.x < -220) { 
        this.clusters.splice(i, 1); 
        continue; 
      }

      // Repopulate off-screen to the right to keep the environment dense
      if (this.clusters.length < 20) {
        const types: GrassType[] = ['blade','silhouette','branch','branch','kelp','anemone'];
        this.addCluster(
          this.gameWidth + 100 + Math.random() * 160,
          types[Math.floor(Math.random() * types.length)]
        );
      }

      // Calculate interactive physics (lean) for applicable types
      if (c.type === 'blade' || c.type === 'kelp') {
        c.stems.forEach(stem => {
          const sx   = c.x + stem.relX;
          const dist = playerX - sx;
          const nearBottom = playerY > this.gameHeight - stem.height * c.scale - 55;
          
          // Apply a force if the player is close, otherwise gradually return to center
          if (Math.abs(dist) < 90 && nearBottom) {
            stem.lean = Math.max(-44, Math.min(44, stem.lean - dist * 0.20));
          } else {
            stem.lean *= 0.87; // Damping factor
          }
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  DRAW DISPATCHER
  // ─────────────────────────────────────────────────────────────────────────
  draw(ctx: CanvasRenderingContext2D): void {
    const time = Date.now();
    
    // Explicit Z-ordering: Draw background shadows first, foreground blades last
    const order: GrassType[] = ['branch','silhouette','kelp','anemone','blade'];
    
    order.forEach(type => {
      this.clusters
        .filter(c => c.type === type)
        .forEach(c => this.drawCluster(ctx, c, time));
    });
  }

  private drawCluster(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    switch (c.type) {
      case 'blade':      this.drawBlades(ctx, c, time);      break;
      case 'silhouette': this.drawSilhouette(ctx, c, time);  break;
      case 'anemone':    this.drawAnemone(ctx, c, time);     break;
      case 'branch':     this.drawBranch(ctx, c, time);      break;
      case 'kelp':       this.drawKelp(ctx, c, time);        break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  TYPE 1: BLADE — organic curved seagrass with tapered pointed tip,
  //  varying heights, natural splaying angles, rooted into sand
  // ─────────────────────────────────────────────────────────────────────────
  private drawBlades(ctx: CanvasRenderingContext2D, c: Cluster, time: number): void {
    // ── Sand root mound — visually anchors the blades to the ground ──
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

    // Sort blades tallest-to-shortest so shorter ones overlap correctly in front
    const sorted = [...c.stems].sort((a, b) => b.height - a.height);

    sorted.forEach((stem, i) => {
      const h = stem.height * c.scale;
      const w = stem.width  * c.scale;

      // Calculates organic movement combining baseline sway and higher frequency ripples
      const swayMag = 8 + (h / 200) * 22;
      const sway =
        Math.sin(time * stem.swaySpeed + stem.swayOffset)         * swayMag +
        Math.sin(time * stem.swaySpeed * 1.9 + stem.swayOffset + 1.2) * swayMag * 0.28;

      const bx = c.x + stem.relX;
      const by = c.baseY; 
      const totalLean = stem.angle * h + sway + stem.lean;

      // S-curve control points: firm at the base, bending at the top
      const cp1x = bx + totalLean * 0.18;
      const cp1y = by - h * 0.38;
      const cp2x = bx + totalLean * 0.62;
      const cp2y = by - h * 0.70;
      const tipX = bx + totalLean;
      const tipY = by - h;

      const baseHalfW  = w * 0.50;
      const midHalfW   = w * 0.32;
      const tipHalfW   = 0.8;

      // Slight hue shift per blade for natural color variation
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

      // Draw the left edge upward
      ctx.moveTo(bx - baseHalfW, by);
      ctx.bezierCurveTo(
        cp1x - midHalfW,  cp1y,       
        cp2x - midHalfW,  cp2y,       
        tipX - tipHalfW,  tipY          
      );

      // Connect the tip
      ctx.quadraticCurveTo(tipX, tipY - 2, tipX + tipHalfW, tipY);

      // Draw the right edge downward
      ctx.bezierCurveTo(
        cp2x + midHalfW,  cp2y,
        cp1x + midHalfW,  cp1y,
        bx   + baseHalfW, by
      );

      ctx.closePath();
      ctx.fill();

      // Render the structural midrib catching the light
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, tipX, tipY);
      ctx.strokeStyle = `rgba(185,240,140,0.38)`;
      ctx.lineWidth   = Math.max(0.5, w * 0.10);
      ctx.stroke();

      // Add a bright highlight rim on one side for depth
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
  //  TYPE 2: SILHOUETTE — Deep background elements providing parallax depth
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

      // Darker, less saturated gradient to simulate distance/water turbidity
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