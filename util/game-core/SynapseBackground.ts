// util/game-core/SynapseBackground.ts
import { AmbientFishSystem } from './SynapseFauna';

// ─────────────────────────────────────────────────────────────────────────────
//  SynapseBackground  v4  — Bright cartoon underwater scene
//
//  Visual target: bright daytime reef — warm golden sand, clear cyan-blue
//  water, wide white god-ray fans from the surface, dark silhouette plants
//  in the background, everything blending into a cohesive illustrated picture.
//
//  Day/night cycle preserved — day is the primary visual state matching
//  the reference. Night smoothly transitions to deep-blue but sand stays
//  warm (just dimmer). Colors all lerp so there are no hard seams.
// ─────────────────────────────────────────────────────────────────────────────

// ─── helpers ─────────────────────────────────────────────────────────────────
function lerpColor(a: string, b: string, t: number): string {
  t = Math.max(0, Math.min(1, t));
  const ah = parseInt(a.replace('#', ''), 16);
  const bh = parseInt(b.replace('#', ''), 16);
  const ar = (ah >> 16) & 255, ag = (ah >> 8) & 255, ab = ah & 255;
  const br = (bh >> 16) & 255, bg = (bh >> 8) & 255, bb = bh & 255;
  return '#' + [
    Math.round(ar + t * (br - ar)),
    Math.round(ag + t * (bg - ag)),
    Math.round(ab + t * (bb - ab)),
  ].map(v => v.toString(16).padStart(2, '0')).join('');
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function smoothstep(lo: number, hi: number, x: number) {
  const t = clamp((x - lo) / (hi - lo), 0, 1);
  return t * t * (3 - 2 * t);
}

// Cheap 1-D value noise
const _perm = (() => {
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  return [...p, ...p];
})();

function vnoise(x: number): number {
  const i = Math.floor(x) & 255, f = x - Math.floor(x);
  const u = f * f * (3 - 2 * f);
  const a = (_perm[i] / 255) * 2 - 1;
  const b = (_perm[i + 1] / 255) * 2 - 1;
  return a + u * (b - a);
}

// ═══════════════════════════════════════════════════════════════════════════
//  WAVE ENGINE
// ═══════════════════════════════════════════════════════════════════════════
class WaveEngine {
  private sx = [0, 0, 0];
  private readonly LAYER = [
    { yFrac: 0.400, ampF: 1.00, speedF: 1.00, scrollF: 1.00 },
    { yFrac: 0.418, ampF: 0.58, speedF: 0.68, scrollF: 0.60 },
    { yFrac: 0.434, ampF: 0.34, speedF: 0.45, scrollF: 0.36 },
  ];

  constructor(private W: number, private H: number) {}

  scroll(speed: number) {
    for (let i = 0; i < 3; i++) {
      this.sx[i] -= speed * this.LAYER[i].scrollF;
      if (this.sx[i] < -this.W) this.sx[i] += this.W;
    }
  }

  layerY(layer: number, cx: number, t: number, amp: number): number {
    const L  = this.LAYER[layer];
    const rx = cx + this.sx[layer];
    const sf = L.speedF, af = L.ampF;
    return this.H * L.yFrac
      + Math.sin(rx * 0.00400 + t * 0.000750 * sf) * amp * af * 0.88
      + Math.sin(rx * 0.00820 + t * 0.001300 * sf) * amp * af * 0.42
      + Math.sin(rx * 0.01680 + t * 0.002000 * sf) * amp * af * 0.18
      + Math.cos(rx * 0.02900 + t * 0.001600 * sf) * amp * af * 0.09
      + vnoise(rx * 0.004    + t * 0.00018  * sf)  * amp * af * 0.09;
  }

  surfaceY(cx: number, t: number, amp: number): number {
    return this.layerY(0, cx, t, amp);
  }

  buildPts(layer: number, t: number, amp: number, step = 10): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    for (let x = 0; x <= this.W + step; x += step)
      pts.push({ x, y: this.layerY(layer, x, t, amp) });
    return pts;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  GOD RAYS  — wide white fan beams from the surface
//  Matches reference: 5–6 broad overlapping shafts, very bright near top,
//  fade to nothing well before sand. Gentle lateral shimmer.
// ═══════════════════════════════════════════════════════════════════════════
class GodRays {
  // Anchors spread across width so beams fan from surface down
  private readonly anchors = [0.06, 0.18, 0.32, 0.48, 0.62, 0.76, 0.90];
  private phase: number[];
  private widths: number[];

  constructor(private W: number, private H: number) {
    this.phase  = this.anchors.map(() => Math.random() * Math.PI * 2);
    this.widths = this.anchors.map(() => 48 + Math.random() * 72); // wide beams
  }

  draw(
    ctx:           CanvasRenderingContext2D,
    nf:            number,
    wave:          WaveEngine,
    amp:           number,
    t:             number,
    pressureRatio: number = 0,
    relaxTimer:    number = 0,
  ) {
    if (nf >= 0.82) return; // no god rays at night
    // Bright in day (nf≈0), fades at dusk
    const dayFactor  = 1 - nf / 0.82;
    // Pressure boost: full squeeze makes rays up to 3.2× brighter
    const pBoost     = 1 + pressureRatio * 2.2;
    const baseAlpha  = dayFactor * 0.13 * pBoost;
    if (baseAlpha < 0.003) return;

    ctx.save();

    // Clip strictly to underwater volume
    ctx.beginPath();
    for (let x = 0; x <= this.W; x += 16) {
      const sy = wave.surfaceY(x, t, amp);
      x === 0 ? ctx.moveTo(0, sy) : ctx.lineTo(x, sy);
    }
    ctx.lineTo(this.W, this.H);
    ctx.lineTo(0, this.H);
    ctx.closePath();
    ctx.clip();

    ctx.globalCompositeOperation = 'screen';

    for (let ri = 0; ri < this.anchors.length; ri++) {
      const xTop  = this.W * this.anchors[ri];
      const yTop  = wave.surfaceY(xTop, t, amp);

      // ── Caustic light bending: drift frequency scales with pressure ────────
      // At rest: gentle slow sweep. Squeezing → 5× faster lateral jitter.
      const causticFreq = 0.00028 + pressureRatio * 0.00140;   // jitter multiplier
      const jitterAmp   = 60 + pressureRatio * 35;             // wider swings under load
      const drift = Math.sin(t * causticFreq + this.phase[ri]) * jitterAmp
                  + Math.cos(t * (causticFreq * 1.5) + this.phase[ri] * 1.3) * (30 + pressureRatio * 18);

      // Ray reaches about 80% down the water column
      const rayLen = (this.H - yTop) * 0.82;
      const xBot   = xTop + drift;

      // Pressure widens beams. Relaxation ripple adds an extra pulse of width.
      const relaxFrac  = clamp(relaxTimer / 1200, 0, 1);
      const relaxRipple= relaxFrac * relaxFrac * 0.55;  // smooth expanding bloom
      const halfW      = this.widths[ri] * (1 + pressureRatio * 1.6 + relaxRipple);

      // Pulse brightness slightly
      const pulse = 0.85 + Math.sin(t * 0.00055 + this.phase[ri] * 2.1) * 0.15;
      const alpha = baseAlpha * pulse;

      // Wide gradient: bright white at top, soft teal at bottom, transparent
      const grad = ctx.createLinearGradient(xTop, yTop, xBot, yTop + rayLen);
      grad.addColorStop(0,    `rgba(255,255,255,${alpha * 1.8})`);
      grad.addColorStop(0.12, `rgba(220,248,255,${alpha * 1.2})`);
      grad.addColorStop(0.40, `rgba(160,228,248,${alpha * 0.55})`);
      grad.addColorStop(0.70, `rgba(100,195,235,${alpha * 0.18})`);
      grad.addColorStop(1,    'rgba(60,170,215,0)');

      // Trapezoid beam: narrow at top surface, wide at bottom
      const topW  = halfW * 0.25;
      const botW  = halfW;
      const cpx   = xBot;
      const cpy   = yTop + rayLen * 0.48;

      ctx.beginPath();
      ctx.moveTo(xTop - topW, yTop);
      ctx.quadraticCurveTo(cpx - botW * 0.5, cpy, xBot - botW, yTop + rayLen);
      ctx.lineTo(xBot + botW, yTop + rayLen);
      ctx.quadraticCurveTo(cpx + botW * 0.5, cpy, xTop + topW, yTop);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  BACKGROUND SILHOUETTES
//  Dark blue-teal coral/seaweed shapes visible in distance behind everything.
//  Match the reference: they sit just above the sand, semi-transparent,
//  softly blended into the water so they feel like depth not clutter.
// ═══════════════════════════════════════════════════════════════════════════
class BackgroundSilhouettes {
  private shapes:  SilShape[] = [];
  private scrollX  = 0;
  // Pre-rendered small canvas per shape — baked once, never redrawn
  private _shapeCache: Map<string, HTMLCanvasElement> = new Map();

  constructor(private W: number, private H: number) {
    this.generate();
  }

  private generate() {
    for (let i = 0; i < 18; i++) {
      const x    = (i / 18) * this.W * 2.2 + Math.random() * 80;
      const type = ['fan','branch','bulb','reed'][Math.floor(Math.random() * 4)] as SilType;
      this.shapes.push({
        x, type,
        scale:  0.70 + Math.random() * 0.85,
        phase:  Math.random() * Math.PI * 2,
        speed:  0.0008 + Math.random() * 0.0005,
        alpha:  0.28 + Math.random() * 0.32,
      });
    }
  }

  update(scrollSpeed: number) {
    this.scrollX += scrollSpeed * 0.35;
  }

  // Bake one shape to a small canvas — called once per unique type+scale bucket
  private _bake(type: SilType, scale: number, color: string): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    const sBkt = Math.round(scale / 0.15) * 0.15;
    const key  = `${type}_${sBkt}_${color}`;
    if (this._shapeCache.has(key)) return this._shapeCache.get(key)!;

    // Canvas large enough for the shape at sway=0 (sway added via ctx.transform at draw time)
    const maxH = Math.ceil(130 * scale);
    const maxW = Math.ceil(130 * scale);
    const oc   = document.createElement('canvas');
    oc.width   = maxW + 8; oc.height = maxH + 8;
    const ctx  = oc.getContext('2d')!;
    ctx.translate(maxW / 2 + 4, maxH + 4);  // anchor at bottom-centre
    ctx.fillStyle   = color;
    ctx.strokeStyle = color;

    switch (type) {
      case 'fan': {
        const h = 90 * scale, w = 60 * scale;
        for (let i = 0; i <= 8; i++) {
          const ang = -Math.PI * 0.85 + (i / 8) * Math.PI * 0.85;
          const rx  = Math.cos(ang) * w;
          const ry  = -h * 0.45 + Math.sin(ang) * h * 0.55;
          const t0x = rx * 0.35, t0y = -h * 0.45 + (ry + h * 0.45) * 0.35;
          ctx.beginPath(); ctx.moveTo(0, -h * 0.45);
          ctx.quadraticCurveTo(t0x, t0y, rx, ry);
          ctx.lineWidth = Math.max(1.5, (4 - i * 0.3) * scale);
          ctx.lineCap = 'round'; ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h * 0.45);
        ctx.lineWidth = 4 * scale; ctx.lineCap = 'round'; ctx.stroke();
        break;
      }
      case 'branch': {
        ctx.lineWidth = 3.5 * scale; ctx.lineCap = 'round';
        this._branch(ctx, 0, 0, -Math.PI / 2, 110 * scale * 0.40, 4);
        break;
      }
      case 'bulb': {
        const r = 22 * scale;
        ctx.beginPath(); ctx.arc(0, -r, r, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 5; i++) {
          const ang = -Math.PI * 0.9 + (i / 4) * Math.PI * 0.9;
          const ex  = Math.cos(ang) * r * 1.8, ey = -r + Math.sin(ang) * r * 1.8;
          ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(ex, ey);
          ctx.lineWidth = 2 * scale; ctx.stroke();
          ctx.beginPath(); ctx.arc(ex, ey, 4 * scale, 0, Math.PI * 2); ctx.fill();
        }
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r);
        ctx.lineWidth = 3.5 * scale; ctx.stroke();
        break;
      }
      case 'reed': {
        const h = 100 * scale;
        for (let i = 0; i < 3; i++) {
          const ox = (i - 1) * 12 * scale;
          ctx.beginPath(); ctx.moveTo(ox, 0);
          ctx.quadraticCurveTo(ox, -h * 0.55, ox, -h * (0.75 + i * 0.08));
          ctx.lineWidth = (3 - i * 0.5) * scale; ctx.lineCap = 'round'; ctx.stroke();
        }
        break;
      }
    }
    this._shapeCache.set(key, oc);
    return oc;
  }

  private _branch(ctx: CanvasRenderingContext2D, x: number, y: number,
    angle: number, len: number, depth: number) {
    if (depth <= 0 || len < 5) return;
    const ex = x + Math.cos(angle) * len, ey = y + Math.sin(angle) * len;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey);
    ctx.lineWidth = Math.max(0.8, depth * 1.6); ctx.stroke();
    const spread = 0.42 + depth * 0.04, next = len * 0.60;
    this._branch(ctx, ex, ey, angle - spread, next, depth - 1);
    this._branch(ctx, ex, ey, angle + spread, next, depth - 1);
    if (depth >= 3) this._branch(ctx, ex, ey, angle, next * 0.72, depth - 1);
  }

  draw(ctx: CanvasRenderingContext2D, sandY: number, nf: number, t: number) {
    const wrap = this.W * 2.2;
    const col  = lerpColor('#1C4476', '#08142D', nf * 0.7);
    // Coarse nf bucket for cache key (only 6 colour variants)
    const nBkt = Math.round(nf / 0.18) * 0.18;
    const colBkt = lerpColor('#1C4476', '#08142D', nBkt * 0.7);

    for (const s of this.shapes) {
      const sx = ((s.x - this.scrollX) % wrap + wrap) % wrap - 80;
      if (sx < -200 || sx > this.W + 200) continue;

      const canvas = this._bake(s.type, s.scale, colBkt);
      if (!canvas) continue;

      // Sway via ctx.transform skewX — no redraw needed, just changes transform
      const sway = Math.sin(t * s.speed + s.phase) * 0.06 * s.scale;
      const hw   = canvas.width / 2;

      ctx.save();
      ctx.globalAlpha = s.alpha * (1 - nf * 0.55);
      ctx.translate(sx, sandY);
      ctx.transform(1, 0, sway, 1, 0, 0);  // skewX for wind sway
      ctx.drawImage(canvas, -hw, -canvas.height);
      ctx.restore();
    }
  }

  // Legacy drawShape kept for compatibility (no longer called in draw loop)
  private drawShape(ctx: CanvasRenderingContext2D, type: SilType,
    scale: number, sway: number, color: string) {}
  private drawSilBranch(ctx: CanvasRenderingContext2D, x: number, y: number,
    angle: number, len: number, depth: number, sw: number) {}
}

type SilType = 'fan' | 'branch' | 'bulb' | 'reed';
interface SilShape {
  x:     number;
  type:  SilType;
  scale: number;
  phase: number;
  speed: number;
  alpha: number;
}

// ═══════════════════════════════════════════════════════════════════════════
//  CELESTIAL BODIES
// ═══════════════════════════════════════════════════════════════════════════
class CelestialBodies {
  private _sunCanvas:  HTMLCanvasElement | null = null;
  private _moonCanvas: HTMLCanvasElement | null = null;
  private _builtR      = -1;

  constructor(private W: number, private H: number) {}

  private _bodyXY(phase: number, surfY: number, isMoon = false): { x: number; y: number } {
    const angle = phase * Math.PI;
    const cx    = this.W * 0.50;
    const arcW  = this.W * 0.80;
    const arcH  = Math.max(surfY * 0.78, 60);
    // Sun: east→west (left→right). Moon: west→east (right→left, opposite direction).
    const xSign = isMoon ? 1 : -1;
    return {
      x: cx + xSign * Math.cos(angle) * (arcW / 2),
      y: surfY - Math.sin(angle) * arcH,
    };
  }

  private _buildBodies(R: number) {
    if (typeof document === 'undefined') return;
    const pad = Math.ceil(R * 5.5);
    const sz  = pad * 2;

    const sc   = document.createElement('canvas');
    sc.width   = sz; sc.height = sz;
    const sCtx = sc.getContext('2d')!;
    const scx  = pad, scy = pad;
    for (let i = 0; i < 3; i++) {
      const br = R * (2.8 + i * 0.9);
      const bg = sCtx.createRadialGradient(scx, scy, R*0.4, scx, scy, br);
      bg.addColorStop(0, `rgba(255,240,100,0.18)`);
      bg.addColorStop(0.35, `rgba(255,210,50,0.12)`);
      bg.addColorStop(1, `rgba(255,130,0,0)`);
      sCtx.beginPath(); sCtx.arc(scx, scy, br, 0, Math.PI*2);
      sCtx.fillStyle = bg; sCtx.fill();
    }
    const cg = sCtx.createRadialGradient(scx, scy, R*0.85, scx, scy, R*1.6);
    cg.addColorStop(0, 'rgba(255,240,120,0.55)');
    cg.addColorStop(0.5, 'rgba(255,210,60,0.20)');
    cg.addColorStop(1, 'rgba(255,160,0,0)');
    sCtx.beginPath(); sCtx.arc(scx, scy, R*1.6, 0, Math.PI*2);
    sCtx.fillStyle = cg; sCtx.fill();
    const dg = sCtx.createRadialGradient(scx-R*0.28, scy-R*0.28, R*0.05, scx, scy, R);
    dg.addColorStop(0, '#FFFFFF'); dg.addColorStop(0.3, '#FFFAAA');
    dg.addColorStop(0.75, '#FFD700'); dg.addColorStop(1, '#FFA500');
    sCtx.beginPath(); sCtx.arc(scx, scy, R, 0, Math.PI*2);
    sCtx.fillStyle = dg; sCtx.fill();
    sCtx.beginPath(); sCtx.arc(scx-R*0.3, scy-R*0.3, R*0.28, 0, Math.PI*2);
    sCtx.fillStyle = 'rgba(255,255,255,0.60)'; sCtx.fill();
    this._sunCanvas = sc;

    const mc   = document.createElement('canvas');
    mc.width   = sz; mc.height = sz;
    const mCtx = mc.getContext('2d')!;
    const mcx  = pad, mcy = pad;
    for (let i = 0; i < 2; i++) {
      const hr = R * (2.5 + i * 1.0);
      const hg = mCtx.createRadialGradient(mcx, mcy, R*0.6, mcx, mcy, hr);
      hg.addColorStop(0, 'rgba(200,225,255,0.16)');
      hg.addColorStop(0.4, 'rgba(180,210,255,0.08)');
      hg.addColorStop(1, 'rgba(140,190,255,0)');
      mCtx.beginPath(); mCtx.arc(mcx, mcy, hr, 0, Math.PI*2);
      mCtx.fillStyle = hg; mCtx.fill();
    }
    const mdg = mCtx.createRadialGradient(mcx-R*0.18, mcy-R*0.18, 0, mcx, mcy, R);
    mdg.addColorStop(0, '#FFFFFF'); mdg.addColorStop(0.45, '#F0F4FF');
    mdg.addColorStop(0.82, '#D8E8FF'); mdg.addColorStop(1, '#B8CCFF');
    mCtx.beginPath(); mCtx.arc(mcx, mcy, R, 0, Math.PI*2);
    mCtx.fillStyle = mdg; mCtx.fill();
    for (const cr of [{x:0.28,y:-0.18,r:0.14},{x:-0.22,y:0.20,r:0.10},{x:0.08,y:0.32,r:0.08}]) {
      mCtx.beginPath(); mCtx.arc(mcx+cr.x*R, mcy+cr.y*R, cr.r*R, 0, Math.PI*2);
      mCtx.fillStyle = 'rgba(180,195,225,0.35)'; mCtx.fill();
    }
    mCtx.beginPath(); mCtx.arc(mcx-R*0.26, mcy-R*0.26, R*0.22, 0, Math.PI*2);
    mCtx.fillStyle = 'rgba(255,255,255,0.50)'; mCtx.fill();
    this._moonCanvas = mc;
    this._builtR = R;
  }

  draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number, globalT: number) {
    const R = Math.round(Math.min(this.W, this.H) * 0.044);
    if (R !== this._builtR) this._buildBodies(R);
    if (!this._sunCanvas || !this._moonCanvas) return;
    const pad = Math.ceil(R * 5.5);
    const eff = Math.max(1, surfY);

    const sunPhase = clamp(globalT / 0.65, 0, 1);
    const sunPos   = this._bodyXY(sunPhase, eff, false);
    const sunDip   = clamp(1 - (sunPos.y - eff + R) / (R * 4), 0, 1);
    const sunAlpha = clamp(sunDip * (1 - nf * 1.4), 0, 1);
    if (sunAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = sunAlpha;
      ctx.drawImage(this._sunCanvas, sunPos.x - pad, sunPos.y - pad);
      ctx.restore();
    }

    const moonGlobalT = (globalT + 0.5) % 1.0;
    const moonPhase   = clamp(moonGlobalT / 0.65, 0, 1);
    const moonPos     = this._bodyXY(moonPhase, eff, true);
    const moonDip     = clamp(1 - (moonPos.y - eff + R) / (R * 4), 0, 1);
    const moonAlpha   = clamp(moonDip * clamp((nf - 0.3) / 0.4, 0, 1), 0, 1);
    if (moonAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = moonAlpha;
      ctx.drawImage(this._moonCanvas, moonPos.x - pad, moonPos.y - pad);
      if (moonPos.y < eff - R && moonAlpha > 0.25) {
        ctx.globalAlpha = moonAlpha * 0.18;
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i++) {
          const ry = eff + 4 + i * R * 1.1;
          const rw = R * (1.5 - i * 0.28);
          const rg = ctx.createLinearGradient(moonPos.x-rw, ry, moonPos.x+rw, ry);
          rg.addColorStop(0, 'rgba(210,230,255,0)');
          rg.addColorStop(0.5, `rgba(210,230,255,${0.9-i*0.2})`);
          rg.addColorStop(1, 'rgba(210,230,255,0)');
          ctx.fillStyle = rg;
          ctx.fillRect(moonPos.x - rw, ry, rw * 2, R * 0.7);
        }
      }
      ctx.restore();
    }
  }
}

