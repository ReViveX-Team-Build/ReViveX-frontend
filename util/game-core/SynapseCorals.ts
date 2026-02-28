

// ─── Asset types ─────────────────────────────────────────────────────────────

type CoralSVG = 'fan' | 'orange' | 'pipu' | 'purple' | 'pur1' | 'red' | 'tubes';
type StarfishSVG = 'starfish';
type AssetKey = CoralSVG | StarfishSVG;

// Depth layer 0=back, 1=mid, 2=front
type DepthLayer = 0 | 1 | 2;

// ─── Per-asset base sizes at scale=1 ─────────────────────────────────────────
const ASSET_SIZE: Record<AssetKey, { w: number; h: number }> = {
  fan:      { w: 200, h: 360 },
  orange:   { w: 310, h: 510 },
  pipu:     { w: 265, h: 300 },
  purple:   { w: 255, h: 315 },
  pur1:     { w: 250, h: 320 },
  red:      { w: 255, h: 295 },
  tubes:    { w: 200, h: 340 },
  starfish: { w:  200, h:  200 },
};

// Sway amplitude per asset
const ASSET_SWAY: Record<AssetKey, number> = {
  fan:      0.080,
  orange:   0.045,
  pipu:     0.055,
  purple:   0.048,
  pur1:     0.050,
  red:      0.042,
  tubes:    0.095,
  starfish: 0.000,
};

// Night glow colour per asset
const ASSET_GLOW: Record<AssetKey, string> = {
  fan:      'rgba(218,112,214,0.55)',
  orange:   'rgba(255,160,80,0.50)',
  pipu:     'rgba(255,100,180,0.55)',
  purple:   'rgba(200,100,255,0.55)',
  pur1:     'rgba(190,90,255,0.58)',
  red:      'rgba(255,80,80,0.52)',
  tubes:    'rgba(127,255,212,0.45)',
  starfish: 'rgba(255,180,60,0.40)',
};

const ASSET_SRC: Record<AssetKey, string> = {
  fan:      '/images/fan_coral.svg',
  orange:   '/images/coral_or.svg',
  pipu:     '/images/coral_pipu.svg',
  purple:   '/images/coral_pur.svg',
  pur1:     '/images/coral_pur1.svg',
  red:      '/images/coral_red.svg',
  tubes:    '/images/coral_tube.svg',
  starfish: '/images/starfish.svg',
};

// ─── Depth layer visual properties ───────────────────────────────────────────
const LAYER_PROPS: Record<DepthLayer, {
  scaleRange:   [number, number];
  opacityRange: [number, number];
  blueTint:     number;
  yOffset:      number;
}> = {
  //         scale range        opacity range     blueTint  yOffset
  0: { scaleRange: [0.10, 0.28], opacityRange: [0.25, 0.45], blueTint: 0.70, yOffset: 18 },
  1: { scaleRange: [0.25, 0.48], opacityRange: [0.60, 0.80], blueTint: 0.28, yOffset: 5  },
  2: { scaleRange: [0.40, 0.75], opacityRange: [0.90, 1.00], blueTint: 0.00, yOffset: 0  },
 
};

// ─── Internal scene element types ────────────────────────────────────────────

interface CoralSprite {
  kind:       'sprite';
  asset:      AssetKey;
  x:          number;
  y:          number; // bottom-anchor Y (sits on sand /rock top)
  scale:      number;
  layer:      DepthLayer;
  swayOff:    number;
  opacity:    number;
}

interface Boulder {
  x: number; y: number;
  rx: number; ry: number;  //ellipse radii
  rot: number;
}

interface ReefGroup {
  kind:     'reef';
  x:        number;        // centre
  y:        number;        // sand Y
  layer:    DepthLayer;
  boulders: Boulder[];
  corals:   CoralSprite[];
  pebbles:  { x: number; y: number; r: number }[];
}

type SceneItem = CoralSprite | ReefGroup;

//  Minimum spacing per depth lane ──────────────────────────────────────────
const LANE_MIN_DIST: Record<DepthLayer, number> = {
  0: 160,
  1: 240,
  2: 320,
};

// ─────────────────────────────────────────────────────────────────────────────
export class SynapseCorals {
  gameWidth:  number;
  gameHeight: number;

