// ═══════════════════════════════════════════════════════════════════════════
//  SynapseBackground  v5  — Bug-free, Cinematic Ocean
//
//  ROOT CAUSE OF YELLOW RECTANGLE — FIXED:
//  Both the horizon glow and the sun shimmer were using ctx.scale(1, tiny)
//  to squash a circle into a flat "ellipse". Canvas renders this as a solid
//  rectangular bar because the coordinate transform flattens everything.
//  v5 replaces ALL ctx.scale gradient tricks with proper linear gradients.
//
//  All other issues fixed:
//  • Sun colour: smooth yellow→amber only in final descent, never harsh red
//  • Moon: only visible when sky is truly dark (nf > 0.60)
//  • Day/night: physically derived from sun height, perfectly in sync
//  • Waves: smoother bezier, better step sizes for performance
//  • God rays: clip path optimized, fewer gradient objects per frame
//  • Particle counts reduced for better framerate
// ═══════════════════════════════════════════════════════════════════════════

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

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

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
        { yFrac: 0.410, ampF: 1.00, speedF: 1.00, scrollF: 1.00 },
        { yFrac: 0.428, ampF: 0.62, speedF: 0.70, scrollF: 0.62 },
        { yFrac: 0.444, ampF: 0.38, speedF: 0.48, scrollF: 0.38 },
    ];

    constructor(private W: number, private H: number) { }

    scroll(speed: number) {
        for (let i = 0; i < 3; i++) {
            this.sx[i] -= speed * this.LAYER[i].scrollF;
            if (this.sx[i] < -this.W) this.sx[i] += this.W;
        }
    }

    layerY(layer: number, cx: number, t: number, amp: number): number {
        const L = this.LAYER[layer], rx = cx + this.sx[layer], sf = L.speedF, af = L.ampF;
        return this.H * L.yFrac
            + Math.sin(rx * 0.00420 + t * 0.000800 * sf) * amp * af * 0.90
            + Math.sin(rx * 0.00870 + t * 0.001380 * sf) * amp * af * 0.44
            + Math.sin(rx * 0.01740 + t * 0.002100 * sf) * amp * af * 0.20
            + Math.cos(rx * 0.02980 + t * 0.001650 * sf) * amp * af * 0.10
            + vnoise(rx * 0.004 + t * 0.00018 * sf) * amp * af * 0.10;
    }

    surfaceY(cx: number, t: number, amp: number): number {
        return this.layerY(0, cx, t, amp);
    }

    buildPts(layer: number, t: number, amp: number, step = 10): { x: number, y: number }[] {
        const pts: { x: number, y: number }[] = [];
        for (let x = 0; x <= this.W + step; x += step)
            pts.push({ x, y: this.layerY(layer, x, t, amp) });
        return pts;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  GOD RAYS
// ═══════════════════════════════════════════════════════════════════════════
class GodRays {
    private readonly anchors = [0.10, 0.24, 0.40, 0.56, 0.70, 0.84];
    private phase: number[];

    constructor(private W: number, private H: number) {
        this.phase = this.anchors.map(() => Math.random() * Math.PI * 2);
    }

    draw(ctx: CanvasRenderingContext2D, nf: number, wave: WaveEngine, amp: number, t: number) {
        if (nf >= 0.78) return;
        const alpha = (1 - nf / 0.78) * 0.048;
        if (alpha < 0.004) return;

        ctx.save();
        // Clip to underwater — sample every 20px for performance
        ctx.beginPath();
        for (let x = 0; x <= this.W; x += 20) {
            const sy = wave.surfaceY(x, t, amp);
            if (x === 0) ctx.moveTo(0, sy); else ctx.lineTo(x, sy);
        }
        ctx.lineTo(this.W, this.H); ctx.lineTo(0, this.H);
        ctx.closePath(); ctx.clip();
        ctx.globalCompositeOperation = 'lighter';

        for (let ri = 0; ri < this.anchors.length; ri++) {
            const xA = this.W * this.anchors[ri];
            const yTop = wave.surfaceY(xA, t, amp);
            const drift = Math.sin(t * 0.00035 + this.phase[ri]) * 52;
            const rayLen = (this.H - yTop) * 0.60;
            const xBot = xA + drift;
            const cpx = xA + drift * 0.5, cpy = yTop + rayLen * 0.52;

            const grad = ctx.createLinearGradient(xA, yTop, xBot, yTop + rayLen);
            grad.addColorStop(0,   `rgba(180,240,255,${alpha})`);
            grad.addColorStop(0.4, `rgba(140,215,255,${alpha * 0.50})`);
            grad.addColorStop(0.8, `rgba(100,185,240,${alpha * 0.14})`);
            grad.addColorStop(1,   'rgba(60,150,220,0)');

            ctx.beginPath();
            ctx.moveTo(xA - 7, yTop);
            ctx.quadraticCurveTo(cpx - 4, cpy, xBot - 38, yTop + rayLen);
            ctx.lineTo(xBot + 38, yTop + rayLen);
            ctx.quadraticCurveTo(cpx + 4, cpy, xA + 7, yTop);
            ctx.closePath();
            ctx.fillStyle = grad; ctx.fill();
        }
        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  CELESTIAL BODIES
// ═══════════════════════════════════════════════════════════════════════════
class CelestialBodies {
    constructor(private W: number, private H: number) { }

    // prog 0 = right horizon, 0.5 = zenith, 1 = left horizon
    private arcXY(prog: number, surfY: number): { x: number, y: number } {
        const angle = prog * Math.PI;
        const arcW = this.W * 0.82;
        const arcH = surfY * 0.80;
        const cx = this.W * 0.50;
        const baseY = surfY + 6; // graze the horizon naturally
        return {
            x: cx + Math.cos(Math.PI - angle) * (arcW / 2),
            y: baseY - Math.sin(angle) * arcH,
        };
    }

    draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number, globalT: number) {
        // ── SUN ─────────────────────────────────────────────────────────
        const SUN_WIN = 0.48;
        if (globalT <= SUN_WIN) {
            const sunProg = clamp(globalT / SUN_WIN, 0, 1);
            const pos = this.arcXY(sunProg, surfY);
            
            // FIX 1 APPLIED: Slower, smoother horizon fade for the Sun
            const dipAlpha = clamp(1 - (pos.y - surfY - 10) / 110, 0, 1);
            
            if (dipAlpha > 0.005) this._drawSun(ctx, pos.x, pos.y, dipAlpha, nf, surfY);
        }

        // ── MOON ─────────────────────────────────────────────────────────
        
        const MOON_START = 0.46; // Slightly before sun fully gone so handoff is seamless
        const MOON_END = 0.97;
        
        if (globalT >= MOON_START && globalT <= MOON_END) {
            const moonProg = clamp((globalT - MOON_START) / (MOON_END - MOON_START), 0, 1);
            const pos = this.arcXY(1 - moonProg, surfY);

            
            const dipAlpha = clamp(1 - (pos.y - surfY - 10) / 110, 0, 1);
            
            
            const moonA = dipAlpha * smoothstep(0.0, 0.08, moonProg);
            
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
        // Alpha 'a' handles the smooth fade out as it dips below the horizon
        ctx.globalAlpha = a; 

        // ── Atmospheric bloom — pure, soft radial circle  ──
        const bloomR = R * 4.5;
        const bloom = ctx.createRadialGradient(sx, sy, R * 0.5, sx, sy, bloomR);
        bloom.addColorStop(0,   'rgba(255, 230, 100, 0.3)');
        bloom.addColorStop(0.4, 'rgba(255, 180, 50, 0.1)');
        bloom.addColorStop(1,   'rgba(255, 120, 0, 0)');
        ctx.beginPath(); ctx.arc(sx, sy, bloomR, 0, Math.PI * 2);
        ctx.fillStyle = bloom; ctx.fill();

        // ── Corona ────────────────────────────────────────────────────────
        const corona = ctx.createRadialGradient(sx, sy, R, sx, sy, R * 2.2);
        corona.addColorStop(0,   'rgba(255, 220, 80, 0.6)');
        corona.addColorStop(0.6, 'rgba(255, 160, 40, 0.2)');
        corona.addColorStop(1,   'rgba(255, 100, 0, 0)');
        ctx.beginPath(); ctx.arc(sx, sy, R * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = corona; ctx.fill();

        // ── Disc — Consistent Golden/Yellow Core  ───────────
        const disc = ctx.createRadialGradient(sx - R * 0.15, sy - R * 0.15, 0, sx, sy, R);
        disc.addColorStop(0,    '#FFFFFF');      // Hot white center
        disc.addColorStop(0.4,  '#FFEA70');      // Bright yellow
        disc.addColorStop(1,    '#FFB800');      // Golden edge
        
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(255, 180, 0, 0.8)';
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

        // Halo
        const halo = ctx.createRadialGradient(mx, my, R, mx, my, R * 5);
        halo.addColorStop(0, 'rgba(200,225,255,0.14)');
        halo.addColorStop(0.5, 'rgba(180,210,255,0.04)');
        halo.addColorStop(1, 'rgba(160,195,255,0)');
        ctx.beginPath(); ctx.arc(mx, my, R * 5, 0, Math.PI * 2);
        ctx.fillStyle = halo; ctx.fill();

        // Disc
        const disc = ctx.createRadialGradient(mx - R * 0.18, my - R * 0.16, 0, mx, my, R);
        disc.addColorStop(0,    '#FFFFFF');
        disc.addColorStop(0.40, '#F4F8FF');
        disc.addColorStop(0.78, '#E2EEFF');
        disc.addColorStop(1,    '#C8DAFF');
        ctx.shadowBlur = 26; ctx.shadowColor = 'rgba(200,225,255,0.80)';
        ctx.beginPath(); ctx.arc(mx, my, R, 0, Math.PI * 2);
        ctx.fillStyle = disc; ctx.fill();
        ctx.shadowBlur = 0;

        // Maria patches
        ctx.save();
        ctx.beginPath(); ctx.arc(mx, my, R, 0, Math.PI * 2); ctx.clip();
        for (const m of [
            { ox: -0.22, oy: -0.20, rx: 0.30, ry: 0.20, rot: 0.30, a: 0.15 },
            { ox: 0.18, oy: 0.12, rx: 0.18, ry: 0.13, rot: -0.15, a: 0.12 },
            { ox: -0.26, oy: 0.22, rx: 0.15, ry: 0.09, rot: 0.55, a: 0.10 },
            { ox: 0.26, oy: -0.26, rx: 0.11, ry: 0.08, rot: 0.10, a: 0.09 },
        ]) {
            const mg = ctx.createRadialGradient(mx + m.ox * R, my + m.oy * R, 0, mx + m.ox * R, my + m.oy * R, m.rx * R);
            mg.addColorStop(0, `rgba(175,192,215,${m.a})`);
            mg.addColorStop(1, 'rgba(175,192,215,0)');
            ctx.fillStyle = mg;
            ctx.beginPath();
            ctx.ellipse(mx + m.ox * R, my + m.oy * R, m.rx * R, m.ry * R, m.rot, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Limb darkening
        const limb = ctx.createRadialGradient(mx, my, R * 0.5, mx, my, R);
        limb.addColorStop(0, 'rgba(220,235,255,0)');
        limb.addColorStop(1, 'rgba(145,180,228,0.15)');
        ctx.beginPath(); ctx.arc(mx, my, R, 0, Math.PI * 2);
        ctx.fillStyle = limb; ctx.fill();

        // Water reflection — horizontal bands, NO ctx.scale
        if (my < surfY - R) {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 5; i++) {
                const frac = i / 5;
                const yy = surfY + 4 + R * 4.5 * frac;
                const wig = Math.sin(yy * 0.038 + t * 0.00072) * R * 0.42;
                const cW = R * 1.7 * (1 - frac * 0.78);
                const rowA = a * 0.12 * (1 - frac * 0.85);
                const rg = ctx.createLinearGradient(mx + wig - cW, yy, mx + wig + cW, yy);
                rg.addColorStop(0, 'rgba(210,230,255,0)');
                rg.addColorStop(0.45, `rgba(210,230,255,${rowA})`);
                rg.addColorStop(0.55, `rgba(210,230,255,${rowA})`);
                rg.addColorStop(1, 'rgba(210,230,255,0)');
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
        const tw = 0.5 + Math.sin(Date.now() * 0.00165 + this.phase) * 0.50;
        const a = clamp(tw * this.bright * darkF, 0, 1);
        if (a < 0.01) return;
        if (this.r > 1.1 && a > 0.22) {
            ctx.save(); ctx.strokeStyle = `rgba(${this.rgb},${a * 0.24})`; ctx.lineWidth = 0.5;
            const arm = this.r * 3.2;
            ctx.beginPath();
            ctx.moveTo(this.x - arm, this.y); ctx.lineTo(this.x + arm, this.y);
            ctx.moveTo(this.x, this.y - arm); ctx.lineTo(this.x, this.y + arm);
            ctx.stroke(); ctx.restore();
        }
        ctx.fillStyle = `rgba(${this.rgb},${a})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
    }
}

class ShootingStar {
    x = 0; y = 0; vx = 0; vy = 0; life = 0; maxLife = 0; active = false;
    constructor(private W: number) { }
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
        const p = this.life / this.maxLife;
        const tx = this.x - this.vx * 9, ty = Math.min(this.y - this.vy * 9, surfY - 6);
        ctx.save();
        const g = ctx.createLinearGradient(this.x, this.y, tx, ty);
        g.addColorStop(0, `rgba(255,255,255,${p * 0.92})`);
        g.addColorStop(0.5, `rgba(210,220,255,${p * 0.32})`);
        g.addColorStop(1, 'rgba(180,200,255,0)');
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
    constructor(private W: number) { }
    tick() { this.ph += 0.0013; }
    draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number) {
        if (nf < 0.60) return;
        const a = (nf - 0.60) * 0.15;
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        for (let b = 0; b < 3; b++) {
            const yBase = surfY * (0.07 + b * 0.09), hue = [162, 188, 142][b], bH = surfY * 0.13;
            const g = ctx.createLinearGradient(0, yBase, 0, yBase + bH);
            g.addColorStop(0, `hsla(${hue},80%,58%,0)`);
            g.addColorStop(0.44, `hsla(${hue},80%,58%,${a * (1 - b * 0.28)})`);
            g.addColorStop(1, `hsla(${hue},80%,58%,0)`);
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
//  UNDERWATER PARTICLES (pooled)
// ═══════════════════════════════════════════════════════════════════════════
class Bubble {
    x = 0; y = 0; startY = 0; r = 0; vy = 0; vx = 0; phase = 0; active = false;
    constructor(private W: number, private H: number) { }
    spawn(surfY: number) {
        this.x = Math.random() * this.W;
        this.y = this.H - 10 - Math.random() * (this.H - surfY) * 0.55;
        this.startY = this.y; this.r = 1.5 + Math.random() * 4.5;
        this.vy = -(0.18 + Math.random() * 0.48); this.vx = (Math.random() - 0.5) * 0.22;
        this.phase = Math.random() * Math.PI * 2; this.active = true;
    }
    update(scrollSpeed: number) {
        this.phase += 0.036;
        this.x += this.vx + Math.sin(this.phase) * 0.18 - scrollSpeed * 0.82;
        this.y += this.vy;
        if (this.x < 0) this.x += this.W; if (this.x > this.W) this.x -= this.W;
    }
    draw(ctx: CanvasRenderingContext2D) {
        const risen = clamp((this.startY - this.y) / 200, 0, 1);
        const a = (0.10 + risen * 0.42) * 0.62;
        ctx.save(); ctx.globalAlpha = a;
        ctx.strokeStyle = 'rgba(175,228,255,0.78)'; ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(215,248,255,0.05)'; ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.52)';
        ctx.beginPath(); ctx.arc(this.x - this.r * 0.28, this.y - this.r * 0.28, this.r * 0.20, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

class Plankton {
    x = 0; y = 0; vx = 0; vy = 0; r = 0; phase = 0; hue = 0;
    constructor(private W: number, private H: number) { this.reset(H * 0.7); }
    reset(surfY: number) {
        this.x = Math.random() * this.W; this.y = surfY + Math.random() * (this.H - surfY) * 0.90;
        this.vx = (Math.random() - 0.5) * 0.12; this.vy = (Math.random() - 0.5) * 0.09 - 0.02;
        this.r = 0.5 + Math.random() * 1.2; this.phase = Math.random() * Math.PI * 2;
        this.hue = [172, 188, 158, 202][Math.floor(Math.random() * 4)];
    }
    update(surfY: number, scrollSpeed: number) {
        this.phase += 0.020; this.x += this.vx - scrollSpeed * 0.38; this.y += this.vy;
        if (this.x < 0) this.x += this.W; if (this.x > this.W) this.x -= this.W;
        if (this.y < surfY + 32 || this.y > this.H) this.reset(surfY);
    }
    draw(ctx: CanvasRenderingContext2D, nf: number) {
        const a = (0.20 + Math.sin(this.phase) * 0.80) * (0.04 + nf * 0.16);
        if (a < 0.006) return;
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 4.5);
        grd.addColorStop(0, `hsla(${this.hue},88%,62%,${a})`);
        grd.addColorStop(1, `hsla(${this.hue},68%,42%,0)`);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 4.5, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
    }
}

class MarineSnow {
    x = 0; y = 0; r = 0; vy = 0; vx = 0; alpha = 0;
    constructor(private W: number, private H: number) { this.reset(H * 0.4); }
    reset(surfY: number) {
        this.x = Math.random() * this.W; this.y = surfY + Math.random() * (this.H - surfY);
        this.r = 0.3 + Math.random() * 0.85; this.vy = 0.07 + Math.random() * 0.14;
        this.vx = (Math.random() - 0.5) * 0.09; this.alpha = 0.04 + Math.random() * 0.10;
    }
    update(surfY: number, scrollSpeed: number) {
        this.x += this.vx - scrollSpeed * 0.55; this.y += this.vy;
        if (this.x < 0) this.x += this.W;
        if (this.y > this.H) this.reset(surfY);
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `rgba(195,218,232,${this.alpha})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SEA FLOOR
// ═══════════════════════════════════════════════════════════════════════════
class SeaFloor {
    sandHeight = 60; targetHeight = 60;
    private tex: HTMLCanvasElement | null = null;
    private scrollX = 0;
    constructor(private W: number, private H: number) { this.tex = this._buildTex(); }
    private _buildTex(): HTMLCanvasElement | null {
        if (typeof document === 'undefined') return null;
        const c = document.createElement('canvas'); c.width = 256; c.height = 256;
        const ctx = c.getContext('2d'); if (!ctx) return null;
        for (let i = 0; i < 1800; i++) {
            ctx.fillStyle = `hsla(${28 + Math.random() * 22},52%,${38 + Math.random() * 28}%,${0.05 + Math.random() * 0.08})`;
            ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 1.5, 1);
        }
        return c;
    }
    update(gameTime: number, scrollSpeed: number) {
        this.scrollX += scrollSpeed;
        if (Math.floor(gameTime / 10000) % 3 === 0)
            this.targetHeight = Math.min(225, 60 + gameTime / 2200);
        else
            this.targetHeight = Math.max(60, this.targetHeight - 0.14);
        this.sandHeight += (this.targetHeight - this.sandHeight) * 0.008;
    }
    draw(ctx: CanvasRenderingContext2D, nf: number, t: number) {
        const W = this.W, H = this.H, baseY = H - this.sandHeight, step = 8;
        const bumps: number[] = [];
        for (let xi = 0; xi <= W + step; xi += step) {
            const rx = xi + this.scrollX;
            bumps.push(
                Math.sin(rx * 0.012) * 12 + Math.cos(rx * 0.043) * 5
                + Math.sin(rx * 0.090 + t * 0.0004) * 2
                + vnoise(rx * 0.004 + t * 0.00007) * 4
            );
        }
        ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, baseY + bumps[0]);
        for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i]);
        ctx.lineTo(W, H); ctx.closePath();
        const g = ctx.createLinearGradient(0, baseY, 0, H);
        g.addColorStop(0,    lerpColor('#C89040', '#271908', nf * 0.88));
        g.addColorStop(0.28, lerpColor('#8A5A18', '#171005', nf * 0.88));
        g.addColorStop(1,    lerpColor('#562E08', '#0C0602', nf * 0.88));
        ctx.fillStyle = g; ctx.fill();
        if (this.tex) {
            ctx.save(); ctx.clip();
            const pat = ctx.createPattern(this.tex, 'repeat');
            if (pat) {
                ctx.translate(-(this.scrollX % 256), 0);
                ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.34;
                ctx.fillStyle = pat; ctx.fillRect(0, 0, W + 256, H);
            }
            ctx.restore();
        }
        ctx.beginPath(); ctx.moveTo(0, baseY + bumps[0]);
        for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i]);
        ctx.strokeStyle = `rgba(255,200,90,${0.44 - nf * 0.38})`; ctx.lineWidth = 2.0; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, baseY + bumps[0] + 3);
        for (let i = 1; i < bumps.length; i++) ctx.lineTo(i * step, baseY + bumps[i] + 3);
        ctx.strokeStyle = `rgba(20,8,2,${0.24 + nf * 0.14})`; ctx.lineWidth = 3.5; ctx.stroke();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  DISTANT MOUNTAINS
// ═══════════════════════════════════════════════════════════════════════════
class DistantMountains {
    private scrollX = 0;
    constructor(private W: number, private H: number) { }
    update(speed: number) { this.scrollX += speed * 0.17; }
    draw(ctx: CanvasRenderingContext2D, nf: number, baseY: number) {
        ctx.fillStyle = nf > 0.5 ? 'rgba(2,10,25,0.52)' : 'rgba(12,55,105,0.42)';
        ctx.beginPath(); ctx.moveTo(0, this.H);
        for (let x = 0; x <= this.W; x += 20) {
            const rx = x + this.scrollX;
            const y = baseY - 65
                + Math.sin(rx * 0.0020) * 76
                + Math.cos(rx * 0.0050) * 26
                + Math.sin(rx * 0.0110) * 13;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.W, this.H); ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN CLASS
// ═══════════════════════════════════════════════════════════════════════════
export class SynapseBackground {
    gameWidth: number; gameHeight: number;
    private wave: WaveEngine;
    private floor: SeaFloor;
    private mounts: DistantMountains;
    private bodies: CelestialBodies;
    private rays: GodRays;
    private aurora: Aurora;
    private stars: Star[];
    private meteors: ShootingStar[];
    private bubblePool: Bubble[];
    private activeBubbles: Bubble[] = [];
    private plankton: Plankton[];
    private snow: MarineSnow[];

    private bubTimer = 0; private metTimer = 0;
    private surfY = 0; private waveAmp = 28; private wallT = 0;
    private globalT = 0;

    get sandHeight(): number { return this.floor.sandHeight; }

    constructor(W: number, H: number) {
        this.gameWidth = W; this.gameHeight = H;
        this.wave   = new WaveEngine(W, H);
        this.floor  = new SeaFloor(W, H);
        this.mounts = new DistantMountains(W, H);
        this.bodies = new CelestialBodies(W, H);
        this.rays   = new GodRays(W, H);
        this.aurora = new Aurora(W);
        this.stars   = Array.from({ length: 88 }, () => new Star(W, H));
        this.meteors = Array.from({ length: 3 },  () => new ShootingStar(W));
        this.bubblePool = Array.from({ length: 24 }, () => new Bubble(W, H));
        this.plankton   = Array.from({ length: 36 }, () => new Plankton(W, H));
        this.snow       = Array.from({ length: 44 }, () => new MarineSnow(W, H));
    }

    update(gameTime: number, delta: number, scrollSpeed: number): number {
        const C = 180_000; // 3-minute cycle
        // Offset 0.24 → at gameTime=0, globalT=0.24 → sun at true noon (zenith)
        this.globalT = ((gameTime % C) / C + 0.24) % 1.0;

        // ── Night factor: physically derived from sun height ───────────────
        // Sun arc window: globalT 0→0.48. Height = sin(π × sunProg).
        // This guarantees sky dark == sun below horizon. Perfectly in sync.
        const SUN_WIN = 0.48;
        const sunProg = clamp(this.globalT / SUN_WIN, 0, 1);
        const sunHeight = Math.sin(sunProg * Math.PI);

        let nf: number;
        if (this.globalT <= SUN_WIN) {
            // sky stays bright while sun is high, darkens only in final descent
            nf = 1 - smoothstep(0.02, 0.28, sunHeight);
        } else {
            nf = 1; // full night
        }

        this.wallT = Date.now();
        const diff = clamp((this.floor.sandHeight - 60) / 165, 0, 1);
        this.waveAmp = Math.max(14, 30 * (1 - diff * 0.44));

        this.floor.update(gameTime, scrollSpeed);
        this.mounts.update(scrollSpeed);
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
        if (this.bubTimer > 900 + Math.random() * 1300) {
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

    draw(ctx: CanvasRenderingContext2D, nf: number): void {
        const W = this.gameWidth, H = this.gameHeight, t = this.wallT, sy = this.surfY;

        // ── 1. SKY ────────────────────────────────────────────────────────
        const sky = ctx.createLinearGradient(0, 0, 0, sy);
        sky.addColorStop(0,    lerpColor('#1a70c8', '#06101e', nf));
        sky.addColorStop(0.38, lerpColor('#48a8dc', '#0b1830', nf));
        sky.addColorStop(0.76, lerpColor('#90d4ee', '#111f38', nf));
        sky.addColorStop(1,    lerpColor('#b8e4f8', '#192848', nf));
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

        // ── 3. AURORA ────────────────────────────────────────────────────
        this.aurora.draw(ctx, nf, sy);

        // ── 4. STARS + METEORS ────────────────────────────────────────────
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W, sy - 2); ctx.clip();
        this.stars.forEach(s => s.draw(ctx, nf, sy));
        this.meteors.forEach(s => s.draw(ctx, nf, sy));
        ctx.restore();

        // ── 5. SUN + MOON ─────────────────────────────────────────────────
        this.bodies.draw(ctx, nf, sy, this.globalT);

        // ── 6. DISTANT MOUNTAINS ─────────────────────────────────────────
        this.mounts.draw(ctx, nf, H - this.floor.sandHeight);

        // ── 7. WATER BODY (3 parallax layers, back → front) ───────────────
        const WC = [
            { d: ['#34a8f0','#2080d8','#1060b8','#0a4890'], n: ['#1e5899','#143880','#0c2860','#081840'] },
            { d: ['#1e90e0','#1470c0','#0c549a','#083c78'], n: ['#164080','#0e2e68','#082050','#051438'] },
            { d: ['#1468c8','#0e58a8','#083e80','#052a60'], n: ['#103870','#0a285a','#061a42','#040e2c'] },
        ];
        for (let layer = 2; layer >= 0; layer--) {
            // front=8px (smooth visible detail), mid/back=13px (fast)
            const pts = this.wave.buildPts(layer, t, this.waveAmp, layer === 0 ? 8 : 13);
            const lc = WC[layer];
            const midY = pts[Math.floor(pts.length / 2)].y;
            const wg = ctx.createLinearGradient(0, midY, 0, H);
            wg.addColorStop(0,    lerpColor(lc.d[0], lc.n[0], nf));
            wg.addColorStop(0.16, lerpColor(lc.d[1], lc.n[1], nf));
            wg.addColorStop(0.52, lerpColor(lc.d[2], lc.n[2], nf));
            wg.addColorStop(1,    lerpColor(lc.d[3], lc.n[3], nf));

            ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, pts[0].y);
            for (let i = 0; i < pts.length - 1; i++) {
                const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
                ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
            }
            const lp = pts[pts.length - 1];
            ctx.lineTo(lp.x, lp.y); ctx.lineTo(lp.x, H); ctx.closePath();
            ctx.fillStyle = wg; ctx.fill();

            // Crest highlight
            ctx.beginPath(); ctx.moveTo(0, pts[0].y);
            for (let i = 0; i < pts.length - 1; i++) {
                const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
                ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
            }
            if (layer === 0) {
                ctx.strokeStyle = `rgba(255,255,255,${0.33 - nf * 0.22})`; ctx.lineWidth = 2.0; ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, pts[0].y + 3);
                for (let i = 0; i < pts.length - 1; i++) {
                    const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2 + 3;
                    ctx.quadraticCurveTo(pts[i].x, pts[i].y + 3, mx, my);
                }
                ctx.strokeStyle = `rgba(160,220,255,${0.10 - nf * 0.07})`; ctx.lineWidth = 1.0; ctx.stroke();
            } else {
                ctx.strokeStyle = `rgba(255,255,255,${(0.07 - layer * 0.02) * (1 - nf * 0.55)})`;
                ctx.lineWidth = 1.0; ctx.stroke();
            }
        }

        // ── 8. DAY SURFACE GLINTS ─────────────────────────────────────────
        if (nf < 0.45) {
            const gA = (1 - nf / 0.45) * 0.13;
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const gPts = this.wave.buildPts(0, t, this.waveAmp, 18);
            for (let i = 0; i < 14; i++) {
                const gx = (W / 14) * i + Math.sin(t * 0.00072 + i * 0.88) * 22;
                const idx = clamp(Math.round(gx * gPts.length / W), 0, gPts.length - 1);
                const gy = gPts[idx].y;
                const gw = 3 + Math.abs(Math.sin(t * 0.00125 + i * 0.65)) * 11;
                const sh = ctx.createRadialGradient(gx, gy, 0, gx, gy, gw);
                sh.addColorStop(0, `rgba(220,252,255,${gA * 1.3})`);
                sh.addColorStop(0.5, `rgba(140,215,240,${gA * 0.45})`);
                sh.addColorStop(1, 'rgba(80,185,215,0)');
                ctx.beginPath(); ctx.ellipse(gx, gy, gw, gw * 0.22, 0, 0, Math.PI * 2);
                ctx.fillStyle = sh; ctx.fill();
            }
            ctx.restore();
        }

        // ── 9. GOD RAYS ───────────────────────────────────────────────────
        this.rays.draw(ctx, nf, this.wave, this.waveAmp, t);

        // ── 10. UNDERWATER PARTICLES ──────────────────────────────────────
        ctx.save();
        ctx.beginPath(); ctx.rect(0, sy + 1, W, H - sy - 1); ctx.clip();
        this.snow.forEach(s => s.draw(ctx));
        this.plankton.forEach(p => p.draw(ctx, nf));
        this.activeBubbles.forEach(b => b.draw(ctx));
        ctx.restore();

        // ── 11. DEPTH VIGNETTE ────────────────────────────────────────────
        const vig = ctx.createRadialGradient(W / 2, H * 0.64, H * 0.13, W / 2, H * 0.64, H * 0.80);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(0.58, 'rgba(0,0,0,0)');
        vig.addColorStop(1, `rgba(0,0,0,${0.20 + nf * 0.15})`);
        ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
        const bdg = ctx.createLinearGradient(0, H * 0.64, 0, H);
        bdg.addColorStop(0, 'rgba(0,0,0,0)');
        bdg.addColorStop(1, `rgba(0,0,0,${0.28 + nf * 0.18})`);
        ctx.fillStyle = bdg; ctx.fillRect(0, H * 0.64, W, H * 0.36);

        // ── 12. SEAFLOOR ──────────────────────────────────────────────────
        this.floor.draw(ctx, nf, t);
    }
}