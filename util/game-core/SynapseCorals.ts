// ─── What are we drawing? ──────────────────────────────────────────────────
type CoralSVG = 'fan' | 'orange' | 'pipu' | 'purple' | 'pur1' | 'red' | 'tubes' | 'branchy' | 'bulbcluster';
type GroundSVG = 'shell1';
type AssetKey = CoralSVG | GroundSVG;

type DepthLayer = 0 | 1 | 2;

const ASSET_SIZE: Record<AssetKey, { w: number; h: number }> = {
  fan:      { w: 200, h: 360 },
  orange:   { w: 180, h: 260 },
  pipu:     { w: 265, h: 300 },
  purple:   { w: 255, h: 315 },
  pur1:     { w: 250, h: 320 },
  red:      { w: 255, h: 295 },
  tubes:    { w: 200, h: 340 },
  shell1:   { w: 100, h: 80 },
  branchy:  { w: 240, h: 320 },
  bulbcluster: { w: 180, h: 280 },
};

// How far up from the bottom of the image is the VISUAL ROOT of the coral/object?
// Value is a fraction 0-1: e.g. 0.08 = bottom 8% of image height is transparent padding.
// This shifts the drawImage down so the visual base always sits exactly on the sand.
const ASSET_FOOT_PAD: Record<AssetKey, number> = {
  fan:       0.04,  // small stem touches bottom
  orange:    0.12,  // notable transparent gap at bottom of coral_or.svg
  pipu:      0.06,
  purple:    0.05,
  pur1:      0.05,
  red:       0.06,
  tubes:     0.04,
  shell1:    0.04,
  branchy:   0.00,   // procedural — base is exact
  bulbcluster: 0.00, // procedural — base is exact
};

// 🔴 FIX: Drastically reduced sway values to prevent diagonal SVG stretching
const ASSET_SWAY: Record<AssetKey, number> = {
  fan: 0.040, orange: 0.025, pipu: 0.030, purple: 0.025,
  pur1: 0.030, red: 0.020, tubes: 0.040,
  shell1: 0.000,
  branchy: 0.035, bulbcluster: 0.050,
};

const ASSET_GLOW: Record<AssetKey, string> = {
  fan:       'rgba(218,112,214,0.85)',
  orange:    'rgba(255,160,80,0.80)',
  pipu:      'rgba(255,100,180,0.85)',
  purple:    'rgba(200,100,255,0.85)',
  pur1:      'rgba(190,90,255,0.88)',
  red:       'rgba(255,80,80,0.82)',
  tubes:     'rgba(127,255,212,0.75)',
  shell1:      'rgba(220,180,140,0.50)',
  branchy:     'rgba(255,140,60,0.70)',
  bulbcluster: 'rgba(120,240,200,0.75)',
};

const ASSET_SRC: Record<AssetKey, string> = {
  fan:       '/images/fan_coral.svg',    orange:    '/images/coral_or.svg',
  pipu:      '/images/coral_pipu.svg',   purple:    '/images/coral_pur.svg',
  pur1:      '/images/coral_pur1.svg',   red:       '/images/coral_red.svg',
  tubes:     '/images/coral_tube.svg',
  shell1:      '/images/shell1.svg',
  branchy:     '',   // procedural — drawn on offscreen canvas
  bulbcluster: '',   // procedural — drawn on offscreen canvas
};

// 🔴 FIX: Reduced max scales so they don't look gigantic and cluttered
const LAYER_PROPS: Record<DepthLayer, {
  scaleRange:   [number, number];
  opacityRange: [number, number];
  blueTint:     number;
  yOffset:      number;
  parallaxMult: number; 
}> = {
  // yOffset 0 for ALL layers — every coral anchors on the sand.
  // Depth is communicated through scale + opacity + shadow only, never Y position.
  0: { scaleRange: [0.12, 0.28], opacityRange: [0.25, 0.48], blueTint: 0.70, yOffset: 0, parallaxMult: 0.4 },
  1: { scaleRange: [0.28, 0.48], opacityRange: [0.60, 0.82], blueTint: 0.28, yOffset: 0, parallaxMult: 0.7 },
  2: { scaleRange: [0.45, 0.72], opacityRange: [0.90, 1.00], blueTint: 0.00, yOffset: 0, parallaxMult: 1.0 },
};

