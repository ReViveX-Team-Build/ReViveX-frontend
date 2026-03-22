// util/game-core/SynapseFauna.ts
// ─────────────────────────────────────────────────────────────────────────────
//  AmbientFishSystem — zero-lag ambient wildlife for Synapse Racer
//
//  Architecture: ALL drawing primitives run ONCE in the constructor.
//  The draw() loop does ONLY ctx.drawImage() + ctx.transform().
//  No paths, fills, gradients, or arcs at runtime.
// ─────────────────────────────────────────────────────────────────────────────

type FishType   = 'dart' | 'sleek' | 'guppy' | 'giant';
type DepthLayer = 0 | 1 | 2;

// Dart colour variants — each school gets one
type DartColor  = 'cyan' | 'pink' | 'yellow' | 'lime';

const DART_COLORS: Record<DartColor, { body: string; fin: string; dark: string }> = {
  cyan:   { body: '#00EFEF', fin: 'rgba(0,200,200,0.70)',   dark: '#007A7A' },
  pink:   { body: '#FF40C0', fin: 'rgba(220,0,160,0.70)',   dark: '#880060' },
  yellow: { body: '#FFE020', fin: 'rgba(220,180,0,0.70)',   dark: '#887000' },
  lime:   { body: '#60FF40', fin: 'rgba(40,200,20,0.70)',   dark: '#208010' },
};

const LAYER_CFG: Record<DepthLayer, {
  scale:     number;
  speedMult: number;
  alpha:     number;
  blueTint:  boolean;
}> = {
  0: { scale: 0.22, speedMult: 0.28, alpha: 0.28, blueTint: true  },
  1: { scale: 0.55, speedMult: 0.62, alpha: 0.68, blueTint: false },
  2: { scale: 1.00, speedMult: 1.00, alpha: 1.00, blueTint: false },
};

const SPRITE_W: Record<FishType, number> = { dart: 28, sleek: 52, guppy: 40, giant: 180 };
const SPRITE_H: Record<FishType, number> = { dart: 14, sleek: 22, guppy: 24, giant:  60 };

// ── School ────────────────────────────────────────────────────────────────────
interface School {
  kind:      'school';
  color:     DartColor;
  x:         number;
  baseY:     number;
  phase:     number;
  speed:     number;
  direction: 1 | -1;
  layer:     DepthLayer;
  offsets:   { dx: number; dy: number; phase: number }[];
}

// ── Lone / Giant fish ─────────────────────────────────────────────────────────
interface LoneFish {
  kind:      'fish';
  type:      'sleek' | 'guppy' | 'giant';
  x:         number;
  baseY:     number;
  phase:     number;
  speed:     number;
  direction: 1 | -1;
  layer:     DepthLayer;
}

type FaunaEntity = School | LoneFish;

// ─────────────────────────────────────────────────────────────────────────────
export class AmbientFishSystem {
  private entities: FaunaEntity[] = [];
  // Key format: "dart_cyan_1" | "sleek_2" | "guppy_0" | "giant_1"
  private sprites: Map<string, HTMLCanvasElement> = new Map();

  private sandBaseY: number;

  constructor(
    private W: number,
    private H: number,
    private surfY: number = H * 0.38,
    sandBaseY?: number,
  ) {
    this.sandBaseY = sandBaseY ?? H - 80;
    this._bakeAll();
    this._populate();
  }

  // ─── Sprite baking ─────────────────────────────────────────────────────────
  private _bakeAll() {
    const layers: DepthLayer[] = [0, 1, 2];

    // Dart — 4 colours × 3 layers
    for (const col of Object.keys(DART_COLORS) as DartColor[]) {
      for (const l of layers) {
        this.sprites.set(`dart_${col}_${l}`, this._bake('dart', l, col));
      }
    }
    // Sleek, Guppy, Giant — 3 layers each
    for (const t of ['sleek', 'guppy', 'giant'] as FishType[]) {
      for (const l of layers) {
        this.sprites.set(`${t}_${l}`, this._bake(t, l));
      }
    }
  }