class Star {
  // All fields public — accessed by batched inline draw loop
  x: number; y: number; r: number; phase: number; bright: number; rgb: string;
  constructor(W: number, H: number) {
    this.x = Math.random() * W; this.y = Math.random() * H * 0.36;
    this.r = 0.3 + Math.random() * 1.4; this.phase = Math.random() * Math.PI * 2;
    this.bright = 0.35 + Math.random() * 0.65;
    const t = Math.random();
    this.rgb = t > 0.65 ? '255,238,200' : t > 0.35 ? '255,255,242' : '200,218,255';
  }
  // draw() inlined into SynapseBackground.draw() for batching
}

class ShootingStar {
  x = 0; y = 0; vx = 0; vy = 0; life = 0; maxLife = 0; active = false;
  constructor(private W: number) {}
  spawn(surfY: number) {
    this.x = this.W * (0.20 + Math.random() * 0.80);
    this.y = surfY * (0.02 + Math.random() * 0.18);
    const spd = 5 + Math.random() * 9, ang = Math.PI * (0.72 + Math.random() * 0.56);
    this.vx = Math.cos(ang) * spd; this.vy = Math.abs(Math.sin(ang)) * spd * 0.28;
    this.maxLife = 28 + Math.random() * 36; this.life = this.maxLife; this.active = true;
  }
  update(surfY: number) {
    if (!this.active) return;
    this.x += this.vx; this.y += this.vy; this.life--;
    if (this.life <= 0 || this.y >= surfY - 5) this.active = false;
  }
  draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number) {
    if (!this.active || nf < 0.65 || this.y >= surfY - 5) return;
    const p  = this.life / this.maxLife;
    const tx = this.x - this.vx * 9, ty = Math.min(this.y - this.vy * 9, surfY - 6);
    ctx.save();
    const g = ctx.createLinearGradient(this.x, this.y, tx, ty);
    g.addColorStop(0,   `rgba(255,255,255,${p * 0.92})`);
    g.addColorStop(0.5, `rgba(210,220,255,${p * 0.32})`);
    g.addColorStop(1,   'rgba(180,200,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.fillStyle = `rgba(255,255,255,${p * 0.90})`;
    ctx.beginPath(); ctx.arc(this.x, this.y, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  AURORA
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
//  CLOUD SYSTEM
//  Fluffy procedural clouds rendered to offscreen canvas.
//  Scrolls slowly left, wraps seamlessly. Day: bright white/cream.
//  Sunset: pink/orange. Night: hides (opacity → 0).
// ═══════════════════════════════════════════════════════════════════════════
interface CloudDef {
  x: number;      // world x (wraps)
  y: number;      // screen y
  scale: number;  // overall size mult
  speed: number;  // scroll speed mult
  seed:  number;  // shape seed
  layer: 0 | 1;  // 0 = far/small, 1 = near/large
}

class CloudSystem {
  private clouds: CloudDef[] = [];
  // Each cloud gets its own small pre-rendered canvas — drawn ONCE at spawn
  private cloudCanvases: (HTMLCanvasElement | null)[] = [];

  constructor(private W: number, private H: number) {
    this._spawn();
  }

  private _spawn() {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const layer = (i % 3 === 0 ? 1 : 0) as 0 | 1;
      this.clouds.push({
        x:     (i / count) * this.W * 2.4,
        y:     this.H * (layer === 1 ? 0.04 + Math.random() * 0.10 : 0.08 + Math.random() * 0.16),
        scale: layer === 1 ? 0.8 + Math.random() * 0.6 : 0.35 + Math.random() * 0.40,
        speed: layer === 1 ? 0.18 : 0.28,
        seed:  Math.floor(Math.random() * 9999),
        layer,
      });
      this.cloudCanvases.push(null);
    }
  }

  // Pre-render one cloud to a small canvas — called once per cloud
  private _bakeCloud(idx: number): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    const cl  = this.clouds[idx];
    const r   = Math.ceil(38 * cl.scale);
    const pad = Math.ceil(r * 0.4);
    const cw  = r * 5 + pad * 2;
    const ch  = r * 2.8 + pad * 2;

    const oc  = document.createElement('canvas');
    oc.width  = Math.max(1, Math.ceil(cw));
    oc.height = Math.max(1, Math.ceil(ch));
    const ctx = oc.getContext('2d')!;

    // Build puffs from seed
    let s = cl.seed | 1;
    const rng = () => { s ^= s<<13; s ^= s>>17; s ^= s<<5; return (s>>>0)/4294967296; };
    const cx  = cw / 2, cy = ch * 0.62;
    const puffs = 5 + Math.floor(rng() * 4);

    // Shadow pass
    ctx.globalAlpha = 0.22;
    ctx.fillStyle   = 'rgba(100,130,180,1)';
    ctx.beginPath();
    for (let i = 0; i < puffs; i++) {
      const px = cx + (rng() - 0.3) * r * 3.0;
      const py = cy + 6 + (rng() - 0.7) * r * 0.9;
      const pr = r * (0.55 + rng() * 0.55);
      ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, Math.PI * 2);
    }
    ctx.fill();

    // Main body pass — bright white
    ctx.globalAlpha = 1;
    ctx.fillStyle   = '#FFFFFF';
    ctx.beginPath();
    let s2 = cl.seed | 1;
    const rng2 = () => { s2 ^= s2<<13; s2 ^= s2>>17; s2 ^= s2<<5; return (s2>>>0)/4294967296; };
    for (let i = 0; i < puffs; i++) {
      const px = cx + (rng2() - 0.3) * r * 3.0;
      const py = cy + (rng2() - 0.7) * r * 0.9;
      const pr = r * (0.55 + rng2() * 0.55);
      ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, Math.PI * 2);
    }
    ctx.fill();

    // Specular highlight — smaller lighter puffs on top
    let s3 = cl.seed | 1;
    const rng3 = () => { s3 ^= s3<<13; s3 ^= s3>>17; s3 ^= s3<<5; return (s3>>>0)/4294967296; };
    ctx.globalAlpha = 0.65;
    ctx.fillStyle   = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    for (let i = 0; i < puffs; i++) {
      const px = cx + (rng3() - 0.3) * r * 3.0;
      const py = cy - r * 0.20 + (rng3() - 0.7) * r * 0.9;
      const pr = r * (0.55 + rng3() * 0.55) * 0.55;
      ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, Math.PI * 2);
    }
    ctx.fill();

    return oc;
  }

  update(scrollSpeed: number) {
    for (const cl of this.clouds) {
      cl.x -= scrollSpeed * cl.speed;
      if (cl.x < -(this.W * 0.35)) cl.x += this.W * 2.4 + this.W * 0.35;
    }
  }

  draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number) {
    // Clouds fade out at night, tint warm at sunset
    const cloudAlpha = clamp(1 - nf * 2.2, 0, 1);
    if (cloudAlpha < 0.01) return;

    // Sunset tint: warm orange when sun is near horizon
    const sunsetT = smoothstep(0.20, 0.50, nf) * (1 - smoothstep(0.50, 0.70, nf));

    for (let i = 0; i < this.clouds.length; i++) {
      const cl = this.clouds[i];
      // Lazy-bake on first use
      if (!this.cloudCanvases[i]) {
        this.cloudCanvases[i] = this._bakeCloud(i);
      }
      const canvas = this.cloudCanvases[i];
      if (!canvas) continue;

      const r       = Math.ceil(38 * cl.scale);
      const skyH    = surfY > 10 ? surfY : this.H * 0.40;
      if (cl.y > skyH) continue;

      const baseA   = cloudAlpha * (cl.layer === 1 ? 0.96 : 0.72);

      ctx.save();
      ctx.globalAlpha = baseA;

      // Sunset colour tint via overlay — no fillRect on full canvas
      if (sunsetT > 0.02) {
        ctx.filter = `sepia(${Math.round(sunsetT * 60)}%) saturate(${Math.round(100 + sunsetT * 60)}%)`;
      }

      ctx.drawImage(canvas, cl.x - canvas.width / 2, cl.y - canvas.height * 0.62);
      ctx.filter = 'none';
      ctx.restore();
    }
  }
}

