// ═══════════════════════════════════════════════════════════════════════════
//  SynapseBackground  —  Photorealistic Ocean
//
//  Architecture philosophy:
//    • ONE water body, gradient-only, zero stacked colored layers
//    • All effects use additive/multiply blending, never solid fills
//    • Stars/meteors hard-clipped to sky rectangle
//    • Plankton only in bottom 45% of screen, near-invisible in daylight
//    • Water night color = near-black, sky night color = dark navy → clear contrast
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

// ─── simple value noise (no deps) ────────────────────────────────────────────
const _perm = (() => {
    const p = Array.from({length: 256}, (_, i) => i);
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [p[i], p[j]] = [p[j], p[i]];
    }
    return [...p, ...p];
})();
function vnoise(x: number): number {
    const i = Math.floor(x) & 255;
    const f = x - Math.floor(x);
    const u = f * f * (3 - 2 * f);
    const a = (_perm[i]     / 255) * 2 - 1;
    const b = (_perm[i + 1] / 255) * 2 - 1;
    return a + u * (b - a);
}

// ═══════════════════════════════════════════════════════════════════════════
//  WAVE ENGINE  — single surface, NO multiple layers
// ═══════════════════════════════════════════════════════════════════════════
class WaveEngine {
    private W: number; private H: number;
    private scrollX = 0;

    constructor(W: number, H: number) { this.W = W; this.H = H; }

    scroll(speed: number) {
        this.scrollX -= speed;
        if (this.scrollX < -this.W) this.scrollX += this.W;
    }

    // Y of the water surface at canvas X=cx, at wall-clock time t
    surfaceY(cx: number, t: number, waveAmp: number): number {
        const rx = cx + this.scrollX;
        return this.H * 0.415
            + Math.sin(rx * 0.00430 + t * 0.000820) * waveAmp * 0.88
            + Math.sin(rx * 0.00870 + t * 0.001380) * waveAmp * 0.44
            + Math.sin(rx * 0.01740 + t * 0.002100) * waveAmp * 0.20
            + Math.cos(rx * 0.02980 + t * 0.001650) * waveAmp * 0.10
            + vnoise(rx * 0.004 + t * 0.00018) * waveAmp * 0.14;
    }

