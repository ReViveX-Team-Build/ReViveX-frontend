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
    ctx:  CanvasRenderingContext2D,
    nf:   number,
    wave: WaveEngine,
    amp:  number,
    t:    number
  ) {
    if (nf >= 0.82) return; // no god rays at night
    // Bright in day (nf≈0), fades at dusk
    const dayFactor = 1 - nf / 0.82;
    const baseAlpha = dayFactor * 0.13;
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

      // Slow horizontal drift — beams sweep gently
      const drift = Math.sin(t * 0.00028 + this.phase[ri]) * 60
                  + Math.cos(t * 0.00042 + this.phase[ri] * 1.3) * 30;

      // Ray reaches about 80% down the water column
      const rayLen = (this.H - yTop) * 0.82;
      const xBot   = xTop + drift;
      const halfW  = this.widths[ri];

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
  private shapes: SilShape[] = [];
  private scrollX = 0;

  constructor(private W: number, private H: number) {
    this.generate();
  }

  private generate() {
    // Place 14 shapes spread across 2× viewport width for seamless scrolling
    for (let i = 0; i < 18; i++) {
      const x    = (i / 18) * this.W * 2.2 + Math.random() * 80;
      const type = ['fan', 'branch', 'bulb', 'reed'][Math.floor(Math.random() * 4)] as SilType;
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
    this.scrollX += scrollSpeed * 0.35; // parallax: slower than foreground
  }

  draw(ctx: CanvasRenderingContext2D, sandY: number, nf: number, t: number) {
    const wrap = this.W * 2.2;
    for (const s of this.shapes) {
      const sx = ((s.x - this.scrollX) % wrap + wrap) % wrap - 80;
      if (sx < -200 || sx > this.W + 200) continue;

      // Sway
      const sway = Math.sin(t * s.speed + s.phase) * 4 * s.scale;

      ctx.save();
      ctx.translate(sx, sandY);
      ctx.globalAlpha = s.alpha * (1 - nf * 0.55);

      // Dark blue-teal silhouette colour (darkens slightly at night)
      const dayC  = `rgba(28,68,118,1)`;
      const nightC= `rgba(8,20,45,1)`;
      const col   = lerpColor('#1C4476', '#08142D', nf * 0.7);

      this.drawShape(ctx, s.type, s.scale, sway, col);
      ctx.restore();
    }
  }

  private drawShape(
    ctx:   CanvasRenderingContext2D,
    type:  SilType,
    scale: number,
    sway:  number,
    color: string
  ) {
    ctx.fillStyle   = color;
    ctx.strokeStyle = color;

    switch (type) {
      case 'fan': {
        // Wide fan coral — arcing branches from a central stem
        const h = 90 * scale, w = 60 * scale;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(sway * 0.3, -h * 0.45);

        // Fan arc — many ribs spread from top of stem
        for (let i = 0; i <= 8; i++) {
          const ang = -Math.PI * 0.85 + (i / 8) * Math.PI * 0.85;
          const rx  = Math.cos(ang) * w + sway;
          const ry  = -h * 0.45 + Math.sin(ang) * h * 0.55;
          const t0x = sway * 0.3 + (rx - sway * 0.3) * 0.35;
          const t0y = -h * 0.45 + (ry + h * 0.45) * 0.35;
          ctx.beginPath();
          ctx.moveTo(sway * 0.3, -h * 0.45);
          ctx.quadraticCurveTo(t0x, t0y, rx, ry);
          ctx.lineWidth = Math.max(1.5, (4 - i * 0.3) * scale);
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        // Stem
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(sway * 0.3, -h * 0.45);
        ctx.lineWidth = 4 * scale; ctx.lineCap = 'round'; ctx.stroke();
        break;
      }

      case 'branch': {
        // Branching seaweed — recursive arms
        const h = 110 * scale;
        ctx.lineWidth = 3.5 * scale; ctx.lineCap = 'round';
        this.drawSilBranch(ctx, 0, 0, -Math.PI / 2, h * 0.40, 4, sway * 0.01);
        break;
      }

      case 'bulb': {
        // Rounded bulb coral with tentacle-like arms
        const r = 22 * scale;
        ctx.beginPath();
        ctx.arc(sway * 0.5, -r, r, 0, Math.PI * 2);
        ctx.fill();
        // Arms radiating upward
        for (let i = 0; i < 5; i++) {
          const ang = -Math.PI * 0.9 + (i / 4) * Math.PI * 0.9;
          const ex  = sway + Math.cos(ang) * r * 1.8;
          const ey  = -r   + Math.sin(ang) * r * 1.8;
          ctx.beginPath();
          ctx.moveTo(sway * 0.5, -r);
          ctx.lineTo(ex, ey);
          ctx.lineWidth = 2 * scale; ctx.stroke();
          ctx.beginPath();
          ctx.arc(ex, ey, 4 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
        // Short stem
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(sway * 0.5, -r);
        ctx.lineWidth = 3.5 * scale; ctx.stroke();
        break;
      }

      case 'reed': {
        // Tall thin reed / seagrass blades
        const h = 100 * scale;
        for (let i = 0; i < 3; i++) {
          const ox = (i - 1) * 12 * scale;
          const bx = ox;
          const tx = ox + sway * (0.5 + i * 0.2);
          ctx.beginPath();
          ctx.moveTo(bx, 0);
          ctx.quadraticCurveTo(bx + sway * 0.4, -h * 0.55, tx, -h * (0.75 + i * 0.08));
          ctx.lineWidth = (3 - i * 0.5) * scale; ctx.lineCap = 'round'; ctx.stroke();
        }
        break;
      }
    }
  }

  private drawSilBranch(
    ctx:   CanvasRenderingContext2D,
    x:     number, y: number,
    angle: number,
    len:   number,
    depth: number,
    sway:  number
  ) {
    if (depth <= 0 || len < 5) return;
    const ex    = x + Math.cos(angle + sway) * len;
    const ey    = y + Math.sin(angle + sway) * len;
    const thick = Math.max(0.8, depth * 1.6);
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(ex, ey);
    ctx.lineWidth = thick; ctx.stroke();
    const spread = 0.42 + depth * 0.04;
    const next   = len * 0.60;
    this.drawSilBranch(ctx, ex, ey, angle - spread, next, depth - 1, sway * 0.7);
    this.drawSilBranch(ctx, ex, ey, angle + spread, next, depth - 1, sway * 0.7);
    if (depth >= 3) {
      this.drawSilBranch(ctx, ex, ey, angle, next * 0.72, depth - 1, sway * 0.45);
    }
  }
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
  constructor(private W: number, private H: number) {}

  private arcXY(prog: number, surfY: number): { x: number; y: number } {
    const angle = prog * Math.PI;
    const arcW  = this.W * 0.82;
    const arcH  = surfY * 0.80;
    const cx    = this.W * 0.50;
    return {
      x: cx + Math.cos(Math.PI - angle) * (arcW / 2),
      y: surfY + 6 - Math.sin(angle) * arcH,
    };
  }

  draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number, globalT: number) {
    const SUN_WIN = 0.48;
    if (globalT <= SUN_WIN) {
      const sunProg = clamp(globalT / SUN_WIN, 0, 1);
      const pos     = this.arcXY(sunProg, surfY);
      const dipAlpha = clamp(1 - (pos.y - surfY - 10) / 110, 0, 1);
      if (dipAlpha > 0.005) this._drawSun(ctx, pos.x, pos.y, dipAlpha, nf, surfY);
    }

    const MOON_START = 0.46, MOON_END = 0.97;
    if (globalT >= MOON_START && globalT <= MOON_END) {
      const moonProg = clamp((globalT - MOON_START) / (MOON_END - MOON_START), 0, 1);
      const pos      = this.arcXY(1 - moonProg, surfY);
      const dipAlpha = clamp(1 - (pos.y - surfY - 10) / 110, 0, 1);
      const moonA    = dipAlpha * smoothstep(0.0, 0.08, moonProg);
      if (moonA > 0.005) this._drawMoon(ctx, pos.x, pos.y, moonA, surfY, globalT);
    }
  }

  private _drawSun(
    ctx: CanvasRenderingContext2D,
    sx: number, sy: number, a: number,
    nf: number, surfY: number
  ) {
    const R = Math.min(this.W, this.H) * 0.044;
    ctx.save();
    ctx.globalAlpha = a;
    const bloomR = R * 5.0;
    const bloom  = ctx.createRadialGradient(sx, sy, R * 0.5, sx, sy, bloomR);
    bloom.addColorStop(0,   'rgba(255,240,120,0.28)');
    bloom.addColorStop(0.4, 'rgba(255,200,60,0.09)');
    bloom.addColorStop(1,   'rgba(255,130,0,0)');
    ctx.beginPath(); ctx.arc(sx, sy, bloomR, 0, Math.PI * 2);
    ctx.fillStyle = bloom; ctx.fill();
    const disc = ctx.createRadialGradient(sx - R * 0.15, sy - R * 0.15, 0, sx, sy, R);
    disc.addColorStop(0,   '#FFFFFF');
    disc.addColorStop(0.4, '#FFEA70');
    disc.addColorStop(1,   '#FFB800');
    ctx.shadowBlur  = 28; ctx.shadowColor = 'rgba(255,185,0,0.75)';
    ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI * 2);
    ctx.fillStyle = disc; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private _drawMoon(
    ctx: CanvasRenderingContext2D,
    mx: number, my: number, a: number,
    surfY: number, t: number
  ) {
    const R = Math.min(this.W, this.H) * 0.046;
    ctx.save(); ctx.globalAlpha = a;
    const halo = ctx.createRadialGradient(mx, my, R, mx, my, R * 5);
    halo.addColorStop(0,   'rgba(200,225,255,0.14)');
    halo.addColorStop(0.5, 'rgba(180,210,255,0.04)');
    halo.addColorStop(1,   'rgba(160,195,255,0)');
    ctx.beginPath(); ctx.arc(mx, my, R * 5, 0, Math.PI * 2);
    ctx.fillStyle = halo; ctx.fill();
    const disc = ctx.createRadialGradient(mx - R * 0.18, my - R * 0.16, 0, mx, my, R);
    disc.addColorStop(0,   '#FFFFFF');
    disc.addColorStop(0.40,'#F4F8FF');
    disc.addColorStop(0.78,'#E2EEFF');
    disc.addColorStop(1,   '#C8DAFF');
    ctx.shadowBlur = 24; ctx.shadowColor = 'rgba(200,225,255,0.78)';
    ctx.beginPath(); ctx.arc(mx, my, R, 0, Math.PI * 2);
    ctx.fillStyle = disc; ctx.fill();
    ctx.shadowBlur = 0;

    // Water reflection
    if (my < surfY - R) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const frac = i / 5;
        const yy   = surfY + 4 + R * 4.5 * frac;
        const wig  = Math.sin(yy * 0.038 + t * 0.00072) * R * 0.42;
        const cW   = R * 1.7 * (1 - frac * 0.78);
        const rowA = a * 0.12 * (1 - frac * 0.85);
        const rg   = ctx.createLinearGradient(mx + wig - cW, yy, mx + wig + cW, yy);
        rg.addColorStop(0,    'rgba(210,230,255,0)');
        rg.addColorStop(0.45, `rgba(210,230,255,${rowA})`);
        rg.addColorStop(0.55, `rgba(210,230,255,${rowA})`);
        rg.addColorStop(1,    'rgba(210,230,255,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(mx + wig - cW, yy, cW * 2, R * 0.85);
      }
      ctx.restore();
    }
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  STARS
// ═══════════════════════════════════════════════════════════════════════════
class Star {
  x: number; y: number; r: number; phase: number; bright: number; rgb: string;
  constructor(W: number, H: number) {
    this.x = Math.random() * W; this.y = Math.random() * H * 0.36;
    this.r = 0.3 + Math.random() * 1.4; this.phase = Math.random() * Math.PI * 2;
    this.bright = 0.35 + Math.random() * 0.65;
    const t = Math.random();
    this.rgb = t > 0.65 ? '255,238,200' : t > 0.35 ? '255,255,242' : '200,218,255';
  }
  draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number) {
    if (this.y >= surfY - 2 || nf < 0.55) return;
    const darkF = smoothstep(0.55, 0.90, nf);
    const tw    = 0.5 + Math.sin(Date.now() * 0.00165 + this.phase) * 0.50;
    const a     = clamp(tw * this.bright * darkF, 0, 1);
    if (a < 0.01) return;
    ctx.fillStyle = `rgba(${this.rgb},${a})`;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
  }
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
class Aurora {
  ph = 0;
  constructor(private W: number) {}
  tick() { this.ph += 0.0013; }
  draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number) {
    if (nf < 0.62) return;
    const a = (nf - 0.62) * 0.13;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let b = 0; b < 3; b++) {
      const yBase = surfY * (0.07 + b * 0.09);
      const hue   = [162, 188, 142][b];
      const bH    = surfY * 0.13;
      const g     = ctx.createLinearGradient(0, yBase, 0, yBase + bH);
      g.addColorStop(0,    `hsla(${hue},80%,58%,0)`);
      g.addColorStop(0.44, `hsla(${hue},80%,58%,${a * (1 - b * 0.28)})`);
      g.addColorStop(1,    `hsla(${hue},80%,58%,0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, yBase);
      for (let x = 0; x <= this.W; x += 22) {
        const y = yBase
          + Math.sin(x * 0.0052 + this.ph + b * 1.5) * 18
          + Math.sin(x * 0.0118 + this.ph * 1.8 + b) * 8;
        ctx.lineTo(x, Math.min(y, surfY - 4));
      }
      ctx.lineTo(this.W, yBase + bH); ctx.lineTo(0, yBase + bH); ctx.fill();
    }
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  UNDERWATER BUBBLES — cartoon-style, round with inner glint
// ═══════════════════════════════════════════════════════════════════════════
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
  update(scrollSpeed: number) {
    this.phase += 0.034;
    this.x     += this.vx + Math.sin(this.phase) * 0.16 - scrollSpeed * 0.80;
    this.y     += this.vy;
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
  constructor(private W: number, private H: number) { this.reset(H * 0.7); }
  reset(surfY: number) {
    this.x     = Math.random() * this.W;
    this.y     = surfY + Math.random() * (this.H - surfY) * 0.90;
    this.vx    = (Math.random() - 0.5) * 0.12;
    this.vy    = (Math.random() - 0.5) * 0.09 - 0.02;
    this.r     = 0.5 + Math.random() * 1.2;
    this.phase = Math.random() * Math.PI * 2;
    this.hue   = [172, 188, 158, 202][Math.floor(Math.random() * 4)];
  }
  update(surfY: number, scrollSpeed: number) {
    this.phase += 0.020;
    this.x     += this.vx - scrollSpeed * 0.38;
    this.y     += this.vy;
    if (this.x < 0) this.x += this.W;
    if (this.x > this.W) this.x -= this.W;
    if (this.y < surfY + 32 || this.y > this.H) this.reset(surfY);
  }
  draw(ctx: CanvasRenderingContext2D, nf: number) {
    const a = (0.20 + Math.sin(this.phase) * 0.80) * (0.04 + nf * 0.16);
    if (a < 0.006) return;
    const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4.5);
    grd.addColorStop(0, `hsla(${this.hue},88%,62%,${a})`);
    grd.addColorStop(1, `hsla(${this.hue},68%,42%,0)`);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 4.5, 0, Math.PI * 2);
    ctx.fillStyle = grd; ctx.fill();
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
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = `rgba(195,235,248,${this.alpha})`;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SEA FLOOR — warm golden sand matching reference image
//  Reference: bright sandy yellow #D4A03C, NOT dark brown.
//  Texture: subtle circular dimple dots baked into an offscreen canvas.
//  Edge: organic wavy line with warm highlight on top.
// ═══════════════════════════════════════════════════════════════════════════
class SeaFloor {
  sandHeight = 80; targetHeight = 80;
  private tex: HTMLCanvasElement | null = null;
  private scrollX = 0;

  constructor(private W: number, private H: number) {
    this.tex = this._buildSandTex();
  }

  // Offscreen sand texture: warm grain + darker circular dimples
  private _buildSandTex(): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    if (!ctx) return null;

    // Base fill: mid-sand tone
    ctx.fillStyle = '#C8922A';
    ctx.fillRect(0, 0, 512, 256);

    // Fine grain streaks
    for (let i = 0; i < 2200; i++) {
      ctx.fillStyle = `hsla(${32 + Math.random() * 18},${48 + Math.random() * 20}%,${40 + Math.random() * 28}%,${0.04 + Math.random() * 0.07})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 256, 2 + Math.random() * 3, 1);
    }

    // Circular dimples matching reference image dots
    for (let i = 0; i < 90; i++) {
      const dx  = Math.random() * 512;
      const dy  = Math.random() * 256;
      const dr  = 2.5 + Math.random() * 5;
      const dg  = ctx.createRadialGradient(dx, dy, 0, dx, dy, dr);
      dg.addColorStop(0,   'rgba(100,65,10,0.28)');
      dg.addColorStop(0.6, 'rgba(120,78,15,0.12)');
      dg.addColorStop(1,   'rgba(130,85,18,0)');
      ctx.beginPath(); ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fillStyle = dg; ctx.fill();
    }

    return c;
  }

  update(gameTime: number, scrollSpeed: number) {
    this.scrollX += scrollSpeed;
    if (Math.floor(gameTime / 10000) % 3 === 0)
      this.targetHeight = Math.min(220, 80 + gameTime / 2200);
    else
      this.targetHeight = Math.max(80, this.targetHeight - 0.12);
    this.sandHeight += (this.targetHeight - this.sandHeight) * 0.008;
  }

  draw(ctx: CanvasRenderingContext2D, nf: number, t: number) {
    const W = this.W, H = this.H;
    const baseY = H - this.sandHeight;
    const step  = 8;

    // Sample wavy sand surface
    const bumps: number[] = [];
    for (let xi = 0; xi <= W + step; xi += step) {
      const rx = xi + this.scrollX;
      bumps.push(
        Math.sin(rx * 0.010) * 10
        + Math.cos(rx * 0.038) * 4
        + Math.sin(rx * 0.085 + t * 0.0004) * 2
        + vnoise(rx * 0.004  + t * 0.00007) * 3.5
      );
    }

    // ── SAND BODY ────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, baseY + bumps[0]);
    for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i]);
    ctx.lineTo(W, H);
    ctx.closePath();

    // Day: warm golden sand. Night: same but darker/cooler.
    const g = ctx.createLinearGradient(0, baseY, 0, H);
    g.addColorStop(0,    lerpColor('#D4A03C', '#4A3210', nf * 0.85)); // bright golden → dark
    g.addColorStop(0.18, lerpColor('#C08828', '#3A2808', nf * 0.85));
    g.addColorStop(0.55, lerpColor('#A87020', '#2C1E06', nf * 0.85));
    g.addColorStop(1,    lerpColor('#8A5818', '#1A1004', nf * 0.85));
    ctx.fillStyle = g;
    ctx.fill();

    // ── SAND TEXTURE OVERLAY ──────────────────────────────────────────
    if (this.tex) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, baseY + bumps[0]);
      for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i]);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.clip();
      const pat = ctx.createPattern(this.tex, 'repeat');
      if (pat) {
        ctx.save();
        ctx.translate(-(this.scrollX % 512), baseY);
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.55;
        ctx.fillStyle   = pat;
        ctx.fillRect(0, 0, W + 512, this.sandHeight + 20);
        ctx.restore();
      }
      ctx.restore();
    }

    // ── SAND SURFACE HIGHLIGHT LINE ───────────────────────────────────
    // Bright warm highlight right at the top edge of sand — reference shows this clearly
    ctx.beginPath();
    ctx.moveTo(0, baseY + bumps[0]);
    for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i]);
    ctx.strokeStyle = `rgba(240,185,75,${0.58 - nf * 0.45})`;  // warm gold highlight
    ctx.lineWidth   = 2.5;
    ctx.stroke();

    // Soft shadow just below highlight (depth)
    ctx.beginPath();
    ctx.moveTo(0, baseY + bumps[0] + 4);
    for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i] + 4);
    ctx.strokeStyle = `rgba(80,45,8,${0.18 + nf * 0.12})`;
    ctx.lineWidth   = 3.0;
    ctx.stroke();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  DISTANT MOUNTAINS / UNDERWATER HILLS