class Aurora {
  ph = 0;
  private _off:    HTMLCanvasElement | null = null;
  private _offCtx: CanvasRenderingContext2D | null = null;
  private _frame   = 0;

  constructor(private W: number) {}
  tick() { this.ph += 0.0013; this._frame++; }

  draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number) {
    if (nf < 0.62) return;
    if (typeof document === 'undefined') return;
    const a = (nf - 0.62) * 0.13;
    const offH = Math.max(1, Math.round((surfY > 10 ? surfY : this.W * 0.35) * 0.45));
    if (!this._off || this._off.height !== offH) {
      this._off    = document.createElement('canvas');
      this._off.width  = Math.max(1, this.W);
      this._off.height = offH;
      this._offCtx = this._off.getContext('2d');
    }
    // Redraw every 4th frame — aurora moves slowly, nobody notices
    if (this._frame % 4 === 0 && this._offCtx) {
      const oc  = this._offCtx;
      const oh  = this._off.height;
      oc.clearRect(0, 0, this.W, oh);
      oc.save(); oc.globalCompositeOperation = 'screen';
      for (let b = 0; b < 3; b++) {
        const yBase = oh * (0.15 + b * 0.20);
        const hue   = [162, 188, 142][b];
        const bH    = oh * 0.30;
        const g     = oc.createLinearGradient(0, yBase, 0, yBase + bH);
        g.addColorStop(0,    `hsla(${hue},80%,58%,0)`);
        g.addColorStop(0.44, `hsla(${hue},80%,58%,${a * (1 - b * 0.28)})`);
        g.addColorStop(1,    `hsla(${hue},80%,58%,0)`);
        oc.fillStyle = g; oc.beginPath(); oc.moveTo(0, yBase);
        for (let x = 0; x <= this.W; x += 32) {
          const y = yBase
            + Math.sin(x * 0.0052 + this.ph + b * 1.5) * 18
            + Math.sin(x * 0.0118 + this.ph * 1.8 + b) * 8;
          oc.lineTo(x, Math.min(y, oh - 4));
        }
        oc.lineTo(this.W, yBase + bH); oc.lineTo(0, yBase + bH); oc.fill();
      }
      oc.restore();
    }
    if (this._off && this._off.width > 0 && this._off.height > 0) ctx.drawImage(this._off, 0, 0);
  }
}