const LANE_MIN_DIST: Record<DepthLayer, number> = { 0: 80, 1: 160, 2: 260 };

// ─── DATA STRUCTURES ───────────────────────────────────────────────────────
interface CoralSprite {
  kind:         'sprite';
  asset:        AssetKey;
  x:            number;
  yOffset:      number; // 🔴 FIX: Using relative offset from sand, not absolute Y
  scale:        number;
  layer:        DepthLayer;
  swayOff:      number; 
  opacity:      number;
  hueRotate:    number;
  isFleshy:     boolean;
  breathePhase: number;
  seed:         number;   // deterministic seed for procedural corals
}

interface Boulder {
  x: number; yOffset: number; rx: number; ry: number; rot: number;
}

interface ReefGroup {
  kind:     'reef';
  x:        number;
  layer:    DepthLayer;
  boulders: Boulder[];
  corals:   CoralSprite[];
  pebbles:  { x: number; yOffset: number; r: number; rot: number }[];
}

type SceneItem = CoralSprite | ReefGroup;

export class SynapseCorals {
  gameWidth:  number;
  gameHeight: number;

  private items: SceneItem[] = [];
  private imgs:  Record<AssetKey, HTMLImageElement>;
  private ready: Record<AssetKey, boolean>;

  private tintCache: Record<string, HTMLCanvasElement> = {};
  private _sorted: SceneItem[] = [];
  private _sortDirty = true;

  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth  = gameWidth;
    this.gameHeight = gameHeight;
    this.ready = {} as Record<AssetKey, boolean>;

    const load = (src: string, key: AssetKey): HTMLImageElement => {
      const img = new Image();
      if (src) {
        this.ready[key] = false;
        img.onload = () => { this.ready[key] = true; };
        img.src = src;
      } else {
        // Procedural asset — always "ready", no image to load
        this.ready[key] = true;
      }
      return img;
    };

    this.imgs = Object.fromEntries(
      (Object.keys(ASSET_SRC) as AssetKey[]).map(k => [k, load(ASSET_SRC[k], k)])
    ) as Record<AssetKey, HTMLImageElement>;