// ═══════════════════════════════════════════════════════════════════════════
class DistantMountains {
  private scrollX = 0;
  constructor(private W: number, private H: number) {}
  update(speed: number) { this.scrollX += speed * 0.15; }
  draw(ctx: CanvasRenderingContext2D, nf: number, baseY: number) {
    // Day: medium blue silhouette. Night: very dark.
    const col = lerpColor('rgba(18,72,145,0.38)', 'rgba(4,12,32,0.52)', nf);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, this.H);
    for (let x = 0; x <= this.W; x += 18) {
      const rx = x + this.scrollX;
      const y  = baseY - 55
        + Math.sin(rx * 0.0018) * 70
        + Math.cos(rx * 0.0048) * 24
        + Math.sin(rx * 0.0108) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.W, this.H);
    ctx.fill();
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
  private sils:    BackgroundSilhouettes;
  private stars:   Star[];
  private meteors: ShootingStar[];
  private bubblePool:    Bubble[];
  private activeBubbles: Bubble[] = [];
  private plankton:      Plankton[];
  private snow:          MarineSnow[];

  private bubTimer = 0;
  private metTimer = 0;
  private surfY    = 0;
  private waveAmp  = 24;
  private wallT    = 0;
  private globalT  = 0;

  get sandHeight(): number { return this.floor.sandHeight; }