class Bubble {
  x = 0; y = 0; startY = 0; r = 0; vy = 0; vx = 0; phase = 0; active = false;
  constructor(private W: number, private H: number) {}
  spawn(surfY: number) {
    this.x      = Math.random() * this.W;
    this.y      = this.H - 10 - Math.random() * (this.H - surfY) * 0.55;
    this.startY = this.y;
    // Smaller bubbles — 1.5 to 4.5px radius
    this.r      = 1.5 + Math.random() * 3.0;
    this.vy     = -(0.18 + Math.random() * 0.45);
    this.vx     = (Math.random() - 0.5) * 0.20;
    this.phase  = Math.random() * Math.PI * 2;
    this.active = true;
  }
  scatter() {
    // Called on error flash — kicks bubble in a random direction
    this.vx += (Math.random() - 0.5) * 3.5;
    this.vy += (Math.random() - 0.5) * 2.5 - 0.8;
  }
  update(scrollSpeed: number, pressureSmooth = 0) {
    this.phase += 0.034;
    this.vx    *= 0.96;  // dampen any scatter impulse
    // Slipstream: rising pressure rockets bubbles upward — max 3.5× base speed
    const slipBoost = 1 + pressureSmooth * 2.5;
    this.x     += this.vx + Math.sin(this.phase) * 0.16 - scrollSpeed * 0.80;
    this.y     += this.vy * slipBoost;
    if (this.x < 0) this.x += this.W;
    if (this.x > this.W) this.x -= this.W;
  }
  draw(ctx: CanvasRenderingContext2D) {
    const risen = clamp((this.startY - this.y) / 200, 0, 1);
    const a     = (0.12 + risen * 0.40) * 0.65;
    ctx.save(); ctx.globalAlpha = a;
    // Rim
    ctx.strokeStyle = 'rgba(160,225,255,0.85)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke();
    // Translucent fill
    ctx.fillStyle = 'rgba(200,242,255,0.06)'; ctx.fill();
    // Inner glint top-left
    if (this.r > 1.5) {
      ctx.fillStyle = 'rgba(255,255,255,0.58)';
      ctx.beginPath();
      ctx.arc(this.x - this.r * 0.28, this.y - this.r * 0.28, this.r * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PLANKTON
// ═══════════════════════════════════════════════════════════════════════════
class Plankton {
  x = 0; y = 0; vx = 0; vy = 0; r = 0; phase = 0; hue = 0;
  warpOffset = 0;   // stable horizontal offset per particle for smooth streaming
  constructor(private W: number, private H: number) { this.reset(H * 0.7); }
  reset(surfY: number) {
    this.x          = Math.random() * this.W;
    this.y          = surfY + Math.random() * (this.H - surfY) * 0.90;
    this.vx         = (Math.random() - 0.5) * 0.12;
    this.vy         = (Math.random() - 0.5) * 0.09 - 0.02;
    this.r          = 0.5 + Math.random() * 1.2;
    this.phase      = Math.random() * Math.PI * 2;
    this.hue        = [172, 188, 158, 202][Math.floor(Math.random() * 4)];
    this.warpOffset = 5 + Math.random() * 9;  // unique streak speed per particle
  }
  update(surfY: number, scrollSpeed: number, hyperFlow = 0) {
    this.phase += 0.020 + hyperFlow * 0.05;
    // In HyperFlow each particle streams left at its own stable warpOffset speed
    const warp  = hyperFlow * this.warpOffset;
    this.x     += this.vx - scrollSpeed * 0.38 - warp;
    this.y     += this.vy;
    // Wrap around — particles that fly off the left re-enter from the right
    if (this.x < -10) this.x = this.W + 10;
    if (this.x > this.W + 10) this.x = -10;
    if (this.y < surfY + 32 || this.y > this.H) this.reset(surfY);
  }
  draw(ctx: CanvasRenderingContext2D, nf: number, hyperFlow = 0) {
    const brightMult = 1 + hyperFlow * 2.0;
    const baseA      = (0.20 + Math.sin(this.phase) * 0.80) * (0.04 + nf * 0.16);
    const a          = Math.min(0.92, baseA * brightMult);
    if (a < 0.006) return;
    if (hyperFlow > 0.12) {
      const trailLen = hyperFlow * this.warpOffset * 6;
      const hw = this.r * (0.8 + hyperFlow * 0.6);
      ctx.beginPath();
      ctx.moveTo(this.x,            this.y - hw);
      ctx.lineTo(this.x + trailLen, this.y);
      ctx.lineTo(this.x,            this.y + hw);
      ctx.closePath();
      ctx.fillStyle = `hsla(${this.hue},90%,72%,${a * 0.50})`; ctx.fill();
    }
    const rad = this.r * 4.5 * (1 + hyperFlow * 0.55);
    ctx.beginPath(); ctx.arc(this.x, this.y, rad, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue},85%,58%,${a * 0.28})`; ctx.fill();
    ctx.beginPath(); ctx.arc(this.x, this.y, rad * 0.40, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue},96%,80%,${a})`; ctx.fill();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  MARINE SNOW
// ═══════════════════════════════════════════════════════════════════════════
class MarineSnow {
  x = 0; y = 0; r = 0; vy = 0; vx = 0; alpha = 0;
  constructor(private W: number, private H: number) { this.reset(H * 0.4); }
  reset(surfY: number) {
    this.x     = Math.random() * this.W;
    this.y     = surfY + Math.random() * (this.H - surfY);
    this.r     = 0.3 + Math.random() * 0.85;
    this.vy    = 0.07 + Math.random() * 0.14;
    this.vx    = (Math.random() - 0.5) * 0.09;
    this.alpha = 0.04 + Math.random() * 0.10;
  }
  update(surfY: number, scrollSpeed: number) {
    this.x += this.vx - scrollSpeed * 0.55;
    this.y += this.vy;
    if (this.x < 0) this.x += this.W;
    if (this.y > this.H) this.reset(surfY);
  }
  draw(ctx: CanvasRenderingContext2D, relaxGlow = 0) {
    const glowMult = 1 + relaxGlow * 2.8;
    const a        = Math.min(0.85, this.alpha * glowMult);
    const blue     = Math.round(235 + relaxGlow * 20);
    const sz       = Math.max(1, this.r * 2);
    ctx.fillStyle  = `rgba(195,235,${blue},${a})`;
    ctx.fillRect(this.x - sz * 0.5, this.y - sz * 0.5, sz, sz);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SEA FLOOR — warm golden sand matching reference image
//  Reference: bright sandy yellow #D4A03C, NOT dark brown.
//  Texture: subtle circular dimple dots baked into an offscreen canvas.
//  Edge: organic wavy line with warm highlight on top.
// ═══════════════════════════════════════════════════════════════════════════
class SeaFloor {
  // sandHeight = foreground height — public, read by index.tsx via sandHeight getter
  sandHeight   = 80;
  targetHeight = 80;

  // Three independent scroll positions for parallax
  private sxBack = 0;
  private sxMid  = 0;
  private sxFore = 0;

  // Precomputed bump arrays — rebuilt only when scroll crosses a bucket
  private bumpsBack: number[] = [];
  private bumpsMid:  number[] = [];
  private bumpsFore: number[] = [];
  private _lastSxBack = -9999;
  private _lastSxMid  = -9999;
  private _lastSxFore = -9999;

  // Gradient cache — rebuilt only when nf bucket changes
  private _nfBkt  = -1;
  private _gFore: CanvasGradient | null = null;
  private _gMid:  CanvasGradient | null = null;
  private _gBack: CanvasGradient | null = null;

  // Pattern built once from texture
  private pat: CanvasPattern | null = null;

  constructor(private W: number, private H: number) {
    const tex = this._buildSandTex();
    if (tex && typeof document !== 'undefined') {
      const tmp = document.createElement('canvas').getContext('2d');
      if (tmp) this.pat = tmp.createPattern(tex, 'repeat');
    }
  }

  private _buildSandTex(): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#C8922A';
    ctx.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 2200; i++) {
      ctx.fillStyle = `hsla(${32 + Math.random() * 18},${48 + Math.random() * 20}%,${40 + Math.random() * 28}%,${0.04 + Math.random() * 0.07})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 256, 2 + Math.random() * 3, 1);
    }
    for (let i = 0; i < 90; i++) {
      const dx = Math.random() * 512, dy = Math.random() * 256, dr = 2.5 + Math.random() * 5;
      const dg = ctx.createRadialGradient(dx, dy, 0, dx, dy, dr);
      dg.addColorStop(0, 'rgba(100,65,10,0.28)');
      dg.addColorStop(0.6, 'rgba(120,78,15,0.12)');
      dg.addColorStop(1, 'rgba(130,85,18,0)');
      ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fillStyle = dg; ctx.fill();
    }
    return c;
  }

  // Rebuild bump array for one layer — only when scroll bucket changes
  private _buildBumps(sx: number, baseY: number, step: number, t: number, ampMult: number): number[] {
    const W = this.W;
    const out: number[] = [];
    for (let xi = 0; xi <= W + step; xi += step) {
      const rx = xi + sx;
      out.push(
        Math.sin(rx * 0.010) * 10 * ampMult
        + Math.cos(rx * 0.038) * 4  * ampMult
        + Math.sin(rx * 0.085 + t * 0.0004) * 2 * ampMult
        + vnoise(rx * 0.004 + t * 0.00007) * 3.5 * ampMult
      );
    }
    return out;
  }

  // Rebuild fill gradients — only when nf bucket changes
  private _buildGrads(ctx: CanvasRenderingContext2D, nf: number) {
    const H  = this.H;
    const sh = this.sandHeight;

    // Foreground — warm golden sand
    const foreY = H - sh;
    const gF = ctx.createLinearGradient(0, foreY, 0, H);
    gF.addColorStop(0,    lerpColor('#D4A03C', '#3A2808', nf * 0.85));
    gF.addColorStop(0.18, lerpColor('#C08828', '#2E2006', nf * 0.85));
    gF.addColorStop(0.55, lerpColor('#A87020', '#221806', nf * 0.85));
    gF.addColorStop(1,    lerpColor('#8A5818', '#140C04', nf * 0.85));
    this._gFore = gF;

    // Midground — desaturated warm sand blending into ocean blue-green
    const midY = H - sh - 30;
    const gM = ctx.createLinearGradient(0, midY, 0, H);
    gM.addColorStop(0,    lerpColor('#7A8060', '#162A28', nf * 0.80));
    gM.addColorStop(0.30, lerpColor('#687050', '#122020', nf * 0.80));
    gM.addColorStop(0.65, lerpColor('#586045', '#0E1A1A', nf * 0.80));
    gM.addColorStop(1,    lerpColor('#485040', '#0A1414', nf * 0.80));
    this._gMid = gM;

    // Background — deep ocean blue-green, barely any sand colour
    const backY = H - sh - 62;
    const gB = ctx.createLinearGradient(0, backY, 0, H);
    gB.addColorStop(0,    lerpColor('#2A4855', '#081820', nf * 0.75));
    gB.addColorStop(0.30, lerpColor('#1E3840', '#060E18', nf * 0.75));
    gB.addColorStop(0.70, lerpColor('#162C32', '#040C12', nf * 0.75));
    gB.addColorStop(1,    lerpColor('#102028', '#02080C', nf * 0.75));
    this._gBack = gB;
  }

  update(gameTime: number, scrollSpeed: number) {
    // Parallax: back slowest, fore full speed
    this.sxBack += scrollSpeed * 0.30;
    this.sxMid  += scrollSpeed * 0.60;
    this.sxFore += scrollSpeed * 1.00;

    if (Math.floor(gameTime / 10000) % 3 === 0)
      this.targetHeight = Math.min(220, 80 + gameTime / 2200);
    else
      this.targetHeight = Math.max(80, this.targetHeight - 0.12);
    this.sandHeight += (this.targetHeight - this.sandHeight) * 0.008;
  }

  draw(ctx: CanvasRenderingContext2D, nf: number, t: number) {
    const W = this.W, H = this.H;
    const sh = this.sandHeight;

    // Layer vertical positions — back highest (furthest), fore lowest (closest)
    const foreBaseY = H - sh;
    const midBaseY  = H - sh - 18;
    const backBaseY = H - sh - 40;

    // Rebuild gradients only when nf bucket changes (coarse: 0.10 steps = 10 rebuilds max)
    const nfBkt = Math.round(nf / 0.10) * 0.10;
    if (nfBkt !== this._nfBkt) {
      this._buildGrads(ctx, nf);
      this._nfBkt = nfBkt;
    }

    // Bump arrays: back layer uses coarse step (24px) — fewer vertices, much faster
    // Mid: 16px, Fore: 8px (full detail only where the eye focuses)
    const bktBack = Math.round(this.sxBack / 6) * 6;
    const bktMid  = Math.round(this.sxMid  / 4) * 4;
    const bktFore = Math.round(this.sxFore  / 2) * 2;

    if (bktBack !== this._lastSxBack) {
      this.bumpsBack  = this._buildBumps(this.sxBack, backBaseY, 24, t, 0.55);
      this._lastSxBack = bktBack;
    }
    if (bktMid !== this._lastSxMid) {
      this.bumpsMid   = this._buildBumps(this.sxMid, midBaseY, 16, t, 0.75);
      this._lastSxMid  = bktMid;
    }
    if (bktFore !== this._lastSxFore) {
      this.bumpsFore  = this._buildBumps(this.sxFore, foreBaseY, 8, t, 1.00);
      this._lastSxFore = bktFore;
    }

    // Draw back → mid → fore (painter's order)
    this._drawLayer(ctx, this.bumpsBack, backBaseY,  H, 24, this._gBack, 0.72, false, nf);
    this._drawLayer(ctx, this.bumpsMid,  midBaseY,   H, 16, this._gMid,  0.88, false, nf);
    this._drawLayer(ctx, this.bumpsFore, foreBaseY,  H,  8, this._gFore, 1.00, true,  nf);
  }

  private _drawLayer(
    ctx:      CanvasRenderingContext2D,
    bumps:    number[],
    baseY:    number,
    H:        number,
    step:     number,
    grad:     CanvasGradient | null,
    opacity:  number,
    isFore:   boolean,
    nf:       number,
  ) {
    if (!grad || bumps.length === 0) return;
    const W = this.W;
    const prevAlpha = ctx.globalAlpha;
    ctx.globalAlpha = opacity;

    // Sand body
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, baseY + bumps[0]);
    for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i]);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Texture overlay — only on foreground and midground (back is too hazy)
    if (isFore && this.pat) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, baseY + bumps[0]);
      for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i]);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.clip();
      ctx.translate(-(this.sxFore % 512), baseY);
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.48;
      ctx.fillStyle   = this.pat;
      ctx.fillRect(0, 0, W + 512, this.sandHeight + 20);
      ctx.restore();
    }

    // Surface highlight — fore gets warm gold, mid gets a faint cool line
    if (isFore) {
      ctx.beginPath();
      ctx.moveTo(0, baseY + bumps[0]);
      for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i]);
      ctx.strokeStyle = `rgba(240,185,75,${0.55 - nf * 0.42})`;
      ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, baseY + bumps[0] + 4);
      for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i] + 4);
      ctx.strokeStyle = `rgba(80,45,8,${0.18 + nf * 0.12})`;
      ctx.lineWidth = 3.0; ctx.stroke();
    } else {
      // Midground: faint cool edge line only
      ctx.beginPath();
      ctx.moveTo(0, baseY + bumps[0]);
      for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i]);
      ctx.strokeStyle = `rgba(100,160,180,${(0.22 - nf * 0.15) * opacity})`;
      ctx.lineWidth = 1.2; ctx.stroke();
    }

    ctx.globalAlpha = prevAlpha;
  }
}

class DistantMountains {
  private scrollX = 0;
  private _off:    HTMLCanvasElement | null = null;
  private _offCtx: CanvasRenderingContext2D | null = null;
  private _lastKey = '';

  constructor(private W: number, private H: number) {}
  update(speed: number) { this.scrollX += speed * 0.15; }

  draw(ctx: CanvasRenderingContext2D, nf: number, baseY: number) {
    if (typeof document === 'undefined') return;
    const sBkt = Math.round(this.scrollX / 3) * 3;
    const nBkt = Math.round(nf / 0.05) * 0.05;
    const key  = `${sBkt}_${nBkt}`;
    if (!this._off) {
      this._off    = document.createElement('canvas');
      this._off.width  = this.W; this._off.height = this.H;
      this._offCtx = this._off.getContext('2d');
    }
    if (key !== this._lastKey && this._offCtx) {
      this._lastKey = key;
      const oc  = this._offCtx;
      oc.clearRect(0, 0, this.W, this.H);
      oc.fillStyle = lerpColor('rgba(18,72,145,0.38)', 'rgba(4,12,32,0.52)', nf) as string;
      oc.beginPath(); oc.moveTo(0, this.H);
      for (let x = 0; x <= this.W; x += 18) {
        const rx = x + this.scrollX;
        const y  = baseY - 55
          + Math.sin(rx * 0.0018) * 70
          + Math.cos(rx * 0.0048) * 24
          + Math.sin(rx * 0.0108) * 12;
        oc.lineTo(x, y);
      }
      oc.lineTo(this.W, this.H); oc.fill();
    }
    if (this._off) ctx.drawImage(this._off, 0, 0);
  }
}

class SiltParticle {
  x: number; y: number;
  private vx: number; private vy: number;
  private r: number; private life: number; private maxLife: number;
  private hue: number;
  constructor(originX: number, originY: number) {
    this.x       = originX + (Math.random() - 0.5) * 80;
    this.y       = originY;
    this.vx      = (Math.random() - 0.5) * 2.8;
    this.vy      = -(Math.random() * 2.2 + 0.5);
    this.r       = 3 + Math.random() * 6;
    this.maxLife = 70 + Math.random() * 55;
    this.life    = this.maxLife;
    this.hue     = 26 + Math.random() * 18;
  }
  update() {
    this.vx *= 0.972; this.vy *= 0.966;
    this.vy += 0.04;   // slight gravity pulls silt back down slowly
    this.x  += this.vx; this.y += this.vy;
    this.r  *= 0.994;
    this.life--;
  }
  get dead() { return this.life <= 0 || this.r < 0.5; }
  draw(ctx: CanvasRenderingContext2D) {
    const a  = (this.life / this.maxLife) * 0.38;
    const d  = this.r * 4.4;
    ctx.fillStyle = `hsla(${this.hue},50%,38%,${a})`;
    ctx.fillRect(this.x - d * 0.5, this.y - d * 0.5, d, d);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN CLASS
// ═══════════════════════════════════════════════════════════════════════════
export class SynapseBackground {
  gameWidth:  number;
  gameHeight: number;

  private wave:    WaveEngine;
  private floor:   SeaFloor;
  private mounts:  DistantMountains;
  private bodies:  CelestialBodies;
  private rays:    GodRays;
  private aurora:  Aurora;
  private clouds:  CloudSystem;
  private sils:    BackgroundSilhouettes;
  private stars:   Star[];
  private meteors: ShootingStar[];
  private bubblePool:    Bubble[];
  private activeBubbles: Bubble[] = [];
  private plankton:      Plankton[];
  private snow:          MarineSnow[];
  private fauna:         AmbientFishSystem;

  private bubTimer = 0;
  private metTimer = 0;
  private surfY    = 0;
  private waveAmp  = 24;
  private wallT    = 0;
  private globalT  = 0;

  // ── Perf cache ──────────────────────────────────────────────────────
  private frameCount      = 0;
  private raysOff:    HTMLCanvasElement | null = null;
  private raysOffCtx: CanvasRenderingContext2D | null = null;
  private raysStale       = true;
  private cachedSkyGrad:  CanvasGradient | null = null;
  private cachedVigGrad:  CanvasGradient | null = null;
  private cachedBdgGrad:   CanvasGradient | null = null;
  private cachedBdgNf      = -1;
  private cachedMurkGrad:  CanvasGradient | null = null;
  private cachedMurkDens   = -1;
  private lastNfKey       = -999;
  private starTick          = 0;
  // Water layer cache
  private _wPts:  Array<{x:number;y:number}[]> = [[],[],[]];
  private _wGrad: Array<CanvasGradient|null>    = [null,null,null];
  private _wGradKey = -999;
  private _wPtsTick    = -1;    // wallT bucket when pts were last built
  private _waveOff:    HTMLCanvasElement | null = null;
  private _waveOffCtx: CanvasRenderingContext2D | null = null;
  private _waveOffTick = -2;

  // ── Reactive systems ────────────────────────────────────────────────────
  private hyperFlow:        number = 0;   // 0→1 smooth
  private pressureSmooth:   number = 0;   // smoothed pressureRatio
  private prevPressure:     number = 0;   // previous frame pressure for release detection
  private relaxTimer:       number = 0;   // ms — active after full release from high squeeze
  private errorFlashT:      number = 0;   // ms countdown
  private siltParticles:    SiltParticle[] = [];
  private siltDensity:      number = 0;   // 0→1 cumulative silt buildup on floor

  get sandHeight(): number { return this.floor.sandHeight; }

  // ── Public API (called from index.tsx) ────────────────────────────────
  /** Trigger Cognitive Shockwave — call when bad pearl collected */
  triggerErrorFlash(): void {
    this.errorFlashT = 500;
    // Scatter all active bubbles
    for (const b of this.activeBubbles) b.scatter();
  }

  /** Continuous silt — call every frame the fish is on the floor.
   *  Spawns a small trickle each call; density builds over time. */
  triggerSiltCloud(playerX: number, playerY: number): void {
    if (this.siltParticles.length < 60) {
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++)
        this.siltParticles.push(new SiltParticle(playerX, playerY));
    }
    // Accumulate silt density — caps at 1.0 (full storm)
    this.siltDensity = Math.min(1, this.siltDensity + 0.022);
  }

  /** Call when fish lifts off floor — begins silt storm clearing */
  clearSiltCloud(): void {
    // Density decays quickly once fish lifts off
    this.siltDensityDecaying = true;
  }
  private siltDensityDecaying = false;

  constructor(W: number, H: number) {
    this.gameWidth  = W;
    this.gameHeight = H;
    this.wave   = new WaveEngine(W, H);
    this.floor  = new SeaFloor(W, H);
    this.mounts = new DistantMountains(W, H);
    this.bodies = new CelestialBodies(W, H);
    this.rays   = new GodRays(W, H);
    this.aurora = new Aurora(W);
    this.clouds = new CloudSystem(W, H);
    this.sils   = new BackgroundSilhouettes(W, H);
    this.stars   = Array.from({ length: 88 }, () => new Star(W, H));
    this.meteors = Array.from({ length: 3  }, () => new ShootingStar(W));
    this.bubblePool = Array.from({ length: 14 }, () => new Bubble(W, H));
    this.plankton   = Array.from({ length: 18 }, () => new Plankton(W, H));
    this.snow       = Array.from({ length: 22 }, () => new MarineSnow(W, H));
    this.fauna      = new AmbientFishSystem(W, H, H * 0.38);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // streak & pressureRatio are optional — backward compatible
  update(gameTime: number, delta: number, scrollSpeed: number, streak = 0, pressureRatio = 0): number {
    const C = 180_000; // 3-minute cycle
    this.globalT = ((gameTime % C) / C + 0.08) % 1.0;

    // Unified nf — driven purely by sun altitude, no hardcoded SUN_WIN in other classes
    // Sun sweeps 0→1 over globalT 0→0.65, then stays set.
    const sunPhase  = clamp(this.globalT / 0.65, 0, 1);
    const sunAlt    = Math.sin(sunPhase * Math.PI);   // 0=horizon, 1=noon, back to 0=sunset
    // nf: 0 = full day (sun high), 1 = full night (sun below horizon)
    // smoothstep so dawn/dusk are gradual, not snapping
    // sunAlt handles smooth dawn/dusk naturally via smoothstep.
    // After globalT > 0.65 (sun has set), it's simply full night.
    let nf: number;
    if (this.globalT <= 0.65) {
      nf = 1 - smoothstep(0.05, 0.32, sunAlt);
    } else {
      nf = 1;
    }

    this.wallT  = Date.now();
    this.starTick = this.wallT * 0.00165;
    this.frameCount++;

    // ── HYPER-FLOW ────────────────────────────────────────────────────────
    // Smooth 0→1 as streak climbs from 5 to 20, snaps back to 0 when lost
    const hfTarget   = streak >= 5 ? Math.min(1, (streak - 5) / 15) : 0;
    const hfRate     = hfTarget > this.hyperFlow ? 0.022 : 0.010;
    this.hyperFlow  += (hfTarget - this.hyperFlow) * hfRate;

    // ── PRESSURE SMOOTH (for god rays) ───────────────────────────────────
    const pLerp            = pressureRatio > this.pressureSmooth ? 0.20 : 0.06;
    this.prevPressure      = this.pressureSmooth;
    this.pressureSmooth   += (pressureRatio - this.pressureSmooth) * pLerp;

    // ── RELAXATION RESONANCE ─────────────────────────────────────────────
    // Fires when patient fully releases after a high squeeze (prev > 0.45, now < 0.08)
    if (this.prevPressure > 0.45 && this.pressureSmooth < 0.08) {
      this.relaxTimer = 1200;  // 1.2 second glow reward
    }
    if (this.relaxTimer > 0) this.relaxTimer = Math.max(0, this.relaxTimer - delta);

    // ── ERROR FLASH countdown ─────────────────────────────────────────────
    if (this.errorFlashT > 0) this.errorFlashT = Math.max(0, this.errorFlashT - delta);

    // ── SILT update ───────────────────────────────────────────────────────
    for (let i = this.siltParticles.length - 1; i >= 0; i--) {
      this.siltParticles[i].update();
      if (this.siltParticles[i].dead) this.siltParticles.splice(i, 1);
    }
    // Silt density decays when fish leaves floor
    if (this.siltDensityDecaying) {
      this.siltDensity = Math.max(0, this.siltDensity - 0.008);
      if (this.siltDensity <= 0) this.siltDensityDecaying = false;
    }
    const diff = clamp((this.floor.sandHeight - 80) / 140, 0, 1);
    this.waveAmp = Math.max(12, 28 * (1 - diff * 0.42));

    // HyperFlow speeds up all layers smoothly — max 1.70× at full streak
    const hfMult = 1 + this.hyperFlow * 0.70;
    this.floor.update(gameTime, scrollSpeed * hfMult);
    this.mounts.update(scrollSpeed * hfMult);
    this.sils.update(scrollSpeed * hfMult);
    this.wave.scroll(scrollSpeed * 0.78 * hfMult);
    // Only recompute surfaceY every 2nd frame — imperceptible at 60fps
    if (this.frameCount % 2 === 0) {
      this.surfY = this.wave.surfaceY(this.gameWidth / 2, this.wallT, this.waveAmp);
    }
    this.aurora.tick();
    this.clouds.update(scrollSpeed * hfMult);

    this.metTimer += delta;
    if (this.metTimer > 4200 + Math.random() * 5500) {
      const m = this.meteors.find(s => !s.active);
      if (m) m.spawn(this.surfY);
      this.metTimer = 0;
    }
    this.meteors.forEach(s => s.update(this.surfY));

    this.bubTimer += delta;
    if (this.bubTimer > 800 + Math.random() * 1100) {
      const free = this.bubblePool.find(b => !b.active);
      if (free) { free.spawn(this.surfY); this.activeBubbles.push(free); }
      this.bubTimer = 0;
    }
    this.activeBubbles = this.activeBubbles.filter(b => {
      b.update(scrollSpeed, this.pressureSmooth);
      if (b.y <= this.surfY + 2) { b.active = false; return false; }
      return true;
    });

    this.plankton.forEach(p => p.update(this.surfY, scrollSpeed, this.hyperFlow));
    this.fauna.update(scrollSpeed, this.surfY, this.gameHeight - this.floor.sandHeight);
    if (this.frameCount % 2 === 0) {
      this.snow.forEach(s => s.update(this.surfY, scrollSpeed));
    }

    return nf;
  }

  // ─────────────────────────────────────────────────────────────────────────
  draw(ctx: CanvasRenderingContext2D, nf: number): void {
    const W = this.gameWidth, H = this.gameHeight;
    const t = this.wallT, sy = this.surfY;

    // ── 1. SKY ────────────────────────────────────────────────────────────
    // Error-flash: sky shifts to dark storm hue for 0.5 s, then snaps back
    const efT    = clamp(this.errorFlashT / 500, 0, 1);        // 1 at flash start → 0
    const efEase = efT * efT;                                   // quadratic — sharp hit, fast fade

    const nfKey = Math.round(nf / 0.03) * 100 + Math.round(efEase / 0.05);
    if (!this.cachedSkyGrad || nfKey !== this.lastNfKey) {
      this.lastNfKey     = nfKey;
      this.raysStale     = true;
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.42);
      // Day: deep azure top → bright sky blue → pale cyan at horizon → blends into water
      // Night: deep navy top → dark steel → matches water colour at bottom
      const sunsetGlow = smoothstep(0.30, 0.52, nf) * (1 - smoothstep(0.52, 0.72, nf));
      // Sky: vivid royal blue at top → pale sky blue → near-white at horizon
      // Night: dark navy. Sunset: warm orange glow at horizon.
      // Sky: vivid royal blue → soft sky → pale almost-white horizon
      // Night: deep blue-black. Sunset: warm amber bleeds in at horizon.
      // Sky: cornflower blue at top → pale powder blue → near-white at horizon
      sky.addColorStop(0,    lerpColor(lerpColor('#4488CC','#06090E',efEase), '#040810', nf));
      sky.addColorStop(0.25, lerpColor(lerpColor('#6AAEE0','#0C1422',efEase), '#080E1C', nf));
      sky.addColorStop(0.55, lerpColor(lerpColor('#9CCEF0','#141E2E',efEase), '#0E1828', nf));
      sky.addColorStop(0.82, lerpColor(
        lerpColor(lerpColor('#C8E8F8','#F5903C',sunsetGlow),'#181822',efEase),
        '#121E30', nf));
      // Horizon: almost white — stark contrast with deep ocean water below
      sky.addColorStop(1,    lerpColor(
        lerpColor(lerpColor('#EEF7FF','#FFAA44',sunsetGlow),'#1E1C28',efEase),
        '#162030', nf));
      this.cachedSkyGrad = sky;
    }
    ctx.fillStyle = this.cachedSkyGrad;
    ctx.fillRect(0, 0, W, H);

    // ── 1c. CLOUDS
    this.clouds.draw(ctx, nf, sy);

    // ── 2. AURORA (night only) ─────────────────────────────────────────────
    this.aurora.draw(ctx, nf, sy);

    // ── 3. STARS + METEORS ────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, sy - 2); ctx.clip();
    // Stars: only at night, every 2nd frame (twinkling is slow)
    if (nf >= 0.55 && this.frameCount % 2 === 0) {
      const darkF = smoothstep(0.55, 0.90, nf);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, sy - 2); ctx.clip();
      for (const s of this.stars) {
        if (s.y >= sy - 2) continue;
        const tw = 0.5 + Math.sin(this.starTick + s.phase) * 0.50;
        const a  = clamp(tw * s.bright * darkF, 0, 1);
        if (a < 0.02) continue;
        const d = s.r * 2;
        ctx.fillStyle = `rgba(${s.rgb},${a.toFixed(2)})`;
        ctx.fillRect(s.x - s.r, s.y - s.r, d, d);
      }
      ctx.restore();
    }
    if (this.frameCount % 2 === 0) this.meteors.forEach(s => s.draw(ctx, nf, sy));
    ctx.restore();

    // ── 4. SUN + MOON ─────────────────────────────────────────────────────
    this.bodies.draw(ctx, nf, sy, this.globalT);

    // ── 5. DISTANT UNDERWATER HILLS ───────────────────────────────────────
    this.mounts.draw(ctx, nf, H - this.floor.sandHeight);

    // ── 6. WATER BODY ─────────────────────────────────────────────────────
    // Day: bright vivid cyan-blue. Night: deep blue-navy.
    // Reference shows water is NOT dark — upper portion almost white-cyan.
    // Murky desaturated grey-green when error flash fires
    const FLASH_WATER = ['#1E2820','#18221A','#121A14','#0C1210'];

    // Water: layered ocean depth — bright aqua surface, deep sapphire below
    // Each layer slightly darker/cooler to give magical depth gradient
    const WC = [
      { d: ['#2AA8E0','#1A88C8','#0E68A8','#084E88'], n: ['#0E3870','#0A2858','#061A44','#03102E'] },
      { d: ['#1898D0','#1078B8','#0A589A','#073E7A'], n: ['#0C2E60','#08204E','#05143C','#030B28'] },
      { d: ['#1088C0','#0A68A8','#074A8A','#053468'], n: ['#0A2450','#071840','#04102E','#02081E'] },
    ];

    // Wave pts: rebuild every 80ms (not every frame)
    const ptsTick = Math.round(t / 80) * 80;
    if (ptsTick !== this._wPtsTick) {
      this._wPts[0] = this.wave.buildPts(0, t, this.waveAmp, 8);
      this._wPts[1] = this.wave.buildPts(1, t, this.waveAmp, 14);
      this._wPts[2] = this.wave.buildPts(2, t, this.waveAmp, 14);
      this._wPtsTick = ptsTick;
    }

    // Water gradients: rebuild only when nf/efEase bucket changes
    const wGradKey = Math.round(nf / 0.04) * 100 + Math.round(efEase / 0.06);
    if (wGradKey !== this._wGradKey) {
      this._wGradKey  = wGradKey;
      this._waveOffTick = -2;  // force wave offscreen rebuild on next frame
      for (let li = 0; li < 3; li++) {
        const lc   = WC[li];
        const midY = this._wPts[li].length > 0
          ? this._wPts[li][Math.floor(this._wPts[li].length / 2)].y
          : H * 0.42;
        const wg = ctx.createLinearGradient(0, midY, 0, H);
        wg.addColorStop(0,    lerpColor(lerpColor(lc.d[0], lc.n[0], nf), FLASH_WATER[0], efEase));
        wg.addColorStop(0.18, lerpColor(lerpColor(lc.d[1], lc.n[1], nf), FLASH_WATER[1], efEase));
        wg.addColorStop(0.55, lerpColor(lerpColor(lc.d[2], lc.n[2], nf), FLASH_WATER[2], efEase));
        wg.addColorStop(1,    lerpColor(lerpColor(lc.d[3], lc.n[3], nf), FLASH_WATER[3], efEase));
        this._wGrad[li] = wg;
      }
    }

    // Wave body + crests — offscreen canvas rebuilt every 80ms
    if (!this._waveOff && typeof document !== 'undefined') {
      this._waveOff    = document.createElement('canvas');
      this._waveOff.width  = W;
      this._waveOff.height = H;
      this._waveOffCtx = this._waveOff.getContext('2d');
    }
    if (ptsTick !== this._waveOffTick && this._waveOffCtx) {
      this._waveOffTick = ptsTick;
      const wc = this._waveOffCtx;
      wc.clearRect(0, 0, W, H);
      for (let layer = 2; layer >= 0; layer--) {
        const pts = this._wPts[layer];
        const wg  = this._wGrad[layer];
        if (!pts || pts.length === 0 || !wg) continue;
        // Body fill — lineTo only (faster than quadraticCurveTo)
        wc.beginPath();
        wc.moveTo(0, H); wc.lineTo(0, pts[0].y);
        for (let i = 1; i < pts.length; i++) wc.lineTo(pts[i].x, pts[i].y);
        wc.lineTo(pts[pts.length-1].x, H);
        wc.closePath();
        wc.fillStyle = wg; wc.fill();
        // Crest highlight — only front layer
        if (layer === 0) {
          wc.beginPath(); wc.moveTo(0, pts[0].y);
          for (let i = 1; i < pts.length; i++) wc.lineTo(pts[i].x, pts[i].y);
          wc.strokeStyle = `rgba(255,255,255,${0.42 - nf * 0.30})`;
          wc.lineWidth = 2.2; wc.stroke();
        }
      }
    }
    if (this._waveOff) ctx.drawImage(this._waveOff, 0, 0)

    // ── 7. SURFACE SHIMMER (day) ───────────────────────────────────────────
    // Surface shimmer: only daytime, every 4th frame, no radialGradients
    if (nf < 0.35 && this.frameCount % 4 === 0) {
      const gA   = (1 - nf / 0.35) * 0.12;
      const gPts = this._wPts[0];  // reuse already-built pts
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = gA;
      for (let i = 0; i < 12; i++) {
        const gx  = (W / 12) * i + Math.sin(t * 0.00070 + i * 0.88) * 22;
        const idx = clamp(Math.round(gx * gPts.length / W), 0, gPts.length - 1);
        const gy  = gPts[idx]?.y ?? sy;
        const gw  = 3 + Math.abs(Math.sin(t * 0.00120 + i * 0.65)) * 10;
        ctx.fillStyle = `rgba(210,248,255,0.55)`;
        ctx.beginPath();
        ctx.ellipse(gx, gy, gw, gw * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ── 8. GOD RAYS ───────────────────────────────────────────────────────
    // God rays: offscreen canvas, re-render every 3rd frame or when nf changes
    if (!this.raysOff && typeof document !== 'undefined') {
      this.raysOff = document.createElement('canvas');
      this.raysOff.width = W; this.raysOff.height = H;
      this.raysOffCtx = this.raysOff.getContext('2d');
    }
    if (this.raysStale || this.frameCount % 3 === 0) {
      if (this.raysOffCtx) {
        this.raysOffCtx.clearRect(0, 0, W, H);
        this.rays.draw(this.raysOffCtx, nf, this.wave, this.waveAmp, t, this.pressureSmooth, this.relaxTimer);
        this.raysStale = false;
      } else {
        this.rays.draw(ctx, nf, this.wave, this.waveAmp, t, this.pressureSmooth, this.relaxTimer);
      }
    }
    if (this.raysOff) ctx.drawImage(this.raysOff, 0, 0);

    // ── 9. BACKGROUND SILHOUETTE PLANTS ───────────────────────────────────
    // Draw AFTER god rays so silhouettes cast into the lit water naturally
    // Silhouettes barely visible in bright day — skip every 2nd frame then
    if (nf > 0.18 || this.frameCount % 2 === 0) {
      this.sils.draw(ctx, H - this.floor.sandHeight, nf, t);
    }

    // ── 10. UNDERWATER PARTICLES ──────────────────────────────────────────
    ctx.save();
    ctx.beginPath(); ctx.rect(0, sy + 1, W, H - sy - 1); ctx.clip();
    // Relaxation resonance glow — decays smoothly over 1.2 s
    const relaxGlow = clamp(this.relaxTimer / 1200, 0, 1) * clamp(this.relaxTimer / 1200, 0, 1);
    if (this.frameCount % 2 === 0) this.snow.forEach(s => s.draw(ctx, relaxGlow));
    if (this.frameCount % 2 === 0) {
      this.plankton.forEach(p => p.draw(ctx, nf, this.hyperFlow));
    }
    this.activeBubbles.forEach(b => b.draw(ctx));
    ctx.restore();

    // ── 10b. AMBIENT FAUNA
    this.fauna.draw(ctx, nf, t);

    // ── 11. SEAFLOOR ──────────────────────────────────────────────────────
    this.floor.draw(ctx, nf, t);

    // ── 11b. SILT CLOUD ───────────────────────────────────────────────────
    if (this.frameCount % 2 === 0) { for (const sp of this.siltParticles) sp.draw(ctx); }

    // ── 11c. FATIGUE SILT STORM OVERLAY ──────────────────────────────────
    // As silt builds up, the lower third of the water turns murky brown
    if (this.siltDensity > 0.02) {
      const murkTop    = H * 0.55;   // storm starts at mid-screen
      const murkBottom = H;
      const murkAlpha  = this.siltDensity * 0.52;

      const murkDensBkt = Math.round(this.siltDensity / 0.05) * 0.05;
      if (!this.cachedMurkGrad || murkDensBkt !== this.cachedMurkDens) {
        this.cachedMurkDens = murkDensBkt;
        const murkG = ctx.createLinearGradient(0, murkTop, 0, murkBottom);
        murkG.addColorStop(0,    `rgba(0,0,0,0)`);
        murkG.addColorStop(0.25, `rgba(62,38,12,${murkAlpha * 0.35})`);
        murkG.addColorStop(0.65, `rgba(80,48,14,${murkAlpha * 0.72})`);
        murkG.addColorStop(1,    `rgba(90,52,12,${murkAlpha})`);
        this.cachedMurkGrad = murkG;
      }
      ctx.fillStyle = this.cachedMurkGrad;
      ctx.fillRect(0, murkTop, W, murkBottom - murkTop);

      // Fine suspended silt texture — horizontal streaks
      if (this.siltDensity > 0.3) {
        ctx.save();
        ctx.globalAlpha = (this.siltDensity - 0.3) * 0.55;
        ctx.fillStyle   = 'rgba(95,58,18,0.18)';
        for (let yi = 0; yi < 6; yi++) {
          const sy2 = murkTop + (yi / 5) * (H - murkTop);
          const wx  = W * (0.5 + Math.sin(t * 0.00082 + yi * 1.4) * 0.45);
          ctx.fillRect(0, sy2, wx, 1.5);
        }
        ctx.restore();
      }
    }

    // ── 12. DEPTH VIGNETTE (subtle — doesn't dominate like before) ────────
    // Only darken the very bottom corners and edges — not the whole frame
    if (!this.cachedVigGrad) {
      const vig = ctx.createRadialGradient(W/2, H*0.65, H*0.16, W/2, H*0.65, H*0.78);
      vig.addColorStop(0,    'rgba(0,0,0,0)');
      vig.addColorStop(0.60, 'rgba(0,0,0,0)');
      vig.addColorStop(1,    `rgba(0,8,25,${0.14 + nf * 0.14})`);
      this.cachedVigGrad = vig;
    }
    if (nf > 0.25) {
      ctx.fillStyle = this.cachedVigGrad;
      ctx.fillRect(0, 0, W, H);
    }

    // Bottom edge — cache by nf bucket
    const bdgNfBkt = Math.round(nf / 0.08) * 0.08;
    if (!this.cachedBdgGrad || bdgNfBkt !== this.cachedBdgNf) {
      this.cachedBdgNf  = bdgNfBkt;
      const bdg = ctx.createLinearGradient(0, H * 0.72, 0, H);
      bdg.addColorStop(0, 'rgba(0,0,0,0)');
      bdg.addColorStop(1, `rgba(0,5,18,${0.16 + nf * 0.14})`);
      this.cachedBdgGrad = bdg;
    }
    if (nf > 0.20) {
      ctx.fillStyle = this.cachedBdgGrad;
      ctx.fillRect(0, H * 0.72, W, H * 0.28);
    }

    // ── ERROR FLASH edge burst — dark red-brown shockwave at screen perimeter
    if (efEase > 0.01) {
      // Edge flash: 4 rects darkening screen edges — no radialGradient needed
      const ea = efEase * 0.55;
      const eb = ea * 0.4;
      const ew = W * 0.18, eh = H * 0.18;
      ctx.fillStyle = `rgba(28,8,10,${ea})`;
      ctx.fillRect(0,     0,     W,  eh);        // top
      ctx.fillRect(0,     H-eh,  W,  eh);        // bottom
      ctx.fillRect(0,     0,     ew, H);          // left
      ctx.fillRect(W-ew,  0,     ew, H);          // right
      ctx.fillStyle = `rgba(30,28,28,${efEase * 0.18})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}