    // Build point array for the wave surface
    buildPts(t: number, waveAmp: number, step = 5): {x: number; y: number}[] {
        const pts: {x: number; y: number}[] = [];
        for (let x = 0; x <= this.W + step; x += step)
            pts.push({x, y: this.surfaceY(x, t, waveAmp)});
        return pts;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  STARS
// ═══════════════════════════════════════════════════════════════════════════
class Star {
    x: number; y: number; r: number; phase: number; bright: number;
    // colour temperatures: blue-white / white / warm-white
    rgb: string;
    constructor(W: number, H: number) {
        this.x     = Math.random() * W;
        this.y     = Math.random() * H * 0.38;  // STRICT sky zone
        this.r     = 0.25 + Math.random() * 1.55;
        this.phase = Math.random() * Math.PI * 2;
        this.bright = 0.30 + Math.random() * 0.70;
        const t = Math.random();
        this.rgb = t > 0.65 ? '255,238,200' : t > 0.35 ? '255,255,242' : '200,218,255';
    }
    draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number) {
        if (this.y >= surfY - 2) return;   // never below water
        if (nf < 0.10) return;
        const tw = 0.60 + Math.sin(Date.now() * 0.00172 + this.phase) * 0.40;
        const a  = clamp(tw * this.bright * nf, 0, 1);
        if (a < 0.015) return;
        // diffraction cross for larger stars
        if (this.r > 1.0 && a > 0.22) {
            ctx.save();
            ctx.strokeStyle = `rgba(${this.rgb},${a * 0.30})`;
            ctx.lineWidth   = 0.5;
            const arm = this.r * 3.8;
            ctx.beginPath();
            ctx.moveTo(this.x - arm, this.y); ctx.lineTo(this.x + arm, this.y);
            ctx.moveTo(this.x, this.y - arm); ctx.lineTo(this.x, this.y + arm);
            ctx.stroke();
            ctx.restore();
        }
        ctx.fillStyle = `rgba(${this.rgb},${a})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SHOOTING STAR  — hard-clipped to sky, killed at surface
// ═══════════════════════════════════════════════════════════════════════════
class ShootingStar {
    x = 0; y = 0; vx = 0; vy = 0; life = 0; maxLife = 0; active = false;
    private W: number;
    constructor(W: number) { this.W = W; }

    spawn(surfaceY: number) {
        this.x = this.W * (0.20 + Math.random() * 0.80);
        this.y = surfaceY * (0.02 + Math.random() * 0.20);
        const spd  = 5.5 + Math.random() * 8.5;
        const ang  = Math.PI * (0.72 + Math.random() * 0.56);
        this.vx    = Math.cos(ang) * spd;
        this.vy    = Math.abs(Math.sin(ang)) * spd * 0.32;
        this.maxLife = 28 + Math.random() * 38;
        this.life  = this.maxLife;
        this.active = true;
    }

    update(surfaceY: number) {
        if (!this.active) return;
        this.x += this.vx; this.y += this.vy; this.life--;
        if (this.life <= 0 || this.y >= surfaceY - 6) this.active = false;
    }

    draw(ctx: CanvasRenderingContext2D, nf: number, surfaceY: number) {
        if (!this.active || nf < 0.30 || this.y >= surfaceY - 6) return;
        const p   = this.life / this.maxLife;
        const len = 10;
        const tx  = this.x - this.vx * len;
        const ty  = Math.min(this.y - this.vy * len, surfaceY - 7);
        ctx.save();
        const g = ctx.createLinearGradient(this.x, this.y, tx, ty);
        g.addColorStop(0, `rgba(255,255,255,${p * nf * 0.95})`);
        g.addColorStop(0.45, `rgba(200,215,255,${p * nf * 0.38})`);
        g.addColorStop(1,   'rgba(180,200,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${p * nf * 0.95})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, 1.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  MOON  — crescent phase, maria, limb darkening, rippled reflection
// ═══════════════════════════════════════════════════════════════════════════
class Moon {
    private W: number; private H: number;
    constructor(W: number, H: number) { this.W = W; this.H = H; }

    draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number, t: number) {
        if (nf < 0.04) return;
        const alpha = clamp(nf * 1.25, 0, 1);
        const R  = Math.min(this.W, this.H) * 0.056; // ~60px on 1080p
        const mx = this.W * 0.800;
        // rises from horizon as night deepens
        const my = surfY * 0.10 + (1 - nf) * surfY * 0.88;

        ctx.save(); ctx.globalAlpha = alpha;

        // ── Outer atmospheric halo ──
        const hR = R * 5.5;
        const halo = ctx.createRadialGradient(mx, my, R, mx, my, hR);
        halo.addColorStop(0,   'rgba(215,232,255,0.12)');
        halo.addColorStop(0.35,'rgba(190,215,255,0.04)');
        halo.addColorStop(1,   'rgba(160,192,240,0)');
        ctx.beginPath(); ctx.arc(mx, my, hR, 0, Math.PI * 2);
        ctx.fillStyle = halo; ctx.fill();

        // ── Disc (clipped) ──
        ctx.save();
        ctx.beginPath(); ctx.arc(mx, my, R, 0, Math.PI * 2); ctx.clip();

        // Lit basalt surface
        const surf = ctx.createRadialGradient(mx - R*0.28, my - R*0.26, 0, mx, my, R * 1.04);
        surf.addColorStop(0,   '#F7FAF0');
        surf.addColorStop(0.42,'#DDE6CC');
        surf.addColorStop(0.80,'#C5D1B5');
        surf.addColorStop(1,   '#A5B595');
        ctx.fillStyle = surf; ctx.fillRect(mx-R, my-R, R*2, R*2);

        // Maria (dark seas)
        [
            {ox:-0.21, oy:-0.17, rx:0.38, ry:0.26, rot: 0.38},
            {ox: 0.13, oy: 0.09, rx:0.22, ry:0.17, rot:-0.18},
            {ox:-0.30, oy: 0.27, rx:0.18, ry:0.12, rot: 0.60},
            {ox: 0.27, oy:-0.31, rx:0.14, ry:0.10, rot: 0.08},
            {ox:-0.04, oy: 0.38, rx:0.11, ry:0.07, rot:-0.28},
        ].forEach(m => {
            ctx.fillStyle = 'rgba(125,143,108,0.44)';
            ctx.beginPath();
            ctx.ellipse(mx+m.ox*R, my+m.oy*R, m.rx*R, m.ry*R, m.rot, 0, Math.PI*2);
            ctx.fill();
        });

        // Crescent phase terminator — large shadow circle offset left
        // giving a gibbous waxing appearance
        ctx.fillStyle = 'rgba(5,12,28,0.64)';
        ctx.beginPath(); ctx.arc(mx - R * 0.38, my, R * 1.18, 0, Math.PI*2); ctx.fill();

        // Terminator soft blue-white edge glow
        const termG = ctx.createRadialGradient(mx - R*0.25, my, R*0.85, mx - R*0.25, my, R*1.4);
        termG.addColorStop(0,   'rgba(160,185,210,0)');
        termG.addColorStop(0.55,'rgba(160,185,210,0.07)');
        termG.addColorStop(1,   'rgba(160,185,210,0)');
        ctx.fillStyle = termG; ctx.fillRect(mx-R, my-R, R*2, R*2);

        // Limb darkening
        const limb = ctx.createRadialGradient(mx, my, R*0.50, mx, my, R);
        limb.addColorStop(0,   'rgba(0,0,0,0)');
        limb.addColorStop(0.78,'rgba(0,0,0,0)');
        limb.addColorStop(1,   'rgba(0,0,0,0.42)');
        ctx.fillStyle = limb; ctx.fillRect(mx-R, my-R, R*2, R*2);

        ctx.restore(); // end disc clip

        // ── Rippled moon reflection on water ──
        if (surfY < this.H * 0.95) {
            const rA  = nf * 0.22;
            const rH  = R * 9;
            const rY0 = surfY + 3;
            const rY1 = Math.min(this.H * 0.88, surfY + rH);
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            const cols = 9;
            for (let i = 0; i < cols; i++) {
                const frac  = i / cols;
                const yy0   = rY0 + (rY1 - rY0) * frac;
                const yy1   = rY0 + (rY1 - rY0) * (frac + 1/cols);
                const wig   = Math.sin(yy0 * 0.038 + t * 0.00095) * R * 0.45;
                const colW  = R * 2.6 * (1 - frac * 0.85);
                const rowA  = rA * (1 - frac * 0.92);
                const rg = ctx.createLinearGradient(mx+wig-colW, yy0, mx+wig+colW, yy0);
                rg.addColorStop(0,    'rgba(210,228,255,0)');
                rg.addColorStop(0.35, `rgba(210,228,255,${rowA})`);
                rg.addColorStop(0.65, `rgba(210,228,255,${rowA})`);
                rg.addColorStop(1,    'rgba(210,228,255,0)');
                ctx.fillStyle = rg;
                ctx.fillRect(mx+wig-colW, yy0, colW*2, yy1-yy0+1);
            }
            ctx.restore();
        }

        ctx.restore(); // globalAlpha
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SUN
// ═══════════════════════════════════════════════════════════════════════════
class Sun {
    private W: number; private H: number;
    constructor(W: number, H: number) { this.W = W; this.H = H; }

    draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number, t: number) {
        if (nf >= 1) return;
        const a  = 1 - nf;
        const R  = Math.min(this.W, this.H) * 0.040;
        const sx = this.W * 0.765;
        const sy = surfY * 0.12 + nf * surfY * 1.18;  // sinks to horizon

        ctx.save(); ctx.globalAlpha = a;

        // Far atmospheric haze
        const haze = ctx.createRadialGradient(sx, sy, R, sx, sy, R*7);
        haze.addColorStop(0,   `rgba(255,225,100,${a*0.22})`);
        haze.addColorStop(0.35,`rgba(255,185,45,${a*0.08})`);
        haze.addColorStop(1,   'rgba(255,150,15,0)');
        ctx.beginPath(); ctx.arc(sx, sy, R*7, 0, Math.PI*2);
        ctx.fillStyle = haze; ctx.fill();

        // Near corona
        const near = ctx.createRadialGradient(sx, sy, 0, sx, sy, R*2.8);
        near.addColorStop(0,   'rgba(255,252,195,0.58)');
        near.addColorStop(0.5, 'rgba(255,225,75,0.20)');
        near.addColorStop(1,   'rgba(255,185,0,0)');
        ctx.beginPath(); ctx.arc(sx, sy, R*2.8, 0, Math.PI*2);
        ctx.fillStyle = near; ctx.fill();

        // Disc
        const disc = ctx.createRadialGradient(sx-R*0.30, sy-R*0.28, 0, sx, sy, R);
        disc.addColorStop(0,   '#FFFFE5');
        disc.addColorStop(0.42,'#FFE840');
        disc.addColorStop(1,   '#FFA800');
        ctx.shadowBlur = 48; ctx.shadowColor = '#FFD700';
        ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI*2);
        ctx.fillStyle = disc; ctx.fill();
        ctx.shadowBlur = 0;

        // Sunset glitter path on water
        if (nf > 0.10) {
            const pA = (nf - 0.10) * 0.30;
            const step = R * 2.2;
            for (let i = -2; i <= 2; i++) {
                const cx = sx + i * step + Math.sin(t * 0.00095 + i) * R * 0.8;
                const pathG = ctx.createLinearGradient(cx, surfY, cx, surfY + this.H * 0.40);
                pathG.addColorStop(0,   `rgba(255,165,30,${pA})`);
                pathG.addColorStop(0.38,`rgba(255,130,20,${pA*0.45})`);
                pathG.addColorStop(1,   'rgba(255,100,0,0)');
                ctx.fillStyle = pathG;
                ctx.beginPath();
                ctx.moveTo(cx-R, surfY);
                ctx.lineTo(cx+R, surfY);
                ctx.lineTo(cx+R*1.7, surfY + this.H*0.38);
                ctx.lineTo(cx-R*1.7, surfY + this.H*0.38);
                ctx.closePath(); ctx.fill();
            }
        }
        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  AURORA
// ═══════════════════════════════════════════════════════════════════════════
class Aurora {
    private W: number; ph = 0;
    constructor(W: number) { this.W = W; }
    tick() { this.ph += 0.0016; }

    draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number) {
        if (nf < 0.50) return;
        const a = (nf - 0.50) * 0.22;
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        for (let b = 0; b < 3; b++) {
            const yBase = surfY * (0.05 + b * 0.09);
            const hue   = [162, 188, 142][b];
            const bH    = surfY * 0.16;
            const g = ctx.createLinearGradient(0, yBase, 0, yBase + bH);
            g.addColorStop(0,    `hsla(${hue},80%,58%,0)`);
            g.addColorStop(0.44, `hsla(${hue},80%,58%,${a * (1-b*0.28)})`);
            g.addColorStop(1,    `hsla(${hue},80%,58%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(0, yBase);
            for (let x = 0; x <= this.W; x += 18) {
                const y = yBase
                    + Math.sin(x*0.0055 + this.ph + b*1.5) * 22
                    + Math.sin(x*0.0122 + this.ph*1.8 + b) * 10;
                ctx.lineTo(x, Math.min(y, surfY - 3));
            }
            ctx.lineTo(this.W, yBase+bH); ctx.lineTo(0, yBase+bH);
            ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  BUBBLE
// ═══════════════════════════════════════════════════════════════════════════
class Bubble {
    x: number; y: number; r: number; vy: number; vx: number;
    phase: number; startY: number;
    constructor(W: number, H: number, surfY: number) {
        this.x      = Math.random() * W;
        this.y      = H - 12 - Math.random() * (H - surfY) * 0.5;
        this.startY = this.y;
        this.r      = 1.5 + Math.random() * 5.5;
        this.vy     = -(0.20 + Math.random() * 0.55);
        this.vx     = (Math.random() - 0.5) * 0.28;
        this.phase  = Math.random() * Math.PI * 2;
    }
    update() {
        this.phase += 0.038;
        this.x += this.vx + Math.sin(this.phase) * 0.22;
        this.y += this.vy;
    }
    draw(ctx: CanvasRenderingContext2D) {
        const risen = clamp((this.startY - this.y) / 220, 0, 1);
        const a = (0.12 + risen * 0.48) * 0.68;
        ctx.save(); ctx.globalAlpha = a;
        // Rim
        ctx.strokeStyle = 'rgba(175,228,255,0.82)';
        ctx.lineWidth   = 0.75;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.stroke();
        // Inner sheen
        ctx.fillStyle = 'rgba(215,248,255,0.07)'; ctx.fill();
        // Specular
        ctx.globalAlpha = a * 0.95;
        ctx.fillStyle = 'rgba(255,255,255,0.68)';
        ctx.beginPath(); ctx.arc(this.x - this.r*0.30, this.y - this.r*0.33, this.r*0.25, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PLANKTON  — ONLY bottom 45%, near-invisible daytime
// ═══════════════════════════════════════════════════════════════════════════
class Plankton {
    x: number; y: number; vx: number; vy: number;
    r: number; phase: number; hue: number;
    private W: number; private H: number;
    constructor(W: number, H: number) {
        this.W = W; this.H = H;
        this.x     = Math.random() * W;
        this.y     = H * 0.58 + Math.random() * H * 0.40;  // DEEP only
        this.vx    = (Math.random() - 0.5) * 0.14;
        this.vy    = (Math.random() - 0.5) * 0.10 - 0.025;
        this.r     = 0.5 + Math.random() * 1.3;
        this.phase = Math.random() * Math.PI * 2;
        this.hue   = [172, 188, 158, 202][Math.floor(Math.random() * 4)];
    }
    update(surfY: number) {
        this.phase += 0.022;
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0)        this.x = this.W;
        if (this.x > this.W)   this.x = 0;
        if (this.y < surfY + 38) this.y = this.H * 0.90;
        if (this.y > this.H)   this.y = surfY + 42;
    }
    draw(ctx: CanvasRenderingContext2D, nf: number) {
        const pulse  = 0.22 + Math.sin(this.phase) * 0.78;
        const maxA   = 0.05 + nf * 0.18;   // day≤5%, night≤23%
        const a      = pulse * maxA;
        if (a < 0.007) return;
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 5.5);
        grd.addColorStop(0,    `hsla(${this.hue},90%,62%,${a})`);
        grd.addColorStop(0.48, `hsla(${this.hue},80%,52%,${a*0.25})`);
        grd.addColorStop(1,    `hsla(${this.hue},70%,42%,0)`);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r*5.5, 0, Math.PI*2);
        ctx.fillStyle = grd; ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  MARINE SNOW
// ═══════════════════════════════════════════════════════════════════════════
class MarineSnow {
    x: number; y: number; r: number; vy: number; vx: number;
    alpha: number; phase: number;
    private W: number; private H: number;
    constructor(W: number, H: number) {
        this.W = W; this.H = H;
        this.x     = Math.random() * W;
        this.y     = Math.random() * H;
        this.r     = 0.32 + Math.random() * 0.90;
        this.vy    = 0.07 + Math.random() * 0.16;
        this.vx    = (Math.random() - 0.5) * 0.10;
        this.alpha = 0.04 + Math.random() * 0.11;   // very low
        this.phase = Math.random() * Math.PI * 2;
    }
    update(surfY: number) {
        this.phase += 0.018;
        this.x += this.vx + Math.sin(this.phase) * 0.06;
        this.y += this.vy;
        if (this.y > this.H + 4) { this.y = surfY + 8; this.x = Math.random() * this.W; }
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `rgba(195,218,232,${this.alpha})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SEAFLOOR
// ═══════════════════════════════════════════════════════════════════════════
class SeaFloor {
    private W: number; private H: number;
    sandHeight   = 60;
    targetHeight = 60;
    private tex: HTMLCanvasElement | null = null;

    constructor(W: number, H: number) {
        this.W = W; this.H = H;
        this.tex = this._buildTex();
    }

    private _buildTex(): HTMLCanvasElement | null {
        if (typeof document === 'undefined') return null;
        const c = document.createElement('canvas');
        c.width = 256; c.height = 128;
        const ctx = c.getContext('2d'); if (!ctx) return null;
        // Warm sandy grain
        for (let i = 0; i < 2400; i++) {
            const h = 28 + Math.random() * 22, l = 38 + Math.random() * 28;
            ctx.fillStyle = `hsla(${h},52%,${l}%,${0.05 + Math.random()*0.09})`;
            ctx.fillRect(Math.random()*256, Math.random()*128, 1 + Math.random()*1.5, 1);
        }
        // Pebbles
        for (let i = 0; i < 48; i++) {
            ctx.fillStyle = `hsla(${24+Math.random()*20},38%,${30+Math.random()*22}%,${0.09+Math.random()*0.14})`;
            ctx.beginPath();
            ctx.ellipse(Math.random()*256, Math.random()*128,
                2+Math.random()*6, 1.2+Math.random()*3, Math.random()*Math.PI, 0, Math.PI*2);
            ctx.fill();
        }
        // Shell arcs
        for (let i = 0; i < 14; i++) {
            ctx.strokeStyle = `hsla(35,60%,70%,0.16)`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(Math.random()*256, Math.random()*128, 2+Math.random()*4, 0, Math.PI);
            ctx.stroke();
        }
        return c;
    }

    update(gameTime: number) {
        if (Math.floor(gameTime / 10000) % 3 === 0) {
            this.targetHeight = Math.min(225, 60 + gameTime / 2200);
        } else {
            this.targetHeight = Math.max(60, this.targetHeight - 0.15);
        }
        this.sandHeight += (this.targetHeight - this.sandHeight) * 0.008;
    }

    draw(ctx: CanvasRenderingContext2D, nf: number, t: number) {
        const W = this.W, H = this.H, sh = this.sandHeight;
        const baseY = H - sh;
        const step  = 5;

        // Bumpy edge
        const bumps: number[] = [];
        for (let xi = 0; xi <= W; xi += step) {
            bumps.push(
                Math.sin(xi * 0.0120) * 12
                + Math.cos(xi * 0.0430) * 5.5
                + Math.sin(xi * 0.0925 + t * 0.00040) * 2.2
                + vnoise(xi * 0.004 + t * 0.00008) * 4
            );
        }

        // Fill shape
        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(0, baseY + bumps[0]);
        for (let i = 1; i < bumps.length; i++) ctx.lineTo(i*step, baseY+bumps[i]);
        ctx.lineTo(W, H); ctx.closePath();

        const topC = lerpColor('#C89040', '#271908', nf * 0.88);
        const midC = lerpColor('#8A5A18', '#171005', nf * 0.88);
        const botC = lerpColor('#562E08', '#0C0602', nf * 0.88);
        const g = ctx.createLinearGradient(0, baseY, 0, H);
        g.addColorStop(0,    topC);
        g.addColorStop(0.22, midC);
        g.addColorStop(1,    botC);
        ctx.fillStyle = g; ctx.fill();

        // Texture
        if (this.tex) {
            ctx.save(); ctx.clip();
            const pat = ctx.createPattern(this.tex, 'repeat');
            if (pat) {
                ctx.globalCompositeOperation = 'overlay';
                ctx.globalAlpha = 0.42;
                ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
            }
            ctx.restore();
        }

        // Highlight rim
        ctx.beginPath();
        ctx.moveTo(0, baseY+bumps[0]);
        for (let i=1; i<bumps.length; i++) ctx.lineTo(i*step, baseY+bumps[i]);
        ctx.strokeStyle = `rgba(255,200,90,${0.48-nf*0.40})`; ctx.lineWidth = 2.2; ctx.stroke();

        // Shadow under rim
        ctx.beginPath();
        ctx.moveTo(0, baseY+bumps[0]+3.5);
        for (let i=1; i<bumps.length; i++) ctx.lineTo(i*step, baseY+bumps[i]+3.5);
        ctx.strokeStyle = `rgba(32,14,3,${0.28+nf*0.14})`; ctx.lineWidth = 4.5; ctx.stroke();

        // Night bioluminescent rim
        if (nf > 0.28) {
            const gA = (nf - 0.28) * 0.10;
            const sg = ctx.createLinearGradient(0, baseY-10, 0, baseY+22);
            sg.addColorStop(0,   `rgba(0,185,162,0)`);
            sg.addColorStop(0.5, `rgba(0,185,162,${gA})`);
            sg.addColorStop(1,   `rgba(0,185,162,0)`);
            ctx.beginPath();
            ctx.moveTo(0, baseY+bumps[0]-8);
            for (let i=1; i<bumps.length; i++) ctx.lineTo(i*step, baseY+bumps[i]-8);
            ctx.lineTo(W, baseY+22); ctx.lineTo(0, baseY+22);
            ctx.closePath(); ctx.fillStyle = sg; ctx.fill();
        }
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
    private moon:    Moon;
    private sun:     Sun;
    private aurora:  Aurora;
    private stars:   Star[];
    private meteors: ShootingStar[];
    private bubbles: Bubble[];
    private plankton: Plankton[];
    private snow:    MarineSnow[];

    private bubTimer  = 0;
    private metTimer  = 0;
    private surfY     = 0;
    private waveAmp   = 28;
    private wallT     = 0;

    get sandHeight(): number { return this.floor.sandHeight; }

    constructor(W: number, H: number) {
        this.gameWidth = W; this.gameHeight = H;

        this.wave    = new WaveEngine(W, H);
        this.floor   = new SeaFloor(W, H);
        this.moon    = new Moon(W, H);
        this.sun     = new Sun(W, H);
        this.aurora  = new Aurora(W);

        this.stars    = Array.from({length: 110}, () => new Star(W, H));
        this.meteors  = Array.from({length: 4},   () => new ShootingStar(W));
        this.bubbles  = [];
        this.plankton = Array.from({length: 50},  () => new Plankton(W, H));
        this.snow     = Array.from({length: 65},  () => new MarineSnow(W, H));
    }

    // Call once per frame; returns nightFactor 0–1
    update(gameTime: number): number {
        // Day/night cycle (3 min)
        const C   = 180_000;
        const pos = (gameTime % C) / C;
        let nf = 0;
        if      (pos < 0.25) nf = 0;
        else if (pos < 0.35) nf = (pos - 0.25) * 10;
        else if (pos < 0.75) nf = 1;
        else if (pos < 0.85) nf = 1 - (pos - 0.75) * 10;

        this.wallT  = Date.now();
        const diff  = clamp((this.floor.sandHeight - 60) / 165, 0, 1);
        this.waveAmp = Math.max(14, 30 * (1 - diff * 0.45));

        this.floor.update(gameTime);
        this.wave.scroll(0.9 + diff * 0.55);
        this.surfY = this.wave.surfaceY(this.gameWidth / 2, this.wallT, this.waveAmp);
        this.aurora.tick();

        // Meteors
        this.metTimer += 16;
        if (this.metTimer > 4000 + Math.random() * 5800) {
            const m = this.meteors.find(s => !s.active);
            if (m) m.spawn(this.surfY);
            this.metTimer = 0;
        }
        this.meteors.forEach(s => s.update(this.surfY));

        // Bubbles (born in water, killed when reaching surface)
        this.bubTimer += 16;
        if (this.bubTimer > 720 + Math.random() * 1100) {
            this.bubbles.push(new Bubble(this.gameWidth, this.gameHeight, this.surfY));
            this.bubTimer = 0;
        }
        this.bubbles = this.bubbles.filter(b => { b.update(); return b.y > this.surfY + 2; });

        this.plankton.forEach(p => p.update(this.surfY));
        this.snow.forEach(s => s.update(this.surfY));

        return nf;
    }

    draw(ctx: CanvasRenderingContext2D, nf: number): void {
        const W = this.gameWidth, H = this.gameHeight;
        const t = this.wallT, sy = this.surfY;

        // ──────────────────────────────────────────────────────────────────
        // 1. SKY
        //    Day: cerulean (#1870c8) → pale (#b5e2f5)
        //    Night: near-black navy (#030d20) → dark slate (#101e32)
        //    CRUCIAL: night sky must be distinct from night water
        // ──────────────────────────────────────────────────────────────────
        const sky = ctx.createLinearGradient(0, 0, 0, sy);
        sky.addColorStop(0,    lerpColor('#1870c8', '#030d20', nf));
        sky.addColorStop(0.38, lerpColor('#45a0d8', '#060f28', nf));
        sky.addColorStop(0.72, lerpColor('#92d2ee', '#0c1930', nf));
        sky.addColorStop(1,    lerpColor('#b5e2f5', '#142038', nf));
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // ──────────────────────────────────────────────────────────────────
        // 2. HORIZON GLOW (sunrise/sunset only)
        // ──────────────────────────────────────────────────────────────────
        const hPeak = Math.max(0, 1 - Math.abs(nf - 0.32) * 5.0);
        if (hPeak > 0.005) {
            const hg = ctx.createLinearGradient(0, sy * 0.52, 0, sy);
            hg.addColorStop(0,   `rgba(255,85,10,0)`);
            hg.addColorStop(0.55,`rgba(255,112,28,${hPeak*0.18})`);
            hg.addColorStop(1,   `rgba(255,148,52,${hPeak*0.30})`);
            ctx.fillStyle = hg;
            ctx.fillRect(0, sy * 0.52, W, sy * 0.48);
        }

        // ──────────────────────────────────────────────────────────────────
        // 3. AURORA
        // ──────────────────────────────────────────────────────────────────
        this.aurora.draw(ctx, nf, sy);

        // ──────────────────────────────────────────────────────────────────
        // 4. SUN + MOON
        // ──────────────────────────────────────────────────────────────────
        this.sun.draw(ctx, nf, sy, t);
        this.moon.draw(ctx, nf, sy, t);

        // ──────────────────────────────────────────────────────────────────
        // 5. STARS + METEORS — hard canvas clip to sky only
        // ──────────────────────────────────────────────────────────────────
        ctx.save();
        ctx.beginPath(); ctx.rect(0, 0, W, sy - 2); ctx.clip();
        this.stars.forEach(s => s.draw(ctx, nf, sy));
        this.meteors.forEach(s => s.draw(ctx, nf, sy));
        ctx.restore();

        // ──────────────────────────────────────────────────────────────────
        // 6. WATER BODY  — ONE gradient fill, zero separate dark layers
        //    Day water : royal blue  #0f56a5 → deep #083468
        //    Night water: near-black #030b1c → abyss #010509
        //    Both are very dark/saturated so they CONTRAST with sky
        // ──────────────────────────────────────────────────────────────────
        const pts  = this.wave.buildPts(t, this.waveAmp);
        const nPts = pts.length;

        const wTop = lerpColor('#0f56a5', '#030b1c', nf);
        const wMid = lerpColor('#0c4890', '#020810', nf);
        const wBot = lerpColor('#083468', '#010509', nf);

        const wg = ctx.createLinearGradient(0, sy, 0, H);
        wg.addColorStop(0,    wTop);
        wg.addColorStop(0.28, wMid);
        wg.addColorStop(0.70, lerpColor('#062a5a', '#010407', nf));
        wg.addColorStop(1,    wBot);

        ctx.beginPath();
        ctx.moveTo(0, H); ctx.lineTo(0, pts[0].y);
        for (let i = 1; i < nPts; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[nPts-1].x, H); ctx.closePath();
        ctx.fillStyle = wg; ctx.fill();

        // ──────────────────────────────────────────────────────────────────
        // 7. LIGHT PENETRATION OVERLAY (day only, extremely subtle)
        //    Fades out completely at nf > 0.5 — invisible as stripes
        // ──────────────────────────────────────────────────────────────────
        if (nf < 0.45) {
            const pA = (1 - nf / 0.45) * 0.042;
            const pg = ctx.createLinearGradient(0, sy, 0, sy + (H - sy) * 0.55);
            pg.addColorStop(0,    `rgba(90,170,230,${pA})`);
            pg.addColorStop(0.38, `rgba(55,135,200,${pA*0.38})`);
            pg.addColorStop(1,    'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.moveTo(0, H); ctx.lineTo(0, pts[0].y);
            for (let i=1; i<nPts; i++) ctx.lineTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[nPts-1].x, H); ctx.closePath();
            ctx.fillStyle = pg; ctx.fill();
        }

        // ──────────────────────────────────────────────────────────────────
        // 8. SURFACE FOAM LINE
        // ──────────────────────────────────────────────────────────────────
        ctx.beginPath();
        ctx.moveTo(0, pts[0].y);
        for (let i=1; i<nPts; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = `rgba(255,255,255,${0.34 - nf*0.24})`; ctx.lineWidth = 1.7; ctx.stroke();
        // Second softer foam
        ctx.beginPath();
        ctx.moveTo(0, pts[0].y + 2.5);
        for (let i=1; i<nPts; i++) ctx.lineTo(pts[i].x, pts[i].y + 2.5);
        ctx.strokeStyle = `rgba(155,218,242,${0.14-nf*0.10})`; ctx.lineWidth = 1.0; ctx.stroke();

        // ──────────────────────────────────────────────────────────────────
        // 9. SURFACE MICRO-GLINTS (day only — tiny bright ellipses)
        //    These are ON the surface, never extending deep as stripes
        // ──────────────────────────────────────────────────────────────────
        if (nf < 0.52) {
            const gA = (1 - nf / 0.52) * 0.16;
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 22; i++) {
                const gx = (W/22)*i + Math.sin(t*0.00078+i*0.86)*22;
                const gy = this.wave.surfaceY(gx, t, this.waveAmp);
                const gw = 3.5 + Math.abs(Math.sin(t*0.00135+i*0.68))*10;
                const shine = ctx.createRadialGradient(gx, gy, 0, gx, gy, gw);
                shine.addColorStop(0,   `rgba(215,252,255,${gA*1.3})`);
                shine.addColorStop(0.55,`rgba(140,215,238,${gA*0.45})`);
                shine.addColorStop(1,   'rgba(80,185,215,0)');
                ctx.beginPath(); ctx.ellipse(gx, gy, gw, gw*0.22, 0, 0, Math.PI*2);
                ctx.fillStyle = shine; ctx.fill();
            }
            ctx.restore();
        }

        // ──────────────────────────────────────────────────────────────────
        // 10. UNDERWATER PARTICLES — clipped strictly below surface
        // ──────────────────────────────────────────────────────────────────
        ctx.save();
        ctx.beginPath(); ctx.rect(0, sy+1, W, H-sy-1); ctx.clip();
        this.snow.forEach(s => s.draw(ctx));
        this.plankton.forEach(p => p.draw(ctx, nf));
        this.bubbles.forEach(b => b.draw(ctx));
        ctx.restore();

        // ──────────────────────────────────────────────────────────────────
        // 11. DEPTH ATMOSPHERE — radial vignette, no banding
        // ──────────────────────────────────────────────────────────────────
        const vig = ctx.createRadialGradient(W/2, H*0.62, H*0.16, W/2, H*0.62, H*0.84);
        vig.addColorStop(0,    'rgba(0,0,0,0)');
        vig.addColorStop(0.62, 'rgba(0,0,0,0)');
        vig.addColorStop(1,    `rgba(0,0,0,${0.26+nf*0.18})`);
        ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

        // Bottom depth darkening
        const bdg = ctx.createLinearGradient(0, H*0.60, 0, H);
        bdg.addColorStop(0, 'rgba(0,0,0,0)');
        bdg.addColorStop(1, `rgba(0,0,0,${0.40+nf*0.22})`);
        ctx.fillStyle = bdg; ctx.fillRect(0, H*0.60, W, H*0.40);

        // ──────────────────────────────────────────────────────────────────
        // 12. SEAFLOOR
        // ──────────────────────────────────────────────────────────────────
        this.floor.draw(ctx, nf, t);
    }
}