  constructor(W: number, H: number) {
    this.gameWidth  = W;
    this.gameHeight = H;
    this.wave   = new WaveEngine(W, H);
    this.floor  = new SeaFloor(W, H);
    this.mounts = new DistantMountains(W, H);
    this.bodies = new CelestialBodies(W, H);
    this.rays   = new GodRays(W, H);
    this.aurora = new Aurora(W);
    this.sils   = new BackgroundSilhouettes(W, H);
    this.stars   = Array.from({ length: 88 }, () => new Star(W, H));
    this.meteors = Array.from({ length: 3  }, () => new ShootingStar(W));
    this.bubblePool = Array.from({ length: 28 }, () => new Bubble(W, H));
    this.plankton   = Array.from({ length: 38 }, () => new Plankton(W, H));
    this.snow       = Array.from({ length: 44 }, () => new MarineSnow(W, H));
  }

  // ─────────────────────────────────────────────────────────────────────────
  update(gameTime: number, delta: number, scrollSpeed: number): number {
    const C = 180_000; // 3-minute cycle
    this.globalT = ((gameTime % C) / C + 0.24) % 1.0;

    const SUN_WIN  = 0.48;
    const sunProg  = clamp(this.globalT / SUN_WIN, 0, 1);
    const sunH     = Math.sin(sunProg * Math.PI);
    let nf: number;
    if (this.globalT <= SUN_WIN) {
      nf = 1 - smoothstep(0.02, 0.28, sunH);
    } else {
      nf = 1;
    }

    this.wallT = Date.now();
    const diff = clamp((this.floor.sandHeight - 80) / 140, 0, 1);
    this.waveAmp = Math.max(12, 28 * (1 - diff * 0.42));

    this.floor.update(gameTime, scrollSpeed);
    this.mounts.update(scrollSpeed);
    this.sils.update(scrollSpeed);
    this.wave.scroll(scrollSpeed * 0.78);
    this.surfY = this.wave.surfaceY(this.gameWidth / 2, this.wallT, this.waveAmp);
    this.aurora.tick();

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
      b.update(scrollSpeed);
      if (b.y <= this.surfY + 2) { b.active = false; return false; }
      return true;
    });

    this.plankton.forEach(p => p.update(this.surfY, scrollSpeed));
    this.snow.forEach(s => s.update(this.surfY, scrollSpeed));

    return nf;
  }

  // ─────────────────────────────────────────────────────────────────────────
  draw(ctx: CanvasRenderingContext2D, nf: number): void {
    const W = this.gameWidth, H = this.gameHeight;
    const t = this.wallT, sy = this.surfY;

    // ── 1. SKY ────────────────────────────────────────────────────────────
    // Day: near-white cyan at top → bright sky blue at horizon
    // Night: deep navy
    const sky = ctx.createLinearGradient(0, 0, 0, sy);
    sky.addColorStop(0,    lerpColor('#8EC8E8', '#08101E', nf));  // upper sky
    sky.addColorStop(0.35, lerpColor('#AADCF4', '#0C1E36', nf));  // mid sky
    sky.addColorStop(0.75, lerpColor('#C8EEF8', '#182848', nf));  // horizon glow
    sky.addColorStop(1,    lerpColor('#D8F4FC', '#1E3258', nf));  // just above water
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // ── 2. AURORA (night only) ─────────────────────────────────────────────
    this.aurora.draw(ctx, nf, sy);

    // ── 3. STARS + METEORS ────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, sy - 2); ctx.clip();
    this.stars.forEach(s => s.draw(ctx, nf, sy));
    this.meteors.forEach(s => s.draw(ctx, nf, sy));
    ctx.restore();

    // ── 4. SUN + MOON ─────────────────────────────────────────────────────
    this.bodies.draw(ctx, nf, sy, this.globalT);

    // ── 5. DISTANT UNDERWATER HILLS ───────────────────────────────────────
    this.mounts.draw(ctx, nf, H - this.floor.sandHeight);

    // ── 6. WATER BODY ─────────────────────────────────────────────────────
    // Day: bright vivid cyan-blue. Night: deep blue-navy.
    // Reference shows water is NOT dark — upper portion almost white-cyan.
    const WC = [
      // Front layer (most detailed)
      { d: ['#68C8E8','#40A8D0','#2888B8','#186898'], n: ['#1A5890','#103878','#0A2860','#061848'] },
      // Mid layer
      { d: ['#50B8DC','#3298C4','#1E78A8','#105888'], n: ['#144878','#0C3060','#082048','#051030'] },
      // Back layer
      { d: ['#3CA8D0','#2288B8','#1268A0','#0A4880'], n: ['#103870','#0A2858','#061840','#040E28'] },
    ];

    for (let layer = 2; layer >= 0; layer--) {
      const pts = this.wave.buildPts(layer, t, this.waveAmp, layer === 0 ? 8 : 14);
      const lc  = WC[layer];
      const midY = pts[Math.floor(pts.length / 2)].y;

      const wg = ctx.createLinearGradient(0, midY, 0, H);
      wg.addColorStop(0,    lerpColor(lc.d[0], lc.n[0], nf));
      wg.addColorStop(0.18, lerpColor(lc.d[1], lc.n[1], nf));
      wg.addColorStop(0.55, lerpColor(lc.d[2], lc.n[2], nf));
      wg.addColorStop(1,    lerpColor(lc.d[3], lc.n[3], nf));

      ctx.beginPath();
      ctx.moveTo(0, H); ctx.lineTo(0, pts[0].y);
      for (let i = 0; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      const lp = pts[pts.length - 1];
      ctx.lineTo(lp.x, lp.y); ctx.lineTo(lp.x, H);
      ctx.closePath();
      ctx.fillStyle = wg;
      ctx.fill();

      // Wave crest
      ctx.beginPath(); ctx.moveTo(0, pts[0].y);
      for (let i = 0; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      if (layer === 0) {
        // Main white foam crest
        ctx.strokeStyle = `rgba(255,255,255,${0.42 - nf * 0.30})`;
        ctx.lineWidth = 2.2; ctx.stroke();
        // Secondary softer line beneath
        ctx.beginPath(); ctx.moveTo(0, pts[0].y + 4);
        for (let i = 0; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2;
          const my = (pts[i].y + pts[i + 1].y) / 2 + 4;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y + 4, mx, my);
        }
        ctx.strokeStyle = `rgba(180,235,255,${0.18 - nf * 0.12})`;
        ctx.lineWidth = 1.0; ctx.stroke();
      } else {
        ctx.strokeStyle = `rgba(255,255,255,${(0.09 - layer * 0.025) * (1 - nf * 0.55)})`;
        ctx.lineWidth = 0.9; ctx.stroke();
      }
    }

    // ── 7. SURFACE SHIMMER (day) ───────────────────────────────────────────
    if (nf < 0.42) {
      const gA = (1 - nf / 0.42) * 0.14;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gPts = this.wave.buildPts(0, t, this.waveAmp, 18);
      for (let i = 0; i < 16; i++) {
        const gx  = (W / 16) * i + Math.sin(t * 0.00070 + i * 0.88) * 22;
        const idx = clamp(Math.round(gx * gPts.length / W), 0, gPts.length - 1);
        const gy  = gPts[idx].y;
        const gw  = 3 + Math.abs(Math.sin(t * 0.00120 + i * 0.65)) * 12;
        const sh  = ctx.createRadialGradient(gx, gy, 0, gx, gy, gw);
        sh.addColorStop(0,   `rgba(230,255,255,${gA * 1.4})`);
        sh.addColorStop(0.5, `rgba(155,225,248,${gA * 0.45})`);
        sh.addColorStop(1,   'rgba(90,195,225,0)');
        ctx.beginPath(); ctx.ellipse(gx, gy, gw, gw * 0.20, 0, 0, Math.PI * 2);
        ctx.fillStyle = sh; ctx.fill();
      }
      ctx.restore();
    }

    // ── 8. GOD RAYS ───────────────────────────────────────────────────────
    this.rays.draw(ctx, nf, this.wave, this.waveAmp, t);

    // ── 9. BACKGROUND SILHOUETTE PLANTS ───────────────────────────────────
    // Draw AFTER god rays so silhouettes cast into the lit water naturally
    this.sils.draw(ctx, H - this.floor.sandHeight, nf, t);

    // ── 10. UNDERWATER PARTICLES ──────────────────────────────────────────
    ctx.save();
    ctx.beginPath(); ctx.rect(0, sy + 1, W, H - sy - 1); ctx.clip();
    this.snow.forEach(s => s.draw(ctx));
    this.plankton.forEach(p => p.draw(ctx, nf));
    this.activeBubbles.forEach(b => b.draw(ctx));
    ctx.restore();

    // ── 11. SEAFLOOR ──────────────────────────────────────────────────────
    this.floor.draw(ctx, nf, t);

    // ── 12. DEPTH VIGNETTE (subtle — doesn't dominate like before) ────────
    // Only darken the very bottom corners and edges — not the whole frame
    const vig = ctx.createRadialGradient(W / 2, H * 0.65, H * 0.16, W / 2, H * 0.65, H * 0.78);
    vig.addColorStop(0,    'rgba(0,0,0,0)');
    vig.addColorStop(0.60, 'rgba(0,0,0,0)');
    vig.addColorStop(1,    `rgba(0,8,25,${0.14 + nf * 0.14})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    // Bottom edge darkening for sand depth
    const bdg = ctx.createLinearGradient(0, H * 0.72, 0, H);
    bdg.addColorStop(0, 'rgba(0,0,0,0)');
    bdg.addColorStop(1, `rgba(0,5,18,${0.16 + nf * 0.14})`);
    ctx.fillStyle = bdg;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);
  }
}