  private items: SceneItem[] = [];

  private imgs:  Record<AssetKey, HTMLImageElement>;
  private ready: Record<AssetKey, boolean>;

  // Per-lane x-tracking for min-dist enforcement
  private lanePositions: Record<DepthLayer, number[]> = { 0: [], 1: [], 2: [] };

  // Scroll tracking for repopulation
  private scrollX = 0;

  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth  = gameWidth;
    this.gameHeight = gameHeight;

    this.ready = {} as Record<AssetKey, boolean>;
    const load = (src: string, key: AssetKey): HTMLImageElement => {
      const img  = new Image();
      this.ready[key] = false;
      img.onload = () => { this.ready[key] = true; };
      img.src    = src;
      return img;
    };
    this.imgs = Object.fromEntries(
      (Object.keys(ASSET_SRC) as AssetKey[]).map(k => [k, load(ASSET_SRC[k], k)])
    ) as Record<AssetKey, HTMLImageElement>;

    this.init();
  }

  // ─── INIT ─────────────────────────────────────────────────
  private init(): void {
    // Seed the scene with a curated layout across the initial viewport.
    // using a segment-based approach: divide the 
    const W   = this.gameWidth;
    const seg = W / 6; // 6 zones across the screen

    // Zone 0: background silhouette cluster (layer 0, left side)
    this.addBackgroundCluster(seg * 0.4);
    this.addBackgroundCluster(seg * 1.8);
    this.addBackgroundCluster(seg * 3.5);
    this.addBackgroundCluster(seg * 5.2);

    // Zone 1: midground solo items
    this.addMidgroundSolo(seg * 0.9);
    this.addMidgroundSolo(seg * 2.6);
    this.addMidgroundSolo(seg * 4.4);

    // Zone 2: foreground hero reef groups
    this.addReefGroup(seg * 0.2, 2);
    this.addReefGroup(seg * 1.5, 2);
    this.addReefGroup(seg * 2.9, 2);
    this.addReefGroup(seg * 4.2, 2);
    this.addReefGroup(seg * 5.6, 2);

    // Zone 3: pebble patches scattered
    this.addPebblePatch(seg * 0.7, 2);
    this.addPebblePatch(seg * 2.2, 2);
    this.addPebblePatch(seg * 3.8, 2);
    this.addPebblePatch(seg * 5.1, 2);

    // Extra solo items for variety
    this.addSoloFeature(seg * 1.1, 2, 'tubes');
    this.addSoloFeature(seg * 3.3, 2, 'fan');
    this.addSoloFeature(seg * 5.8, 2, 'tubes');
  }

  // SCENE BUILDERS

  /** Dark, small, highup background coral silhouette */
  private addBackgroundCluster(cx: number): void {
    const sy   = this.sandY();
    const lp   = LAYER_PROPS[0];
    const types: CoralSVG[] = ['fan', 'tubes', 'orange', 'red'];
    const count = 1 + Math.floor(Math.random() * 3);

    for (let i = 0; i < count; i++) {
      const ox    = (i - count / 2) * (30 + Math.random() * 25);
      const scale = lp.scaleRange[0] + Math.random() * (lp.scaleRange[1] - lp.scaleRange[0]);
      const op    = lp.opacityRange[0] + Math.random() * (lp.opacityRange[1] - lp.opacityRange[0]);
      const type  = types[Math.floor(Math.random() * types.length)];
      if (!this.laneClear(0, cx + ox, LANE_MIN_DIST[0] * 0.5)) continue;
      this.pushLane(0, cx + ox);
      this.items.push({
        kind:    'sprite',
        asset:   type,
        x:       cx + ox,
        y:       sy - lp.yOffset,
        scale,
        layer:   0,
        swayOff: Math.random() * 100,
        opacity: op,
      });
    }
  }

  /** Mid-depth solo coral — medium size, slightly desaturated */
  private addMidgroundSolo(cx: number): void {
    const sy   = this.sandY();
    const lp   = LAYER_PROPS[1];
    const types: CoralSVG[] = ['orange','pipu','purple','pur1','red','fan'];
    const type  = types[Math.floor(Math.random() * types.length)];
    const scale = lp.scaleRange[0] + Math.random() * (lp.scaleRange[1] - lp.scaleRange[0]);
    const op    = lp.opacityRange[0] + Math.random() * (lp.opacityRange[1] - lp.opacityRange[0]);

    if (!this.laneClear(1, cx, LANE_MIN_DIST[1])) return;
    this.pushLane(1, cx);
    this.items.push({
      kind:    'sprite',
      asset:   type,
      x:       cx,
      y:       sy - lp.yOffset,
      scale,
      layer:   1,
      swayOff: Math.random() * 100,
      opacity: op,
    });
  }

  /** Hero reef cluster, boulders + multiple corals, front layer */
  private addReefGroup(cx: number, layer: DepthLayer): void {
    if (!this.laneClear(layer, cx, LANE_MIN_DIST[layer])) return;
    this.pushLane(layer, cx);

    const sy  = this.sandY();
    const lp  = LAYER_PROPS[layer];

    // ── Boulders ────────────────────────────────────────────────────
    const boulderCount = 2 + Math.floor(Math.random() * 3);
    const boulders: Boulder[] = [];
    for (let b = 0; b < boulderCount; b++) {
      const ox  = (b - boulderCount / 2) * (38 + Math.random() * 30) + (Math.random() - 0.5) * 20;
      const rx  = 28 + Math.random() * 32;
      const ry  = rx * (0.42 + Math.random() * 0.30); // flat oval
      boulders.push({ x: cx + ox, y: sy - ry * 0.5, rx, ry, rot: (Math.random() - 0.5) * 0.4 });
    }

    //  Pebbles scattered around boulders ───────────────────────────
    const pebbles: { x: number; y: number; r: number }[] = [];
    for (let p = 0; p < 6 + Math.floor(Math.random() * 5); p++) {
      pebbles.push({
        x: cx + (Math.random() - 0.5) * 130,
        y: sy - 1 - Math.random() * 4,
        r: 3 + Math.random() * 9,
      });
    }

    // ─Corals seated on/around boulders ────────────────────────────
    const coralTypes: CoralSVG[] = ['orange','pipu','purple','pur1','red','fan'];
    const coralCount = 2 + Math.floor(Math.random() * 3);
    const corals: CoralSprite[] = [];

    for (let i = 0; i < coralCount; i++) {
      // Seat each coral on a random boulder's top
      const host  = boulders[i % boulders.length];
      const ox    = (Math.random() - 0.5) * host.rx * 1.4;
      const scale = lp.scaleRange[0] + Math.random() * (lp.scaleRange[1] - lp.scaleRange[0]);
      const type  = coralTypes[Math.floor(Math.random() * coralTypes.length)];

      corals.push({
        kind:    'sprite',
        asset:   type,
        x:       host.x + ox,
        y:       host.y - host.ry + 4,   // sit on top of boulder
        scale,
        layer,
        swayOff: Math.random() * 100,
        opacity: lp.opacityRange[0] + Math.random() * (lp.opacityRange[1] - lp.opacityRange[0]),
      });
    }

    // Optionally add a starfish sitting on sand near the group
    if (Math.random() > 0.45) {
      const sfx = cx + (Math.random() - 0.5) * 100;
      corals.push({
        kind:    'sprite',
        asset:   'starfish',
        x:       sfx,
        y:       sy,
        scale:   0.18 + Math.random() * 0.22,
        layer,
        swayOff: 0,
        opacity: 0.90 + Math.random() * 0.10,
      });
    }

    this.items.push({ kind: 'reef', x: cx, y: sy, layer, boulders, corals, pebbles });
  }

  /** Scattered pebbles + tiny coral + occasional starfish */
  private addPebblePatch(cx: number, layer: DepthLayer): void {
    const sy  = this.sandY();
    const lp  = LAYER_PROPS[layer];

    const pebbles: { x: number; y: number; r: number }[] = [];
    for (let p = 0; p < 4 + Math.floor(Math.random() * 5); p++) {
      pebbles.push({
        x: cx + (Math.random() - 0.5) * 90,
        y: sy - 1 - Math.random() * 3,
        r: 3 + Math.random() * 8,
      });
    }

    const corals: CoralSprite[] = [];
    // Very small coral (or starfish) in the patch
    const pick = Math.random();
    if (pick > 0.50) {
      const types: CoralSVG[] = ['orange','red','pipu','pur1'];
      corals.push({
        kind:    'sprite',
        asset:   types[Math.floor(Math.random() * types.length)],
        x:       cx + (Math.random() - 0.5) * 40,
        y:       sy,
        scale:   0.22 + Math.random() * 0.28, // TINY
        layer,
        swayOff: Math.random() * 100,
        opacity: 0.88,
      });
    }
    if (Math.random() > 0.40) {
      corals.push({
        kind:    'sprite',
        asset:   'starfish',
        x:       cx + (Math.random() - 0.5) * 70,
        y:       sy,
        scale:   0.15 + Math.random() * 0.18,
        layer,
        swayOff: 0,
        opacity: 0.92,
      });
    }

    this.items.push({ kind: 'reef', x: cx, y: sy, layer, boulders: [], corals, pebbles });
  }

  /** Single notable coral, large or very small accent */
  private addSoloFeature(cx: number, layer: DepthLayer, forceType?: CoralSVG): void {
    if (!this.laneClear(layer, cx, LANE_MIN_DIST[layer] * 0.8)) return;
    this.pushLane(layer, cx);

    const sy   = this.sandY();
    const lp   = LAYER_PROPS[layer];
    const type: CoralSVG = forceType ?? (['fan','tubes','orange','pipu'] as CoralSVG[])[Math.floor(Math.random() * 4)];

    // Scale stays within the layer's defined range,no overshooting
    const scale = lp.scaleRange[0] + Math.random() * (lp.scaleRange[1] - lp.scaleRange[0]);
    // "Big" solo just picks from the upper half of the range
    const finalScale = Math.random() > 0.45
      ? lp.scaleRange[0] * 0.5 + lp.scaleRange[1] * 0.5 + Math.random() * (lp.scaleRange[1] - lp.scaleRange[0]) * 0.25
      : lp.scaleRange[0] + Math.random() * (lp.scaleRange[1] - lp.scaleRange[0]) * 0.45;

    this.items.push({
      kind:    'sprite',
      asset:   type,
      x:       cx,
      y:       sy,
      scale:   finalScale,
      layer,
      swayOff: Math.random() * 100,
      opacity: lp.opacityRange[0] + Math.random() * (lp.opacityRange[1] - lp.opacityRange[0]),
    });
  }

  // ─── LANE HELPERS ─────────────────────────────────────────────────────────
  private laneClear(lane: DepthLayer, x: number, minDist: number): boolean {
    return !this.lanePositions[lane].some(px => Math.abs(px - x) < minDist);
  }
  private pushLane(lane: DepthLayer, x: number) {
    this.lanePositions[lane].push(x);
  }

  // UPDATE ───────────────────────────────────────────────────────────────
  update(): void {
    const time = Date.now() * 0.001;
    const scroll = 2;
    this.scrollX += scroll;

    // Move all items left
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.x -= scroll;

      // Despawn far-left items and clean lane trackers
      if (item.x < -500) {
        const lane = item.layer as DepthLayer;
        const idx  = this.lanePositions[lane].findIndex(px => Math.abs(px - (item.x + 500)) < 20);
        if (idx !== -1) this.lanePositions[lane].splice(idx, 1);
        this.items.splice(i, 1);
      } else if (item.kind === 'reef') {
        // Move reef sub-items
        item.boulders.forEach(b => { b.x -= scroll; });
        item.pebbles.forEach(p  => { p.x -= scroll; });
        item.corals.forEach(c   => { c.x -= scroll; });
      }
    }

    // Repopulate from the right
    const rightmost = this.items.reduce((m, it) => Math.max(m, it.x), 0);
    const spawnEdge = this.gameWidth + 300;

    if (rightmost < spawnEdge - 200) {
      const nx = rightmost + 280 + Math.random() * 160;
      const roll = Math.random();
      if      (roll < 0.28) this.addReefGroup(nx, 2);
      else if (roll < 0.48) this.addSoloFeature(nx, 2);
      else if (roll < 0.62) this.addPebblePatch(nx, 2);
      else if (roll < 0.78) this.addMidgroundSolo(nx);
      else                  this.addBackgroundCluster(nx);
    }
  }

  // ─── DRAW ─────────────────────────────────────────────────────────────────
  draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
    const time = Date.now() * 0.0008;

    // Sort all items by layer (0 first = drawn behind)
    const sorted = [...this.items].sort((a, b) => a.layer - b.layer);

    for (const item of sorted) {
      if (item.kind === 'reef') {
        this.drawReefGroup(ctx, item, time, nightFactor);
      } else {
        this.drawSprite(ctx, item, time, nightFactor);
      }
    }
  }

  // ─── DRAW:REEF GROUP ─────────────────────────────────────────────────────
  private drawReefGroup(
    ctx:  CanvasRenderingContext2D,
    reef: ReefGroup,
    time: number,
    nf:   number
  ): void {
    const lp = LAYER_PROPS[reef.layer];
    ctx.save();
    ctx.globalAlpha = lp.opacityRange[0] + 0.5 * (lp.opacityRange[1] - lp.opacityRange[0]);

    // ── Pebbles ────────────────────────────────────────────────────
    for (const p of reef.pebbles) {
      this.drawPebble(ctx, p.x, p.y, p.r, reef.layer, nf);
    }

    // ── Boulders ───────────────────────────────────────────────────
    for (const b of reef.boulders) {
      this.drawBoulder(ctx, b, reef.layer, nf);
    }

    // ── Shadow ellipses on sand for each boulder ───────────────────
    for (const b of reef.boulders) {
      this.drawSandShadow(ctx, b.x, reef.y, b.rx * 1.6, 7, nf);
    }

    ctx.restore();

    //  Corals (draw at full opacity, handled per-sprite)
    for (const c of reef.corals) {
      this.drawSprite(ctx, c, time, nf);
    }
  }

  //  DRAW: SINGLE SPRITE ──────────────────────────────────────────────────
  private drawSprite(
    ctx:    CanvasRenderingContext2D,
    sprite: CoralSprite,
    time:   number,
    nf:     number
  ): void {
    if (!this.ready[sprite.asset]) return;
    const img  = this.imgs[sprite.asset];
    const base = ASSET_SIZE[sprite.asset];
    const w    = base.w * sprite.scale;
    const h    = base.h * sprite.scale;
    const amp  = ASSET_SWAY[sprite.asset];
    const lp   = LAYER_PROPS[sprite.layer];

    // Multi-frequency sway (zero for starfish)
    const sway = amp > 0
      ? Math.sin(time * 0.55 + sprite.swayOff)        * amp
      + Math.sin(time * 1.42 + sprite.swayOff + 2.0)  * amp * 0.36
      + Math.sin(time * 3.15 + sprite.swayOff + 4.5)  * amp * 0.11
      : 0;

    ctx.save();

    // Depth blue-tint: background items fade toward water colour
    if (lp.blueTint > 0) {
      ctx.filter = `saturate(${Math.round((1 - lp.blueTint * 0.60) * 100)}%) brightness(${Math.round((1 - lp.blueTint * 0.28) * 100)}%)`;
    }

    ctx.globalAlpha = sprite.opacity;

    // Night glow
    if (nf > 0.08 && sprite.asset !== 'starfish') {
      ctx.shadowBlur  = 14 * nf;
      ctx.shadowColor = ASSET_GLOW[sprite.asset];
    }

    // Shadow on sand (front layer only.. back layers don't cast visible shadows)
    if (sprite.layer === 2 && sprite.asset !== 'starfish') {
      this.drawSandShadow(ctx, sprite.x, this.sandY(), w * 0.55, 10, nf);
    }

    // Translate to bottom anchor, apply shear sway
    ctx.translate(sprite.x, sprite.y);
    ctx.transform(1, 0, sway, 1, 0, 0);
    ctx.drawImage(img, -w / 2, -h, w, h);

    ctx.shadowBlur = 0;
    ctx.filter     = 'none';
    ctx.restore();
  }

  // DRAW: BOULDER ─────────────────────────────────────────────────
  private drawBoulder(
    ctx:    CanvasRenderingContext2D,
    b:      Boulder,
    layer:  DepthLayer,
    nf:     number
  ): void {
    const lp    = LAYER_PROPS[layer];
    const tint  = lp.blueTint;

    // Rock colour — light grey-blue in day, darker at night
    // Background rocks are more blue-tinted (distance)
    const r0 = Math.round(130 - tint * 40);
    const g0 = Math.round(150 - tint * 20);
    const b0 = Math.round(162 + tint * 30);
    const r1 = Math.round(55  - tint * 20);
    const g1 = Math.round(78  - tint * 10);
    const b1 = Math.round(88  + tint * 25);

    // Night darkening
    const nd  = 1 - nf * 0.65;
    const col0 = `rgb(${Math.round(r0*nd)},${Math.round(g0*nd)},${Math.round(b0*nd)})`;
    const col1 = `rgb(${Math.round(r1*nd)},${Math.round(g1*nd)},${Math.round(b1*nd)})`;

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);

    const grad = ctx.createRadialGradient(-b.rx * 0.3, -b.ry * 0.3, b.rx * 0.08, 0, 0, Math.max(b.rx, b.ry));
    grad.addColorStop(0,    col0);
    grad.addColorStop(0.55, `rgb(${Math.round((r0+r1)/2*nd)},${Math.round((g0+g1)/2*nd)},${Math.round((b0+b1)/2*nd)})`);
    grad.addColorStop(1,    col1);

    ctx.beginPath();
    ctx.ellipse(0, 0, b.rx, b.ry, 0, 0, Math.PI * 2);
    ctx.fillStyle   = grad;
    ctx.fill();
    ctx.strokeStyle = `rgba(0,0,0,${0.18 + nf * 0.10})`;
    ctx.lineWidth   = 1.2;
    ctx.stroke();

    // Specular highlight (top-left)
    ctx.beginPath();
    ctx.ellipse(-b.rx * 0.28, -b.ry * 0.28, b.rx * 0.30, b.ry * 0.22, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.10 - nf * 0.06})`;
    ctx.fill();

    ctx.restore();
  }

  //  DRAW: PEBBLE ─────────────────────────────────────────────────────────
  private drawPebble(
    ctx:   CanvasRenderingContext2D,
    px:    number, py: number, pr: number,
    layer: DepthLayer,
    nf:    number
  ): void {
    const tint = LAYER_PROPS[layer].blueTint;
    const nd   = 1 - nf * 0.62;
    const h0   = Math.round((145 - tint * 35) * nd);
    const h1   = Math.round((95  - tint * 25) * nd);

    ctx.save();
    const g = ctx.createRadialGradient(px - pr * 0.3, py - pr * 0.3, 0, px, py, pr);
    g.addColorStop(0,   `rgb(${h0},${h0+5},${h0+8})`);
    g.addColorStop(1,   `rgb(${h1},${h1+3},${h1+6})`);
    ctx.beginPath();
    ctx.ellipse(px, py, pr * (1.0 + Math.random() * 0.4), pr * (0.55 + Math.random() * 0.3), Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fillStyle   = g;
    ctx.fill();
    ctx.strokeStyle = `rgba(0,0,0,${0.12 + nf * 0.08})`;
    ctx.lineWidth   = 0.7;
    ctx.stroke();
    ctx.restore();
  }

  //  DRAW: SAND SHADOW ────────────────────────────────────────────────────
  // Soft horizontal shadow cast by an object onto the sand
  private drawSandShadow(
    ctx:   CanvasRenderingContext2D,
    x:     number, sandY: number,
    halfW: number, halfH: number,
    nf:    number
  ): void {
    const alpha = (0.22 - nf * 0.14);
    if (alpha <= 0) return;
    ctx.save();
    const g = ctx.createRadialGradient(x, sandY, 0, x, sandY, halfW);
    g.addColorStop(0,   `rgba(60,30,4,${alpha})`);
    g.addColorStop(0.5, `rgba(50,24,2,${alpha * 0.45})`);
    g.addColorStop(1,   'rgba(40,18,1,0)');
    ctx.beginPath();
    ctx.ellipse(x, sandY, halfW, halfH, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }

  // ─── UTILITY ──────────────────────────────────────────────────────────────
  private sandY(): number {
    return this.gameHeight - 5;
  }
}