  private _bake(type: FishType, layer: DepthLayer, dartColor?: DartColor): HTMLCanvasElement {
    const sw  = SPRITE_W[type];
    const sh  = SPRITE_H[type];
    const pad = 4;
    const oc  = typeof document !== 'undefined'
      ? document.createElement('canvas')
      : { width: 0, height: 0, getContext: () => null } as unknown as HTMLCanvasElement;
    oc.width  = sw + pad * 2;
    oc.height = sh + pad * 2;
    const ctx = oc.getContext('2d');
    if (!ctx) return oc;

    ctx.save();
    ctx.translate(pad, pad);

    if (type === 'dart' && dartColor) {
      this._drawDart(ctx, sw, sh, dartColor);
    } else if (type === 'sleek') {
      this._drawSleek(ctx, sw, sh);
    } else if (type === 'guppy') {
      this._drawGuppy(ctx, sw, sh);
    } else if (type === 'giant') {
      this._drawGiant(ctx, sw, sh);
    }

    // Depth blue-tint for layer 0 — baked in, never applied at runtime
    if (LAYER_CFG[layer].blueTint) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.52;
      ctx.fillStyle   = 'rgba(15,50,130,1)';
      ctx.fillRect(-pad, -pad, sw + pad * 2, sh + pad * 2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    ctx.restore();
    return oc;
  }

  // ─── Sprite drawing routines ────────────────────────────────────────────────
  private _drawDart(ctx: CanvasRenderingContext2D, w: number, h: number, dc: DartColor) {
    const c  = DART_COLORS[dc];
    const my = h * 0.5;

    // Tail
    ctx.beginPath();
    ctx.moveTo(w * 0.82, my);
    ctx.lineTo(w, my - h * 0.42); ctx.lineTo(w, my + h * 0.42);
    ctx.closePath(); ctx.fillStyle = c.body; ctx.fill();

    // Body
    ctx.beginPath();
    ctx.ellipse(w * 0.42, my, w * 0.42, h * 0.36, 0, 0, Math.PI * 2);
    const bg = ctx.createLinearGradient(0, my - h * 0.36, 0, my + h * 0.36);
    bg.addColorStop(0, '#FFFFFF'); bg.addColorStop(0.3, c.body); bg.addColorStop(1, c.dark);
    ctx.fillStyle = bg; ctx.fill();

    // Dorsal fin
    ctx.beginPath();
    ctx.moveTo(w * 0.28, my - h * 0.34);
    ctx.lineTo(w * 0.18, my - h * 0.72); ctx.lineTo(w * 0.52, my - h * 0.34);
    ctx.fillStyle = c.fin; ctx.fill();

    // Eye
    ctx.beginPath(); ctx.arc(w * 0.14, my - h * 0.08, h * 0.19, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.15, my - h * 0.08, h * 0.11, 0, Math.PI * 2);
    ctx.fillStyle = '#001A1A'; ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.12, my - h * 0.13, h * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
  }

  private _drawSleek(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const my = h * 0.5;

    // Forked tail
    ctx.beginPath();
    ctx.moveTo(w * 0.80, my); ctx.lineTo(w, my - h * 0.46);
    ctx.lineTo(w * 0.88, my); ctx.lineTo(w, my + h * 0.46);
    ctx.closePath(); ctx.fillStyle = '#FF7A00'; ctx.fill();

    // Body
    ctx.beginPath(); ctx.ellipse(w * 0.42, my, w * 0.46, h * 0.38, 0, 0, Math.PI * 2);
    const bg = ctx.createLinearGradient(0, my - h * 0.38, 0, my + h * 0.38);
    bg.addColorStop(0, '#FFCC80'); bg.addColorStop(0.45, '#FF7A00'); bg.addColorStop(1, '#8B3A00');
    ctx.fillStyle = bg; ctx.fill();

    // Stripe
    ctx.beginPath(); ctx.ellipse(w * 0.40, my, w * 0.28, h * 0.10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,220,120,0.42)'; ctx.fill();

    // Dorsal fin
    ctx.beginPath();
    ctx.moveTo(w * 0.28, my - h * 0.36); ctx.lineTo(w * 0.22, my - h * 0.82);
    ctx.lineTo(w * 0.56, my - h * 0.36);
    ctx.fillStyle = 'rgba(255,120,0,0.72)'; ctx.fill();

    // Pectoral fin
    ctx.beginPath(); ctx.ellipse(w * 0.38, my + h * 0.26, w * 0.14, h * 0.18, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,140,40,0.65)'; ctx.fill();

    // Eye
    ctx.beginPath(); ctx.arc(w * 0.12, my - h * 0.10, h * 0.23, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.13, my - h * 0.10, h * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = '#1A0800'; ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.10, my - h * 0.15, h * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
  }

  private _drawGuppy(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const my = h * 0.5;

    // Fan tail
    ctx.beginPath();
    ctx.moveTo(w * 0.78, my - h * 0.08); ctx.lineTo(w, my - h * 0.52);
    ctx.lineTo(w * 0.90, my); ctx.lineTo(w, my + h * 0.52);
    ctx.lineTo(w * 0.78, my + h * 0.08);
    ctx.closePath(); ctx.fillStyle = 'rgba(160,190,210,0.80)'; ctx.fill();

    // Body
    ctx.beginPath(); ctx.ellipse(w * 0.40, my, w * 0.44, h * 0.44, 0, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(w * 0.28, my - h * 0.18, h * 0.06, w * 0.40, my, h * 0.44);
    bg.addColorStop(0, '#EEF4F8'); bg.addColorStop(0.5, '#C8D8E8'); bg.addColorStop(1, '#6888A0');
    ctx.fillStyle = bg; ctx.fill();

    // Belly highlight
    ctx.beginPath(); ctx.ellipse(w * 0.36, my + h * 0.14, w * 0.22, h * 0.16, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.30)'; ctx.fill();

    // Dorsal fin
    ctx.beginPath();
    ctx.moveTo(w * 0.28, my - h * 0.42); ctx.lineTo(w * 0.22, my - h * 0.90);
    ctx.lineTo(w * 0.54, my - h * 0.42);
    ctx.fillStyle = 'rgba(180,210,230,0.68)'; ctx.fill();

    // Pectoral fin
    ctx.beginPath(); ctx.ellipse(w * 0.34, my + h * 0.28, w * 0.13, h * 0.16, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180,210,230,0.60)'; ctx.fill();

    // Eye
    ctx.beginPath(); ctx.arc(w * 0.12, my - h * 0.12, h * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.13, my - h * 0.12, h * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = '#101820'; ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.11, my - h * 0.17, h * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
  }

  private _drawGiant(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const my = h * 0.5;

    // Manta ray / whale shark silhouette
    // Wing-like pectoral fins
    ctx.beginPath();
    ctx.moveTo(w * 0.28, my);
    ctx.bezierCurveTo(w * 0.18, my - h * 0.40, w * 0.05, my - h * 0.90, w * 0.00, my - h * 0.85);
    ctx.bezierCurveTo(w * 0.08, my - h * 0.50, w * 0.22, my - h * 0.18, w * 0.28, my);
    ctx.fillStyle = 'rgba(30,90,160,0.90)'; ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w * 0.28, my);
    ctx.bezierCurveTo(w * 0.18, my + h * 0.40, w * 0.05, my + h * 0.90, w * 0.00, my + h * 0.85);
    ctx.bezierCurveTo(w * 0.08, my + h * 0.50, w * 0.22, my + h * 0.18, w * 0.28, my);
    ctx.fillStyle = 'rgba(30,90,160,0.90)'; ctx.fill();

    // Body
    ctx.beginPath();
    ctx.ellipse(w * 0.46, my, w * 0.46, h * 0.28, 0, 0, Math.PI * 2);
    const bg = ctx.createLinearGradient(0, my - h * 0.28, 0, my + h * 0.28);
    bg.addColorStop(0,    '#3A8FD0');
    bg.addColorStop(0.35, '#1A60A8');
    bg.addColorStop(0.70, '#0E3E78');
    bg.addColorStop(1,    '#082848');
    ctx.fillStyle = bg; ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(w * 0.88, my);
    ctx.lineTo(w,        my - h * 0.38); ctx.lineTo(w * 0.94, my);
    ctx.lineTo(w,        my + h * 0.38);
    ctx.closePath(); ctx.fillStyle = '#1A60A8'; ctx.fill();

    // Dorsal fin
    ctx.beginPath();
    ctx.moveTo(w * 0.48, my - h * 0.28);
    ctx.lineTo(w * 0.44, my - h * 0.65); ctx.lineTo(w * 0.62, my - h * 0.28);
    ctx.fillStyle = '#1A60A8'; ctx.fill();

    // Spot pattern (whale shark style)
    ctx.fillStyle = 'rgba(180,220,255,0.18)';
    for (let i = 0; i < 8; i++) {
      const sx = w * (0.25 + (i % 4) * 0.16);
      const sy = my + (i < 4 ? -1 : 1) * h * 0.10;
      ctx.beginPath(); ctx.arc(sx, sy, h * 0.055, 0, Math.PI * 2); ctx.fill();
    }

    // Eye
    ctx.beginPath(); ctx.arc(w * 0.08, my - h * 0.08, h * 0.11, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,20,50,0.90)'; ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.075, my - h * 0.10, h * 0.04, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120,180,255,0.60)'; ctx.fill();
  }

  // ─── Population ─────────────────────────────────────────────────────────────
  private _populate() {
    const swimTop = this.surfY + 20;
    const swimH   = Math.max(40, this.sandBaseY - swimTop - 40);
    const rand    = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
    const dir     = (): 1 | -1 => (Math.random() > 0.5 ? 1 : -1);
    const ly      = () => swimTop + rand(0.05, 0.88) * swimH;

    const colors  = Object.keys(DART_COLORS) as DartColor[];

    // ── Schools — one colour each ──────────────────────────────────────────
    const schoolCfg: { layer: DepthLayer }[] = [
      {layer:0},{layer:0},
      {layer:1},{layer:1},{layer:1},
      {layer:2},{layer:2},
    ];
    schoolCfg.forEach((cfg, i) => {
      const spread  = cfg.layer === 2 ? 85 : cfg.layer === 1 ? 52 : 32;
      const count   = 10 + Math.floor(Math.random() * 16);
      const col     = colors[i % colors.length];
      this.entities.push({
        kind:      'school',
        color:     col,
        x:         rand(0, this.W),
        baseY:     ly(),
        phase:     Math.random() * Math.PI * 2,
        speed:     0.40 + Math.random() * 0.60,
        direction: dir(),
        layer:     cfg.layer,
        offsets:   Array.from({ length: count }, () => ({
          dx:    (Math.random() - 0.5) * spread * 2,
          dy:    (Math.random() - 0.5) * spread * 0.55,
          phase: Math.random() * Math.PI * 2,
        })),
      });
    });

    // ── Lone fish ─────────────────────────────────────────────────────────
    const loneCfg: { type: 'sleek' | 'guppy'; layer: DepthLayer }[] = [
      {type:'sleek',layer:2},{type:'guppy',layer:2},
      {type:'sleek',layer:1},{type:'guppy',layer:1},
      {type:'sleek',layer:2},{type:'guppy',layer:1},
      {type:'sleek',layer:1},{type:'guppy',layer:2},
    ];
    for (const cfg of loneCfg) {
      this.entities.push({
        kind: 'fish', type: cfg.type,
        x: rand(0, this.W), baseY: ly(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.32 + Math.random() * 0.52,
        direction: dir(), layer: cfg.layer,
      });
    }

    // ── Giants — slow, deep, majestic ─────────────────────────────────────
    for (let g = 0; g < 2; g++) {
      const layer: DepthLayer = g === 0 ? 0 : 1;
      this.entities.push({
        kind: 'fish', type: 'giant',
        x: rand(0, this.W), baseY: swimTop + swimH * (0.4 + g * 0.25),
        phase: Math.random() * Math.PI * 2,
        speed: 0.12 + Math.random() * 0.10,
        direction: dir(), layer,
      });
    }
  }

  // ─── Update ──────────────────────────────────────────────────────────────────
  update(scrollSpeed: number, surfY?: number, sandBaseY?: number) {
    if (surfY    !== undefined) this.surfY     = surfY;
    if (sandBaseY !== undefined) this.sandBaseY = sandBaseY;

    const swimTop  = this.surfY + 20;
    const swimFloor = this.sandBaseY - 40;
    const swimH     = Math.max(40, swimFloor - swimTop);

    for (const e of this.entities) {
      const lc  = LAYER_CFG[e.layer];
      const spd = e.speed * scrollSpeed * lc.speedMult;
      e.x += e.direction * spd;

      // Clamp baseY to sand
      e.baseY = Math.min(e.baseY, swimFloor);

      // Wrap off-screen
      const margin = e.kind === 'school' ? 130 : 70;
      if (e.direction === 1 && e.x > this.W + margin) {
        e.x     = -margin;
        e.baseY = swimTop + Math.random() * swimH;
      } else if (e.direction === -1 && e.x < -margin) {
        e.x     = this.W + margin;
        e.baseY = swimTop + Math.random() * swimH;
      }
    }
  }

  // ─── Draw ─────────────────────────────────────────────────────────────────
  draw(ctx: CanvasRenderingContext2D, nf: number, time: number) {
    const nightMode = nf > 0.40;

    for (const layer of [0, 1, 2] as DepthLayer[]) {
      const lc = LAYER_CFG[layer];

      for (const e of this.entities) {
        if (e.layer !== layer) continue;
        const alpha = lc.alpha * (nightMode ? Math.min(1, 0.55 + (nf - 0.40) * 1.5) : 1);

        if (e.kind === 'school') {
          this._drawSchool(ctx, e, lc.scale, alpha, time, nightMode);
        } else {
          this._drawLone(ctx, e, lc.scale, alpha, time, nightMode);
        }
      }
    }
  }

  private _drawSchool(
    ctx: CanvasRenderingContext2D, e: School,
    scale: number, alpha: number, time: number, night: boolean,
  ) {
    const sprite = this.sprites.get(`dart_${e.color}_${e.layer}`);
    if (!sprite) return;
    const sw = (sprite.width  - 8) * scale;
    const sh = (sprite.height - 8) * scale;

    if (night) ctx.globalCompositeOperation = 'screen';

    for (const off of e.offsets) {
      const ox   = e.x + off.dx;
      const oy   = e.baseY + off.dy + Math.sin(time * 0.00085 + off.phase) * 4 * scale;
      // Wiggle: horizontal stretch/compress simulates tail-kick — pure transform, zero redraw
      const wiggle = 1 + Math.sin(time * 0.0048 + e.phase + off.phase * 0.4) * 0.14;

      ctx.save();
      ctx.globalAlpha = alpha * (0.72 + Math.random() * 0.28);
      ctx.translate(ox, oy);
      ctx.scale(e.direction * wiggle, 1);
      ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
      ctx.restore();
    }

    if (night) ctx.globalCompositeOperation = 'source-over';
  }

  private _drawLone(
    ctx: CanvasRenderingContext2D, e: LoneFish,
    scale: number, alpha: number, time: number, night: boolean,
  ) {
    const key    = `${e.type}_${e.layer}`;
    const sprite = this.sprites.get(key);
    if (!sprite) return;

    const sw     = (sprite.width  - 8) * scale;
    const sh     = (sprite.height - 8) * scale;
    const bob    = Math.sin(time * 0.00088 + e.phase) * 5 * scale;
    // Giants wiggle more slowly and gently
    const wSpd   = e.type === 'giant' ? 0.0022 : 0.0042;
    const wAmp   = e.type === 'giant' ? 0.08   : 0.14;
    const wiggle = 1 + Math.sin(time * wSpd + e.phase) * wAmp;

    ctx.save();
    if (night) ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = alpha;
    ctx.translate(e.x, e.baseY + bob);
    ctx.scale(e.direction * wiggle, 1);
    ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  }
}