    this.init();
  }

  private init(): void {
    // Layer 0 — dense background clusters
    let cx0 = 0;
    while (cx0 < this.gameWidth + 400) {
      this.addBackgroundCluster(cx0);
      cx0 += LANE_MIN_DIST[0] * (0.55 + Math.random() * 0.55);
    }
    // Layer 1 — midground, varied spacing
    let cx1 = 50;
    while (cx1 < this.gameWidth + 400) {
      this.addMidgroundSolo(cx1);
      cx1 += LANE_MIN_DIST[1] * (0.60 + Math.random() * 0.55);
    }
    // Layer 2 — foreground alternating: reef/solo/patch with no big gaps
    const pattern = ['reef','solo','reef','patch','reef','solo','patch','reef'] as const;
    let cx2 = 0;
    let pi  = 0;
    while (cx2 < this.gameWidth + 500) {
      const kind = pattern[pi % pattern.length];
      if      (kind === 'reef')  this.addReefGroup(cx2, 2);
      else if (kind === 'solo')  this.addSoloFeature(cx2, 2);
      else                       this.addPebblePatch(cx2, 2);
      cx2 += LANE_MIN_DIST[2] * (0.60 + Math.random() * 0.45);
      pi++;
    }
  }

  private ensureChunks() {
    const rightmost: Record<DepthLayer, number> = { 0: 0, 1: 0, 2: 0 };
    for (const item of this.items) {
      rightmost[item.layer] = Math.max(rightmost[item.layer], item.x);
    }
    for (let l = 0; l <= 2; l++) {
      const layer = l as DepthLayer;
      if (rightmost[layer] < this.gameWidth + 450) {
        const nx = Math.max(
          this.gameWidth + 300, 
          rightmost[layer] + LANE_MIN_DIST[layer] * (0.8 + Math.random() * 0.4)
        );
        this.spawnChunk(nx, layer);
      }
    }
  }

  private _spawnCounter = 0;  // tracks alternation for new spawns
  private spawnChunk(cx: number, layer: DepthLayer) {
    if (layer === 0) {
      this.addBackgroundCluster(cx);
    } else if (layer === 1) {
      this.addMidgroundSolo(cx);
    } else {
      // Rotate reef → solo → patch for even coverage
      const kind = this._spawnCounter % 3;
      this._spawnCounter++;
      if      (kind === 0) this.addReefGroup(cx, 2);
      else if (kind === 1) this.addSoloFeature(cx, 2);
      else                 this.addPebblePatch(cx, 2);
    }
  }

  private createCoralSprite(asset: CoralSVG | GroundSVG, x: number, yOffset: number, scale: number, layer: DepthLayer, opacity: number): CoralSprite {
    let hueRotate = 0;
    if (asset === 'pipu' || asset === 'tubes') {
      const hues = [0, 90, 140, 280]; 
      hueRotate = hues[Math.floor(Math.random() * hues.length)];
    }
    const isFleshy = ['pipu', 'tubes', 'orange'].includes(asset);

    return {
      kind: 'sprite', asset, x, yOffset, scale, layer, opacity,
      swayOff: Math.random() * 100,
      hueRotate, isFleshy,
      breathePhase: Math.random() * Math.PI * 2,
      seed: Math.floor(Math.random() * 99991) + 1,
    };
  }

  private addBackgroundCluster(cx: number): void {
    const lp = LAYER_PROPS[0];
    const types: CoralSVG[] = ['fan', 'tubes', 'orange', 'red', 'branchy'];
    const count = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const ox = (i - count / 2) * (30 + Math.random() * 25);
      const scale = lp.scaleRange[0] + Math.random() * (lp.scaleRange[1] - lp.scaleRange[0]);
      const op = lp.opacityRange[0] + Math.random() * (lp.opacityRange[1] - lp.opacityRange[0]);
      const type = types[Math.floor(Math.random() * types.length)];
      
      this._sortDirty = true;
    this.items.push(this.createCoralSprite(type, cx + ox, lp.yOffset, scale, 0, op));
    }
  }

  private addMidgroundSolo(cx: number): void {
    const lp = LAYER_PROPS[1];
    const types: CoralSVG[] = ['orange','pipu','purple','pur1','red','fan','branchy','bulbcluster'];
    const type = types[Math.floor(Math.random() * types.length)];
    const scale = lp.scaleRange[0] + Math.random() * (lp.scaleRange[1] - lp.scaleRange[0]);
    const op = lp.opacityRange[0] + Math.random() * (lp.opacityRange[1] - lp.opacityRange[0]);

    this._sortDirty = true;
    this.items.push(this.createCoralSprite(type, cx, lp.yOffset, scale, 1, op));
  }

  private addReefGroup(cx: number, layer: DepthLayer): void {
    const lp = LAYER_PROPS[layer];

    // 🔴 FIX: Fewer, wider, flatter boulders so corals have a neat "stage"
    const boulderCount = 1 + Math.floor(Math.random() * 2); 
    const boulders: Boulder[] = [];
    for (let b = 0; b < boulderCount; b++) {
      const ox = (b - boulderCount / 2) * 45 + (Math.random() - 0.5) * 15;
      const rx = 35 + Math.random() * 25; 
      const ry = rx * (0.35 + Math.random() * 0.15); 
      boulders.push({ x: cx + ox, yOffset: ry * 0.6, rx, ry, rot: (Math.random() - 0.5) * 0.2 });
    }

    const pebbles: { x: number; yOffset: number; r: number; rot: number }[] = [];
    for (let p = 0; p < 5 + Math.floor(Math.random() * 4); p++) {
      pebbles.push({ x: cx + (Math.random() - 0.5) * 110, yOffset: Math.random() * 4, r: 2 + Math.random() * 6, rot: Math.random() * Math.PI });
    }

    const coralTypes: CoralSVG[] = ['orange','pipu','purple','pur1','red','fan','branchy','bulbcluster'];
    const coralCount = 2 + Math.floor(Math.random() * 2); 
    const corals: CoralSprite[] = [];

    for (let i = 0; i < coralCount; i++) {
      const host = boulders[i % boulders.length];
      const ox = (Math.random() - 0.5) * host.rx * 1.1;
      const type = coralTypes[Math.floor(Math.random() * coralTypes.length)];
      const scaleMax = type === 'orange' ? Math.min(lp.scaleRange[1], 0.36) : lp.scaleRange[1];
      const scale = lp.scaleRange[0] + Math.random() * (scaleMax - lp.scaleRange[0]);
      const op = lp.opacityRange[0] + Math.random() * (lp.opacityRange[1] - lp.opacityRange[0]);

      // Plant firmly on top of the boulder
      corals.push(this.createCoralSprite(type, host.x + ox, host.yOffset + host.ry - 4, scale, layer, op));
    }

    if (Math.random() > 0.45) {
    }
    // Occasionally place a conch or shell at the base of a reef
    if (Math.random() > 0.65) {
      corals.push(this.createCoralSprite('shell1' as CoralSVG, cx + (Math.random() - 0.5) * 60, 0, 0.20 + Math.random() * 0.12, layer, 0.92));
    }

    this._sortDirty = true;
    this.items.push({ kind: 'reef', x: cx, layer, boulders, corals, pebbles });
  }

  private addPebblePatch(cx: number, layer: DepthLayer): void {
    const pebbles: { x: number; yOffset: number; r: number; rot: number }[] = [];
    for (let p = 0; p < 4 + Math.floor(Math.random() * 5); p++) {
      pebbles.push({ x: cx + (Math.random() - 0.5) * 90, yOffset: Math.random() * 3, r: 3 + Math.random() * 8, rot: Math.random() * Math.PI });
    }

    const corals: CoralSprite[] = [];
    if (Math.random() > 0.50) {
      const types: CoralSVG[] = ['orange','red','pipu','pur1'];
      corals.push(this.createCoralSprite(types[Math.floor(Math.random() * types.length)], cx + (Math.random() - 0.5) * 40, LAYER_PROPS[layer].yOffset, 0.22 + Math.random() * 0.15, layer, 0.88));
    }
    // Ground objects — scatter shells on the sand
    if (Math.random() > 0.55) {
      const groundTypes: AssetKey[] = ['shell1'];
      const gScale = groundTypes[0] === 'shell1' ? 0.16 + Math.random() * 0.10 : 0.20 + Math.random() * 0.14;
      corals.push(this.createCoralSprite(
        groundTypes[Math.floor(Math.random() * groundTypes.length)] as CoralSVG,
        cx + (Math.random() - 0.5) * 80, 0, gScale, layer, 0.90
      ));
    }
    this._sortDirty = true;
    this.items.push({ kind: 'reef', x: cx, layer, boulders: [], corals, pebbles });
  }

  private addSoloFeature(cx: number, layer: DepthLayer, forceType?: CoralSVG): void {
    const lp = LAYER_PROPS[layer];
    const type: CoralSVG = forceType ?? (['fan','tubes','orange','pipu','branchy','bulbcluster'] as CoralSVG[])[Math.floor(Math.random() * 6)];
    const _capSolo = type === 'orange' ? Math.min(lp.scaleRange[1], 0.36) : lp.scaleRange[1];
    const finalScale = Math.random() > 0.45
      ? lp.scaleRange[0] * 0.5 + _capSolo * 0.5 + Math.random() * (_capSolo - lp.scaleRange[0]) * 0.25
      : lp.scaleRange[0] + Math.random() * (_capSolo - lp.scaleRange[0]) * 0.45;
    const op = lp.opacityRange[0] + Math.random() * (lp.opacityRange[1] - lp.opacityRange[0]);

    this._sortDirty = true;
    this.items.push(this.createCoralSprite(type, cx, lp.yOffset, finalScale, layer, op));
  }

  update(scrollSpeed: number = 2.0): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const layerSpeed = scrollSpeed * LAYER_PROPS[item.layer].parallaxMult;
      item.x -= layerSpeed;

      if (item.x < -400) {
        this.items.splice(i, 1);
        this._sortDirty = true;
      } else if (item.kind === 'reef') {
        item.boulders.forEach(b => { b.x -= layerSpeed; });
        item.pebbles.forEach(p  => { p.x -= layerSpeed; });
        item.corals.forEach(c   => { c.x -= layerSpeed; });
      }
    }

    // Cap total items to avoid memory/render cost growing unbounded
    if (this.items.length > 120) {
      this.items.splice(0, this.items.length - 100);
      this._sortDirty = true;
    }
    this.ensureChunks();
  }

  private getCachedImage(sprite: CoralSprite, nfBkt: number): HTMLCanvasElement | HTMLImageElement | null {
    const key = `${sprite.asset}_${sprite.layer}_${sprite.hueRotate}_${sprite.seed ?? 0}_${nfBkt}`;
    if (this.tintCache[key]) return this.tintCache[key];
    if (typeof document === 'undefined') return null;

    const base = ASSET_SIZE[sprite.asset];
    const oc   = document.createElement('canvas');
    oc.width   = base.w; oc.height = base.h;
    const ctx  = oc.getContext('2d')!;

    // ── Procedural coral types ──────────────────────────────────────────
    if (sprite.asset === 'branchy') {
      this._drawBranchy(ctx, base.w, base.h, sprite.seed ?? sprite.swayOff * 37 | 0);
    } else if (sprite.asset === 'bulbcluster') {
      this._drawBulbCluster(ctx, base.w, base.h, sprite.seed ?? sprite.swayOff * 53 | 0);
    } else {
      // ── PNG/SVG assets — tint without ctx.filter ──────────────────────
      const img = this.imgs[sprite.asset];
      if (!img || !this.ready[sprite.asset]) return img;

      ctx.drawImage(img, 0, 0, base.w, base.h);

      // Bake night glow bloom into the offscreen canvas — zero per-frame cost
      if (nfBkt > 0.30 && sprite.asset !== 'shell1' && sprite.layer > 0) {
        const glowColor = ASSET_GLOW[sprite.asset];
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = nfBkt * 0.22;
        ctx.fillStyle   = glowColor;
        ctx.fillRect(0, 0, base.w, base.h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      const tint = LAYER_PROPS[sprite.layer].blueTint;
      if (tint > 0) {
        // source-atop: only paints over existing pixels, keeps transparency intact
        ctx.globalCompositeOperation = 'source-atop';
        const dark = Math.round((1 - tint * 0.28) * 255);
        ctx.globalAlpha = tint * 0.45;
        ctx.fillStyle = `rgb(${dark},${dark},255)`;
        ctx.fillRect(0, 0, base.w, base.h);
        ctx.globalAlpha = tint * 0.30;
        ctx.fillStyle = `hsl(210,15%,${Math.round((1-tint*0.22)*38)}%)`;
        ctx.fillRect(0, 0, base.w, base.h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
      if (sprite.hueRotate > 0) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = `hsl(${sprite.hueRotate},80%,50%)`;
        ctx.fillRect(0, 0, base.w, base.h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    // Evict cache if it grows too large (many unique sprites × nf buckets)
    if (Object.keys(this.tintCache).length > 200) {
      const oldest = Object.keys(this.tintCache).slice(0, 50);
      oldest.forEach(k => delete this.tintCache[k]);
    }
    this.tintCache[key] = oc;
    return oc;
  }

  // ── Procedural branching coral (like the orange one in the reference) ──
  private _drawBranchy(ctx: CanvasRenderingContext2D, W: number, H: number, seed: number): void {
    // Seeded PRNG for deterministic shape
    let s = seed | 1;
    const rng = () => { s ^= s<<13; s ^= s>>17; s ^= s<<5; return (s>>>0)/4294967296; };

    const hue   = 15  + rng() * 30;   // warm orange-red range 15–45°
    const hue2  = hue + 15 + rng()*15;
    const cx    = W / 2;
    const bot   = H - 2;
    const lw    = Math.max(2.5, W * 0.038);

    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    const branch = (x: number, y: number, angle: number, len: number, depth: number) => {
      if (depth <= 0 || len < 3) return;
      const ex = x + Math.cos(angle) * len;
      const ey = y + Math.sin(angle) * len;

      const t   = 1 - depth / 5;
      const col = depth > 2
        ? `hsl(${hue},90%,${48 + t*14}%)`
        : `hsl(${hue2},85%,${62 + t*12}%)`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey);
      ctx.strokeStyle = col;
      ctx.lineWidth   = lw * (0.28 + depth * 0.18);
      ctx.stroke();

      // Tip knobs on terminal branches
      if (depth === 1) {
        ctx.beginPath(); ctx.arc(ex, ey, lw * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hue2},90%,72%)`; ctx.fill();
      }

      const spread = 0.40 + rng() * 0.20;
      branch(ex, ey, angle - spread + (rng()-0.5)*0.18, len*(0.58+rng()*0.08), depth-1);
      branch(ex, ey, angle + spread + (rng()-0.5)*0.18, len*(0.58+rng()*0.08), depth-1);
      if (depth >= 3 && rng() > 0.42) {
        branch(ex, ey, angle + (rng()-0.5)*0.25, len*(0.50+rng()*0.08), depth-1);
      }
    };

    // Main trunk
    branch(cx, bot, -Math.PI/2, H * 0.38, 5);

    // Thin stem at base
    ctx.beginPath(); ctx.moveTo(cx-lw*0.5, bot); ctx.lineTo(cx+lw*0.5, bot);
    ctx.lineTo(cx+lw*0.3, bot - H*0.08); ctx.lineTo(cx-lw*0.3, bot - H*0.08);
    ctx.fillStyle = `hsl(${hue},70%,35%)`; ctx.fill();
  }

  // ── Procedural bulb-cluster coral ───────────────────────────────────────
  private _drawBulbCluster(ctx: CanvasRenderingContext2D, W: number, H: number, seed: number): void {
    let s = seed | 1;
    const rng = () => { s ^= s<<13; s ^= s>>17; s ^= s<<5; return (s>>>0)/4294967296; };

    const hue  = 160 + rng() * 50;   // teal-cyan-blue range
    const cx   = W / 2;
    const bot  = H - 2;
    const count= 5 + Math.floor(rng() * 5);

    for (let i = 0; i < count; i++) {
      const tx      = cx + (rng()-0.5) * W * 0.72;
      const stalkH  = H * (0.38 + rng() * 0.48);
      const bulbR   = W * (0.06 + rng() * 0.07);
      const thick   = Math.max(1.5, W * 0.018);

      // Stalk — curves slightly
      const cp1x = tx + (rng()-0.5)*W*0.12;
      const cp1y = bot - stalkH * 0.55;

      ctx.beginPath();
      ctx.moveTo(tx, bot);
      ctx.quadraticCurveTo(cp1x, cp1y, tx + (rng()-0.5)*W*0.06, bot - stalkH);
      const grad = ctx.createLinearGradient(tx, bot, tx, bot-stalkH);
      grad.addColorStop(0, `hsl(${hue},70%,28%)`);
      grad.addColorStop(1, `hsl(${hue},82%,52%)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth   = thick;
      ctx.lineCap     = 'round';
      ctx.stroke();

      const tipX = tx + (rng()-0.5)*W*0.06;
      const tipY = bot - stalkH;

      // Bulb body
      const bgrad = ctx.createRadialGradient(
        tipX - bulbR*0.25, tipY - bulbR*0.25, bulbR*0.08,
        tipX, tipY, bulbR
      );
      bgrad.addColorStop(0,   `hsl(${hue},90%,78%)`);
      bgrad.addColorStop(0.5, `hsl(${hue},85%,55%)`);
      bgrad.addColorStop(1,   `hsl(${hue},75%,32%)`);
      ctx.beginPath(); ctx.arc(tipX, tipY, bulbR, 0, Math.PI*2);
      ctx.fillStyle = bgrad; ctx.fill();

      // Specular glint
      ctx.beginPath(); ctx.arc(tipX-bulbR*0.28, tipY-bulbR*0.28, bulbR*0.22, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
    }

    // Base shadow — planted in sand visually
    const bg = ctx.createRadialGradient(cx, bot, 0, cx, bot, W*0.42);
    bg.addColorStop(0,   `rgba(0,${Math.round(hue*0.5)},60,0.18)`);
    bg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.ellipse(cx, bot, W*0.42, 8, 0, 0, Math.PI*2);
    ctx.fillStyle = bg; ctx.fill();
  }

  // 🔴 FIX: Draw function now strictly requires sandBaseY to sync beautifully with the floor
  // sandBaseY defaults to gameHeight-80 so existing 2-arg calls in page.tsx still work
  draw(ctx: CanvasRenderingContext2D, nf: number, sandBaseY?: number): void {
    const sandY = sandBaseY ?? (this.gameHeight - 80);
    const time = Date.now() * 0.0008;
    // Rebuild sorted list only when items are added/removed
    if (this._sortDirty) {
      this._sorted   = this.items.slice().sort((a, b) => a.layer - b.layer);
      this._sortDirty = false;
    }

    for (const item of this._sorted) {
      if (item.kind === 'reef') this.drawReefGroup(ctx, item, time, nf, sandY);
      else this.drawSprite(ctx, item, time, nf, sandY);
    }
  }

  private drawReefGroup(ctx: CanvasRenderingContext2D, reef: ReefGroup, time: number, nf: number, sandY: number): void {
    const lp = LAYER_PROPS[reef.layer];
    ctx.save();
    ctx.globalAlpha = lp.opacityRange[0] + 0.5 * (lp.opacityRange[1] - lp.opacityRange[0]);

    for (const p of reef.pebbles) {
      this.drawPebble(ctx, p.x, sandY - p.yOffset, p.r, reef.layer, nf, p.rot);
    }
    for (const b of reef.boulders) {
      const by = sandY - b.yOffset;
      this.drawBoulder(ctx, b, by, reef.layer, nf);
      this.drawBaseBlend(ctx, b.x, sandY, b.rx * 1.5, nf);
    }

    ctx.restore();
    for (const c of reef.corals) this.drawSprite(ctx, c, time, nf, sandY);
  }

  private drawSprite(ctx: CanvasRenderingContext2D, sprite: CoralSprite, time: number, nf: number, sandY: number): void {
    if (!this.ready[sprite.asset]) return;
    
    const nfBkt  = Math.round(nf / 0.16) * 0.16;
    const imgSrc = this.getCachedImage(sprite, nfBkt);
    if (!imgSrc) return;
    const base = ASSET_SIZE[sprite.asset];
    const w = base.w * sprite.scale;
    const h = base.h * sprite.scale;
    const amp = ASSET_SWAY[sprite.asset];

    const sway = amp > 0
      ? Math.sin(time * 0.55 + sprite.swayOff) * amp
      + Math.sin(time * 1.42 + sprite.swayOff + 2.0) * amp * 0.36
      + Math.sin(time * 3.15 + sprite.swayOff + 4.5) * amp * 0.11
      : 0;

    let scaleY = 1;
    if (sprite.isFleshy) {
      scaleY = 1 + Math.sin(time * 2.5 + sprite.breathePhase) * 0.025; // 🔴 Smoother breathing
    }

    // Anchor EXACTLY on sand surface — bottom of image always touches sandY
    const currentY = sandY;

    // No save/restore — reset changed state manually (much cheaper)
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = sprite.opacity;

    // shadowBlur removed — glow is baked into offscreen canvas already
    // Base shadow: only foreground (layer 2) at night, all layers in day
    if (sprite.asset !== 'shell1' && (sprite.layer === 2 || nf < 0.4)) {
      const shadowW = w * (0.35 + sprite.layer * 0.08);
      this.drawBaseBlend(ctx, sprite.x, sandY + 4, shadowW, nf);
    }

    ctx.translate(sprite.x, currentY);
    ctx.transform(1, 0, sway, scaleY, 0, 0);
    const footShift = h * (ASSET_FOOT_PAD[sprite.asset] ?? 0);
    ctx.drawImage(imgSrc, -w / 2, -h + footShift, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = prevAlpha;
  }

  private drawBoulder(ctx: CanvasRenderingContext2D, b: Boulder, by: number, layer: DepthLayer, nf: number): void {
    const lp = LAYER_PROPS[layer];
    const tint = lp.blueTint;
    const nd = 1 - nf * 0.65;
    const r0 = Math.round(130 - tint * 40), g0 = Math.round(150 - tint * 20), b0 = Math.round(162 + tint * 30);
    const r1 = Math.round(55 - tint * 20), g1 = Math.round(78 - tint * 10), b1 = Math.round(88 + tint * 25);

    ctx.save();
    ctx.translate(b.x, by);
    ctx.rotate(b.rot);
    const grad = ctx.createRadialGradient(-b.rx * 0.3, -b.ry * 0.3, b.rx * 0.08, 0, 0, Math.max(b.rx, b.ry));
    grad.addColorStop(0, `rgb(${Math.round(r0*nd)},${Math.round(g0*nd)},${Math.round(b0*nd)})`);
    grad.addColorStop(1, `rgb(${Math.round(r1*nd)},${Math.round(g1*nd)},${Math.round(b1*nd)})`);
    ctx.beginPath(); ctx.ellipse(0, 0, b.rx, b.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad; ctx.fill();
    ctx.restore();
  }

  private drawPebble(ctx: CanvasRenderingContext2D, px: number, py: number, pr: number, layer: DepthLayer, nf: number, rot = 0): void {
    const nd = 1 - nf * 0.62;
    const h0 = Math.round((145 - LAYER_PROPS[layer].blueTint * 35) * nd);
    ctx.save();
    ctx.beginPath(); ctx.ellipse(px, py, pr, pr * 0.6, rot, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${h0},${h0+5},${h0+8})`; ctx.fill();
    ctx.restore();
  }

  // 🔴 FIX: Soft shadow under the base of everything so they look planted in the sand
  private drawBaseBlend(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, nf: number): void {
    const alpha = 0.5 - nf * 0.3;
    if (alpha <= 0) return;
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, width);
    g.addColorStop(0, `rgba(20,10,0,${alpha})`);
    g.addColorStop(1, 'rgba(20,10,0,0)');
    ctx.beginPath(); ctx.ellipse(x, y, width, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }
}