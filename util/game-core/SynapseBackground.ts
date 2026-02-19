// ═══════════════════════════════════════════════════════════════════════════
//  SynapseBackground  —  Photorealistic Ocean (Enhanced Parallax & God Rays)
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
//  WAVE ENGINE
// ═══════════════════════════════════════════════════════════════════════════
class WaveEngine {
    private W: number; private H: number;
    private scrollX = 0;

    constructor(W: number, H: number) { this.W = W; this.H = H; }

    scroll(speed: number) {
        this.scrollX -= speed;
        if (this.scrollX < -this.W) this.scrollX += this.W;
    }

    surfaceY(cx: number, t: number, waveAmp: number): number {
        const rx = cx + this.scrollX;
        return this.H * 0.415
            + Math.sin(rx * 0.00430 + t * 0.000820) * waveAmp * 0.88
            + Math.sin(rx * 0.00870 + t * 0.001380) * waveAmp * 0.44
            + Math.sin(rx * 0.01740 + t * 0.002100) * waveAmp * 0.20
            + Math.cos(rx * 0.02980 + t * 0.001650) * waveAmp * 0.10
            + vnoise(rx * 0.004 + t * 0.00018) * waveAmp * 0.14;
    }

    buildPts(t: number, waveAmp: number, step = 5): {x: number; y: number}[] {
        const pts: {x: number; y: number}[] = [];
        for (let x = 0; x <= this.W + step; x += step)
            pts.push({x, y: this.surfaceY(x, t, waveAmp)});
        return pts;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  CELESTIAL & ATMOSPHERE
// ═══════════════════════════════════════════════════════════════════════════
class Star {
    x: number; y: number; r: number; phase: number; bright: number; rgb: string;
    constructor(W: number, H: number) {
        this.x = Math.random() * W; this.y = Math.random() * H * 0.38;
        this.r = 0.25 + Math.random() * 1.55; this.phase = Math.random() * Math.PI * 2;
        this.bright = 0.30 + Math.random() * 0.70;
        const t = Math.random();
        this.rgb = t > 0.65 ? '255,238,200' : t > 0.35 ? '255,255,242' : '200,218,255';
    }
    draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number) {
        if (this.y >= surfY - 2 || nf < 0.10) return;
        const tw = 0.60 + Math.sin(Date.now() * 0.00172 + this.phase) * 0.40;
        const a  = clamp(tw * this.bright * nf, 0, 1);
        if (a < 0.015) return;
        if (this.r > 1.0 && a > 0.22) {
            ctx.save(); ctx.strokeStyle = `rgba(${this.rgb},${a * 0.30})`; ctx.lineWidth = 0.5;
            const arm = this.r * 3.8;
            ctx.beginPath(); ctx.moveTo(this.x - arm, this.y); ctx.lineTo(this.x + arm, this.y);
            ctx.moveTo(this.x, this.y - arm); ctx.lineTo(this.x, this.y + arm); ctx.stroke(); ctx.restore();
        }
        ctx.fillStyle = `rgba(${this.rgb},${a})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill();
    }
}

class ShootingStar {
    x = 0; y = 0; vx = 0; vy = 0; life = 0; maxLife = 0; active = false;
    constructor(private W: number) {}
    spawn(surfaceY: number) {
        this.x = this.W * (0.20 + Math.random() * 0.80); this.y = surfaceY * (0.02 + Math.random() * 0.20);
        const spd = 5.5 + Math.random() * 8.5, ang = Math.PI * (0.72 + Math.random() * 0.56);
        this.vx = Math.cos(ang) * spd; this.vy = Math.abs(Math.sin(ang)) * spd * 0.32;
        this.maxLife = 28 + Math.random() * 38; this.life = this.maxLife; this.active = true;
    }
    update(surfaceY: number) {
        if (!this.active) return;
        this.x += this.vx; this.y += this.vy; this.life--;
        if (this.life <= 0 || this.y >= surfaceY - 6) this.active = false;
    }
    draw(ctx: CanvasRenderingContext2D, nf: number, surfaceY: number) {
        if (!this.active || nf < 0.30 || this.y >= surfaceY - 6) return;
        const p = this.life / this.maxLife, tx = this.x - this.vx * 10, ty = Math.min(this.y - this.vy * 10, surfaceY - 7);
        ctx.save();
        const g = ctx.createLinearGradient(this.x, this.y, tx, ty);
        g.addColorStop(0, `rgba(255,255,255,${p * nf * 0.95})`); g.addColorStop(1, 'rgba(180,200,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${p * nf * 0.95})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, 1.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
}

class Moon {
    constructor(private W: number, private H: number) {}
    draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number, t: number) {
        if (nf < 0.04) return;
        const alpha = clamp(nf * 1.25, 0, 1), R = Math.min(this.W, this.H) * 0.056;
        const mx = this.W * 0.800, my = surfY * 0.10 + (1 - nf) * surfY * 0.88;
        ctx.save(); ctx.globalAlpha = alpha;
        
        const halo = ctx.createRadialGradient(mx, my, R, mx, my, R * 5.5);
        halo.addColorStop(0, 'rgba(215,232,255,0.12)'); halo.addColorStop(1, 'rgba(160,192,240,0)');
        ctx.beginPath(); ctx.arc(mx, my, R * 5.5, 0, Math.PI * 2); ctx.fillStyle = halo; ctx.fill();
        
        ctx.save(); ctx.beginPath(); ctx.arc(mx, my, R, 0, Math.PI * 2); ctx.clip();
        const surf = ctx.createRadialGradient(mx - R*0.28, my - R*0.26, 0, mx, my, R * 1.04);
        surf.addColorStop(0, '#F7FAF0'); surf.addColorStop(1, '#A5B595');
        ctx.fillStyle = surf; ctx.fillRect(mx-R, my-R, R*2, R*2);
        
        ctx.fillStyle = 'rgba(5,12,28,0.64)';
        ctx.beginPath(); ctx.arc(mx - R * 0.38, my, R * 1.18, 0, Math.PI*2); ctx.fill();
        ctx.restore(); 

        if (surfY < this.H * 0.95) {
            ctx.save(); ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 9; i++) {
                const frac = i / 9, yy0 = surfY + 3 + (R*9 - 3) * frac, yy1 = surfY + 3 + (R*9 - 3) * (frac + 1/9);
                const wig = Math.sin(yy0 * 0.038 + t * 0.00095) * R * 0.45, colW = R * 2.6 * (1 - frac * 0.85);
                const rg = ctx.createLinearGradient(mx+wig-colW, yy0, mx+wig+colW, yy0);
                rg.addColorStop(0, 'rgba(210,228,255,0)'); rg.addColorStop(0.5, `rgba(210,228,255,${nf * 0.22 * (1-frac)})`); rg.addColorStop(1, 'rgba(210,228,255,0)');
                ctx.fillStyle = rg; ctx.fillRect(mx+wig-colW, yy0, colW*2, yy1-yy0+1);
            }
            ctx.restore();
        }
        ctx.restore();
    }
}

class Sun {
    constructor(private W: number, private H: number) {}
    draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number, t: number) {
        if (nf >= 1) return;
        const a = 1 - nf, R = Math.min(this.W, this.H) * 0.040;
        const sx = this.W * 0.765, sy = surfY * 0.12 + nf * surfY * 1.18;
        ctx.save(); ctx.globalAlpha = a;
        
        const haze = ctx.createRadialGradient(sx, sy, R, sx, sy, R*7);
        haze.addColorStop(0, `rgba(255,225,100,${a*0.22})`); haze.addColorStop(1, 'rgba(255,150,15,0)');
        ctx.beginPath(); ctx.arc(sx, sy, R*7, 0, Math.PI*2); ctx.fillStyle = haze; ctx.fill();
        
        ctx.shadowBlur = 48; ctx.shadowColor = '#FFD700'; ctx.fillStyle = '#FFFFE5';
        ctx.beginPath(); ctx.arc(sx, sy, R, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class Aurora {
    ph = 0; constructor(private W: number) {}
    tick() { this.ph += 0.0016; }
    draw(ctx: CanvasRenderingContext2D, nf: number, surfY: number) {
        if (nf < 0.50) return;
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        for (let b = 0; b < 3; b++) {
            const yBase = surfY * (0.05 + b * 0.09), hue = [162, 188, 142][b], bH = surfY * 0.16;
            const g = ctx.createLinearGradient(0, yBase, 0, yBase + bH);
            g.addColorStop(0, `hsla(${hue},80%,58%,0)`); g.addColorStop(0.44, `hsla(${hue},80%,58%,${(nf-0.5)*0.22 * (1-b*0.28)})`); g.addColorStop(1, `hsla(${hue},80%,58%,0)`);
            ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, yBase);
            for (let x = 0; x <= this.W; x += 18) ctx.lineTo(x, Math.min(yBase + Math.sin(x*0.0055 + this.ph + b*1.5)*22 + Math.sin(x*0.0122 + this.ph*1.8 + b)*10, surfY - 3));
            ctx.lineTo(this.W, yBase+bH); ctx.lineTo(0, yBase+bH); ctx.fill();
        }
        ctx.restore();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PARTICLES & PARALLAX MOUNTAINS
// ═══════════════════════════════════════════════════════════════════════════
class Bubble {
    x: number; y: number; r: number; vy: number; vx: number; phase: number; startY: number;
    constructor(private W: number, private H: number, surfY: number) {
        this.x = Math.random() * W; this.y = H - 12 - Math.random() * (H - surfY) * 0.5; this.startY = this.y;
        this.r = 1.5 + Math.random() * 5.5; this.vy = -(0.20 + Math.random() * 0.55);
        this.vx = (Math.random() - 0.5) * 0.28; this.phase = Math.random() * Math.PI * 2;
    }
    update(scrollSpeed: number) {
        this.phase += 0.038; this.x += this.vx + Math.sin(this.phase) * 0.22 - scrollSpeed * 0.9; this.y += this.vy;
    }
    draw(ctx: CanvasRenderingContext2D) {
        const a = (0.12 + clamp((this.startY - this.y)/220, 0, 1) * 0.48) * 0.68;
        ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = 'rgba(175,228,255,0.82)'; ctx.lineWidth = 0.75;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = 'rgba(215,248,255,0.07)'; ctx.fill();
        ctx.globalAlpha = a * 0.95; ctx.fillStyle = 'rgba(255,255,255,0.68)';
        ctx.beginPath(); ctx.arc(this.x - this.r*0.30, this.y - this.r*0.33, this.r*0.25, 0, Math.PI*2); ctx.fill();
        ctx.restore();
    }
}

class Plankton {
    x: number; y: number; vx: number; vy: number; r: number; phase: number; hue: number;
    constructor(private W: number, private H: number) {
        this.x = Math.random() * W; this.y = H * 0.58 + Math.random() * H * 0.40;
        this.vx = (Math.random() - 0.5) * 0.14; this.vy = (Math.random() - 0.5) * 0.10 - 0.025;
        this.r = 0.5 + Math.random() * 1.3; this.phase = Math.random() * Math.PI * 2;
        this.hue = [172, 188, 158, 202][Math.floor(Math.random() * 4)];
    }
    update(surfY: number, scrollSpeed: number) {
        this.phase += 0.022; this.x += this.vx - scrollSpeed * 0.4; this.y += this.vy;
        if (this.x < 0) this.x += this.W; if (this.x > this.W) this.x -= this.W;
        if (this.y < surfY + 38) this.y = this.H * 0.90; if (this.y > this.H) this.y = surfY + 42;
    }
    draw(ctx: CanvasRenderingContext2D, nf: number) {
        const a = (0.22 + Math.sin(this.phase) * 0.78) * (0.05 + nf * 0.18);
        if (a < 0.007) return;
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 5.5);
        grd.addColorStop(0, `hsla(${this.hue},90%,62%,${a})`); grd.addColorStop(1, `hsla(${this.hue},70%,42%,0)`);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r*5.5, 0, Math.PI*2); ctx.fillStyle = grd; ctx.fill();
    }
}

class MarineSnow {
    x: number; y: number; r: number; vy: number; vx: number; alpha: number; phase: number;
    constructor(private W: number, private H: number) {
        this.x = Math.random() * W; this.y = Math.random() * H; this.r = 0.32 + Math.random() * 0.90;
        this.vy = 0.07 + Math.random() * 0.16; this.vx = (Math.random() - 0.5) * 0.10;
        this.alpha = 0.04 + Math.random() * 0.11; this.phase = Math.random() * Math.PI * 2;
    }
    update(surfY: number, scrollSpeed: number) {
        this.phase += 0.018; this.x += this.vx + Math.sin(this.phase) * 0.06 - scrollSpeed * 0.6; this.y += this.vy;
        if (this.x < 0) this.x += this.W;
        if (this.y > this.H + 4) { this.y = surfY + 8; this.x = Math.random() * this.W; }
    }
    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = `rgba(195,218,232,${this.alpha})`;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();
    }
}

class DistantMountains {
    private scrollX = 0;
    constructor(private W: number, private H: number) {}
    update(speed: number) { this.scrollX += speed * 0.2; } // Deep parallax
    draw(ctx: CanvasRenderingContext2D, nf: number, baseY: number) {
        ctx.fillStyle = lerpColor('rgba(12, 55, 105, 0.5)', 'rgba(2, 10, 25, 0.6)', nf);
        ctx.beginPath(); ctx.moveTo(0, this.H);
        for(let x=0; x<=this.W; x+=25) {
            const rx = x + this.scrollX;
            const y = baseY - 80 + Math.sin(rx * 0.002) * 90 + Math.cos(rx * 0.005) * 30;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.W, this.H); ctx.fill();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SEAFLOOR (With Parallax Scrolling)
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
        for (let i = 0; i < 3000; i++) {
            ctx.fillStyle = `hsla(${28+Math.random()*22},52%,${38+Math.random()*28}%,${0.05+Math.random()*0.09})`;
            ctx.fillRect(Math.random()*256, Math.random()*256, 1+Math.random()*1.5, 1);
        }
        for (let i = 0; i < 60; i++) {
            ctx.fillStyle = `hsla(${24+Math.random()*20},38%,${30+Math.random()*22}%,${0.09+Math.random()*0.14})`;
            ctx.beginPath(); ctx.ellipse(Math.random()*256, Math.random()*256, 2+Math.random()*6, 1.2+Math.random()*3, Math.random()*Math.PI, 0, Math.PI*2); ctx.fill();
        }
        return c;
    }

    update(gameTime: number, scrollSpeed: number) {
        this.scrollX += scrollSpeed; // Scroll texture and geometry
        if (Math.floor(gameTime / 10000) % 3 === 0) this.targetHeight = Math.min(225, 60 + gameTime / 2200);
        else this.targetHeight = Math.max(60, this.targetHeight - 0.15);
        this.sandHeight += (this.targetHeight - this.sandHeight) * 0.008;
    }

    draw(ctx: CanvasRenderingContext2D, nf: number, t: number) {
        const W = this.W, H = this.H, baseY = H - this.sandHeight, step = 5;
        const bumps: number[] = [];
        for (let xi = 0; xi <= W + step; xi += step) {
            const rx = xi + this.scrollX; // Parallax geometry
            bumps.push(Math.sin(rx*0.012)*12 + Math.cos(rx*0.043)*5.5 + Math.sin(rx*0.092+t*0.0004)*2.2 + vnoise(rx*0.004+t*0.00008)*4);
        }

        ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, baseY + bumps[0]);
        for (let i = 1; i < bumps.length; i++) ctx.lineTo(i*step, baseY+bumps[i]);
        ctx.lineTo(W, H); ctx.closePath();

        const g = ctx.createLinearGradient(0, baseY, 0, H);
        g.addColorStop(0, lerpColor('#C89040', '#271908', nf * 0.88)); g.addColorStop(1, lerpColor('#562E08', '#0C0602', nf * 0.88));
        ctx.fillStyle = g; ctx.fill();

        if (this.tex) {
            ctx.save(); ctx.clip();
            const pat = ctx.createPattern(this.tex, 'repeat');
            if (pat) {
                // Parallax texture translation
                ctx.translate(-(this.scrollX % this.tex.width), 0);
                ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.42;
                ctx.fillStyle = pat; ctx.fillRect(0, 0, W + this.tex.width, H);
            }
            ctx.restore();
        }

        ctx.beginPath(); ctx.moveTo(0, baseY+bumps[0]);
        for (let i=1; i<bumps.length; i++) ctx.lineTo(i*step, baseY+bumps[i]);
        ctx.strokeStyle = `rgba(255,200,90,${0.48-nf*0.40})`; ctx.lineWidth = 2.2; ctx.stroke();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN CLASS
// ═══════════════════════════════════════════════════════════════════════════
export class SynapseBackground {
    gameWidth:  number; gameHeight: number;
    private wave: WaveEngine; private floor: SeaFloor; private mounts: DistantMountains;
    private moon: Moon; private sun: Sun; private aurora: Aurora;
    private stars: Star[]; private meteors: ShootingStar[]; private bubbles: Bubble[];
    private plankton: Plankton[]; private snow: MarineSnow[];
    private bubTimer = 0; private metTimer = 0; private surfY = 0; private waveAmp = 28; private wallT = 0;

    get sandHeight(): number { return this.floor.sandHeight; }

    constructor(W: number, H: number) {
        this.gameWidth = W; this.gameHeight = H;
        this.wave   = new WaveEngine(W, H); this.floor = new SeaFloor(W, H); this.mounts = new DistantMountains(W, H);
        this.moon   = new Moon(W, H); this.sun = new Sun(W, H); this.aurora = new Aurora(W);
        this.stars    = Array.from({length: 110}, () => new Star(W, H));
        this.meteors  = Array.from({length: 4},   () => new ShootingStar(W));
        this.bubbles  = [];
        this.plankton = Array.from({length: 50},  () => new Plankton(W, H));
        this.snow     = Array.from({length: 65},  () => new MarineSnow(W, H));
    }

    update(gameTime: number, delta: number, scrollSpeed: number): number {
        const C = 180_000, pos = (gameTime % C) / C;
        let nf = 0;
        if (pos < 0.25) nf = 0; else if (pos < 0.35) nf = (pos - 0.25) * 10; else if (pos < 0.75) nf = 1; else if (pos < 0.85) nf = 1 - (pos - 0.75) * 10;

        this.wallT = Date.now();
        const diff = clamp((this.floor.sandHeight - 60) / 165, 0, 1);
        this.waveAmp = Math.max(14, 30 * (1 - diff * 0.45));

        this.floor.update(gameTime, scrollSpeed);
        this.mounts.update(scrollSpeed);
        this.wave.scroll(scrollSpeed * 0.8);
        this.surfY = this.wave.surfaceY(this.gameWidth / 2, this.wallT, this.waveAmp);
        this.aurora.tick();

        this.metTimer += delta;
        if (this.metTimer > 4000 + Math.random() * 5800) {
            const m = this.meteors.find(s => !s.active); if (m) m.spawn(this.surfY); this.metTimer = 0;
        }
        this.meteors.forEach(s => s.update(this.surfY));

        this.bubTimer += delta;
        if (this.bubTimer > 720 + Math.random() * 1100) {
            this.bubbles.push(new Bubble(this.gameWidth, this.gameHeight, this.surfY)); this.bubTimer = 0;
        }
        this.bubbles = this.bubbles.filter(b => { b.update(scrollSpeed); return b.y > this.surfY + 2; });
        this.plankton.forEach(p => p.update(this.surfY, scrollSpeed));
        this.snow.forEach(s => s.update(this.surfY, scrollSpeed));

        return nf;
    }

    draw(ctx: CanvasRenderingContext2D, nf: number): void {
        const W = this.gameWidth, H = this.gameHeight, t = this.wallT, sy = this.surfY;

        // 1. SKY
        const sky = ctx.createLinearGradient(0, 0, 0, sy);
        sky.addColorStop(0, lerpColor('#1870c8', '#030d20', nf)); sky.addColorStop(1, lerpColor('#b5e2f5', '#142038', nf));
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

        // 2. SUN, MOON, AURORA, STARS
        const hPeak = Math.max(0, 1 - Math.abs(nf - 0.32) * 5.0);
        if (hPeak > 0.005) {
            const hg = ctx.createLinearGradient(0, sy * 0.52, 0, sy);
            hg.addColorStop(0, `rgba(255,85,10,0)`); hg.addColorStop(1, `rgba(255,148,52,${hPeak*0.30})`);
            ctx.fillStyle = hg; ctx.fillRect(0, sy * 0.52, W, sy * 0.48);
        }
        this.aurora.draw(ctx, nf, sy); this.sun.draw(ctx, nf, sy, t); this.moon.draw(ctx, nf, sy, t);
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, sy - 2); ctx.clip();
        this.stars.forEach(s => s.draw(ctx, nf, sy)); this.meteors.forEach(s => s.draw(ctx, nf, sy)); ctx.restore();

        // 3. DISTANT MOUNTAINS
        this.mounts.draw(ctx, nf, H - this.floor.sandHeight);

        // 4. WATER BODY
        const pts = this.wave.buildPts(t, this.waveAmp), nPts = pts.length;
        const wg = ctx.createLinearGradient(0, sy, 0, H);
        wg.addColorStop(0, lerpColor('#0f56a5', '#030b1c', nf)); wg.addColorStop(1, lerpColor('#083468', '#010509', nf));
        ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, pts[0].y);
        for (let i = 1; i < nPts; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[nPts-1].x, H); ctx.closePath(); ctx.fillStyle = wg; ctx.fill();

        // 5. DYNAMIC GOD RAYS
        if (nf < 0.6) {
            const a = (1 - nf / 0.6) * 0.12;
            ctx.save(); ctx.globalCompositeOperation = 'screen';
            ctx.beginPath(); ctx.rect(0, sy, W, H-sy); ctx.clip();
            for(let i=0; i<8; i++) {
                const phase = i * (Math.PI*2/8), sweep = Math.sin(t * 0.0004 + phase);
                const xTop = (W / 8) * i + sweep * 200, xBot = xTop + sweep * 400 + 100;
                const grad = ctx.createLinearGradient(xTop, sy, xBot, H);
                grad.addColorStop(0, `rgba(180, 240, 255, ${a})`); grad.addColorStop(1, `rgba(180, 240, 255, 0)`);
                ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(xTop-70, sy); ctx.lineTo(xTop+70, sy);
                ctx.lineTo(xBot+250, H); ctx.lineTo(xBot-250, H); ctx.fill();
            }
            ctx.restore();
        }

        // 6. SURFACE HIGHLIGHTS & PARTICLES
        ctx.beginPath(); ctx.moveTo(0, pts[0].y);
        for (let i=1; i<nPts; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = `rgba(255,255,255,${0.34 - nf*0.24})`; ctx.lineWidth = 1.7; ctx.stroke();

        ctx.save(); ctx.beginPath(); ctx.rect(0, sy+1, W, H-sy-1); ctx.clip();
        this.snow.forEach(s => s.draw(ctx)); this.plankton.forEach(p => p.draw(ctx, nf)); this.bubbles.forEach(b => b.draw(ctx));
        ctx.restore();

        // 7. DEPTH VIGNETTE & SEAFLOOR
        const vig = ctx.createRadialGradient(W/2, H*0.62, H*0.16, W/2, H*0.62, H*0.84);
        vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, `rgba(0,0,0,${0.26+nf*0.18})`);
        ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
        
        this.floor.draw(ctx, nf, t);
    }
}