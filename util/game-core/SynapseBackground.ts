// HELPER: Color Blending
function lerpColor(a: string, b: string, amount: number): string {
    const ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = (ah >> 8) & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = (bh >> 8) & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);
    return '#' + ((1 << 24) + (Math.round(rr) << 16) + (Math.round(rg) << 8) + Math.round(rb)).toString(16).slice(1);
}

/* ─────────────────────────────────────────────
   STAR  (unchanged, but with more stars)
───────────────────────────────────────────── */
class Star {
    x: number; y: number; size: number; offset: number; brightness: number;
    constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * (h * 0.55);
        this.size = Math.random() * 1.8 + 0.2;
        this.offset = Math.random() * Math.PI * 2;
        this.brightness = 0.4 + Math.random() * 0.6;
    }
    draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        if (nightFactor < 0.2) return;
        const twinkle = 0.7 + Math.sin(Date.now() * 0.002 + this.offset) * 0.3;
        const alpha = Math.max(0, twinkle * this.brightness * nightFactor);
        // Add a tiny cross-flare for larger stars
        if (this.size > 1.2) {
            ctx.strokeStyle = `rgba(255,255,240,${alpha * 0.5})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(this.x - this.size * 2.5, this.y);
            ctx.lineTo(this.x + this.size * 2.5, this.y);
            ctx.moveTo(this.x, this.y - this.size * 2.5);
            ctx.lineTo(this.x, this.y + this.size * 2.5);
            ctx.stroke();
        }
        ctx.fillStyle = `rgba(255,255,240,${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/* ─────────────────────────────────────────────
   SHOOTING STAR
───────────────────────────────────────────── */
class ShootingStar {
    x: number; y: number; vx: number; vy: number; life: number; maxLife: number; active: boolean;
    constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h * 0.3;
        this.vx = -(4 + Math.random() * 6);
        this.vy = 1 + Math.random() * 2;
        this.maxLife = 40 + Math.random() * 40;
        this.life = this.maxLife;
        this.active = false;
    }
    update(): void { if (this.active) { this.x += this.vx; this.y += this.vy; this.life--; if (this.life <= 0) this.active = false; } }
    draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        if (!this.active || nightFactor < 0.5) return;
        const p = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = p * nightFactor;
        const grad = ctx.createLinearGradient(this.x, this.y, this.x - this.vx * 8, this.y - this.vy * 8);
        grad.addColorStop(0, 'rgba(255,255,255,0.9)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 8, this.y - this.vy * 8);
        ctx.stroke();
        ctx.restore();
    }
}

/* ─────────────────────────────────────────────
   BIOLUMINESCENT PLANKTON
───────────────────────────────────────────── */
class Plankton {
    x: number; y: number; vx: number; vy: number;
    size: number; phase: number; color: string; gameW: number; gameH: number;
    constructor(w: number, h: number) {
        this.gameW = w; this.gameH = h;
        this.x = Math.random() * w;
        this.y = h * 0.3 + Math.random() * h * 0.7;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.2 - 0.05; // slight upward drift
        this.size = 0.8 + Math.random() * 2.2;
        this.phase = Math.random() * Math.PI * 2;
        // Colour palette: teal, cyan, lime-green, pale blue
        const colors = ['0,255,200', '0,220,255', '100,255,150', '180,255,255'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update(): void {
        this.x += this.vx;
        this.y += this.vy;
        this.phase += 0.04;
        if (this.x < 0) this.x = this.gameW;
        if (this.x > this.gameW) this.x = 0;
        if (this.y < this.gameH * 0.25) { this.y = this.gameH; }
        if (this.y > this.gameH) { this.y = this.gameH * 0.3; }
    }
    draw(ctx: CanvasRenderingContext2D): void {
        const pulse = 0.4 + Math.sin(this.phase) * 0.6;
        const alpha = pulse * 0.7;
        // Glow halo
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 4);
        grd.addColorStop(0, `rgba(${this.color},${alpha})`);
        grd.addColorStop(1, `rgba(${this.color},0)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        // Core dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color},${Math.min(1, alpha + 0.3)})`;
        ctx.fill();
    }
}

/* ─────────────────────────────────────────────
   CAUSTIC LIGHT RAY
   Shimmering god-rays from the surface
───────────────────────────────────────────── */
class CausticRay {
    x: number; width: number; phase: number; speed: number; gameH: number;
    constructor(w: number, h: number, index: number) {
        this.gameH = h;
        this.x = (w / 14) * index + Math.random() * 40;
        this.width = 15 + Math.random() * 40;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = 0.0005 + Math.random() * 0.0008;
    }
    draw(ctx: CanvasRenderingContext2D, nightFactor: number, surfaceY: number, time: number): void {
        if (nightFactor > 0.85) return; // Rays only in day/dusk
        const opacity = (1 - nightFactor * 0.9) * 0.06;
        if (opacity <= 0) return;

        const sway = Math.sin(time * this.speed + this.phase) * 25;
        const xTop = this.x + sway;
        const xBot = this.x + sway * 2.5;
        const rayH = this.gameH - surfaceY;

        const grad = ctx.createLinearGradient(xTop, surfaceY, xBot, surfaceY + rayH);
        grad.addColorStop(0,   `rgba(120,220,255,${opacity * 1.5})`);
        grad.addColorStop(0.4, `rgba(80,180,220,${opacity})`);
        grad.addColorStop(1,   `rgba(0,100,150,0)`);

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.moveTo(xTop - this.width / 2, surfaceY);
        ctx.lineTo(xTop + this.width / 2, surfaceY);
        ctx.lineTo(xBot + this.width * 1.8, surfaceY + rayH);
        ctx.lineTo(xBot - this.width * 0.5, surfaceY + rayH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }
}

/* ─────────────────────────────────────────────
   BUBBLE
───────────────────────────────────────────── */
class Bubble {
    x: number; y: number; r: number; vy: number; vx: number; phase: number; gameH: number;
    constructor(w: number, h: number) {
        this.gameH = h;
        this.x = Math.random() * w;
        this.y = h + 20;
        this.r = 2 + Math.random() * 6;
        this.vy = -(0.4 + Math.random() * 0.8);
        this.vx = (Math.random() - 0.5) * 0.4;
        this.phase = Math.random() * Math.PI * 2;
    }
    update(): void {
        this.phase += 0.05;
        this.x += this.vx + Math.sin(this.phase) * 0.3;
        this.y += this.vy;
    }
    get isDone(): boolean { return this.y < -10; }
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.globalAlpha = 0.5;
        // Rim highlight
        ctx.strokeStyle = 'rgba(180,240,255,0.7)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.stroke();
        // Inner sheen
        ctx.fillStyle = 'rgba(200,240,255,0.12)';
        ctx.fill();
        // Top specular dot
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

/* ─────────────────────────────────────────────
   WATER LAYER (overhauled with multi-wave)
───────────────────────────────────────────── */
class Layer {
    gameWidth: number; gameHeight: number;
    speedModifier: number; color: string;
    x: number; speed: number; baseY: number;
    waveHeightModifier: number;

    constructor(gameWidth: number, gameHeight: number, speedModifier: number, color: string, yOffset: number) {
        this.gameWidth = gameWidth; this.gameHeight = gameHeight;
        this.speedModifier = speedModifier; this.color = color;
        this.x = 0; this.speed = 2; this.baseY = yOffset;
        this.waveHeightModifier = 1.0;
    }
    update(difficulty: number): void {
        this.x -= this.speed * this.speedModifier;
        if (this.x <= -this.gameWidth) this.x = 0;
        this.waveHeightModifier = Math.max(0.3, 1.0 - difficulty * 0.5);
    }
    // Compute surface Y at an X position for caustic ray start
    getSurfaceY(time: number): number {
        return this.baseY + Math.sin(time * 0.002 + this.speedModifier) * (22 * this.waveHeightModifier);
    }
    draw(ctx: CanvasRenderingContext2D, time: number, nightFactor: number): void {
        const nightColor = lerpColor(this.color, '#000812', nightFactor * 0.7);
        ctx.fillStyle = nightColor;
        ctx.beginPath();
        this._drawWavePath(ctx, this.x, time);
        this._drawWavePath(ctx, this.x + this.gameWidth, time);
        ctx.fill();
    }
    private _drawWavePath(ctx: CanvasRenderingContext2D, offsetX: number, time: number): void {
        const wh = this.waveHeightModifier;
        const primary  = Math.sin(time * 0.002  + this.speedModifier)         * (22 * wh);
        const secondary = Math.sin(time * 0.0037 + this.speedModifier * 1.7)  * (10 * wh);
        const tertiary  = Math.cos(time * 0.0055 + this.speedModifier * 0.9)  * (5  * wh);

        const W = this.gameWidth;
        const H = this.gameHeight;

        ctx.moveTo(offsetX, H);
        ctx.lineTo(offsetX, this.baseY + primary + secondary + tertiary);

        // High-res wave using multiple sine components for natural look
        const step = 8;
        for (let xi = 0; xi <= W; xi += step) {
            const p  = Math.sin((xi / W) * Math.PI * 2.5 + time * 0.0025 + this.speedModifier)  * (20 * wh);
            const s  = Math.sin((xi / W) * Math.PI * 5.0 + time * 0.0038 + this.speedModifier)  * (8  * wh);
            const t  = Math.cos((xi / W) * Math.PI * 8.0 + time * 0.006  + this.speedModifier)  * (4  * wh);
            ctx.lineTo(offsetX + xi, this.baseY + p + s + t);
        }
        ctx.lineTo(offsetX + W, H);
    }
}

/* ─────────────────────────────────────────────
   DEEP-SEA PARTICLE (floating debris / marine snow)
───────────────────────────────────────────── */
class MarineSnow {
    x: number; y: number; r: number; vy: number; vx: number; alpha: number; gameW: number; gameH: number;
    constructor(w: number, h: number) {
        this.gameW = w; this.gameH = h;
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.r = 0.5 + Math.random() * 1.5;
        this.vy = 0.1 + Math.random() * 0.25;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.alpha = 0.1 + Math.random() * 0.25;
    }
    update(): void {
        this.x += this.vx; this.y += this.vy;
        if (this.y > this.gameH) { this.y = 0; this.x = Math.random() * this.gameW; }
    }
    draw(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = `rgba(200,230,255,${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
}

/* ─────────────────────────────────────────────
   AURORA (visible at night only, subtle)
───────────────────────────────────────────── */
class Aurora {
    gameWidth: number; gameHeight: number; phase: number;
    constructor(w: number, h: number) { this.gameWidth = w; this.gameHeight = h; this.phase = 0; }
    update(): void { this.phase += 0.003; }
    draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        if (nightFactor < 0.5) return;
        const alpha = (nightFactor - 0.5) * 0.12;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (let i = 0; i < 3; i++) {
            const yBase = this.gameHeight * (0.05 + i * 0.06);
            const grad = ctx.createLinearGradient(0, yBase, 0, yBase + 80);
            const hue = [160, 200, 140][i];
            grad.addColorStop(0,   `hsla(${hue},80%,60%,0)`);
            grad.addColorStop(0.5, `hsla(${hue},80%,60%,${alpha})`);
            grad.addColorStop(1,   `hsla(${hue},80%,60%,0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(0, yBase);
            const step = 30;
            for (let x = 0; x <= this.gameWidth; x += step) {
                const y = yBase + Math.sin(x * 0.008 + this.phase + i * 1.2) * 25
                              + Math.sin(x * 0.015 + this.phase * 1.5) * 12;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(this.gameWidth, yBase + 80);
            ctx.lineTo(0, yBase + 80);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}

/* ─────────────────────────────────────────────
   FIREFLY (unchanged API, improved visuals)
───────────────────────────────────────────── */
class Firefly {
    x: number; y: number; vx: number; vy: number; size: number; phase: number;
    constructor(w: number, h: number) {
        this.x = Math.random() * w; this.y = Math.random() * h * 0.55;
        this.vx = (Math.random() - 0.5) * 0.6; this.vy = (Math.random() - 0.5) * 0.4;
        this.size = 1.5 + Math.random() * 2.5;
        this.phase = Math.random() * Math.PI * 2;
    }
    update(w: number, h: number): void {
        this.phase += 0.03;
        this.x += this.vx + Math.sin(this.phase * 0.7) * 0.3;
        this.y += this.vy + Math.cos(this.phase * 0.5) * 0.2;
        if (this.x < 0) this.x = w; if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h * 0.55; if (this.y > h * 0.55) this.y = 0;
    }
    draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        if (nightFactor < 0.2) return;
        const pulse = 0.4 + Math.sin(this.phase * 2) * 0.6;
        const alpha = pulse * nightFactor * 0.8;
        const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 5);
        grd.addColorStop(0, `rgba(160,255,80,${alpha})`);
        grd.addColorStop(1, `rgba(160,255,80,0)`);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,255,180,${Math.min(1, alpha + 0.2)})`; ctx.fill();
    }
}

/* ─────────────────────────────────────────────
   UNDERWATER VOLUMETRIC DEPTH FOG
   Gradients layered on top of everything to
   give the feeling of depth pressure
───────────────────────────────────────────── */
function drawDepthFog(ctx: CanvasRenderingContext2D, w: number, h: number, nightFactor: number): void {
    // Horizontal depth bands — darker at bottom
    const fogGrad = ctx.createLinearGradient(0, h * 0.3, 0, h);
    fogGrad.addColorStop(0,   'rgba(0,15,30,0)');
    fogGrad.addColorStop(0.5, `rgba(0,10,25,${0.10 + nightFactor * 0.08})`);
    fogGrad.addColorStop(1,   `rgba(0,5,15,${0.30 + nightFactor * 0.15})`);
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, h * 0.3, w, h * 0.7);

    // Left & right vignette edges
    const leftGrad = ctx.createLinearGradient(0, 0, w * 0.18, 0);
    leftGrad.addColorStop(0, 'rgba(0,5,15,0.35)');
    leftGrad.addColorStop(1, 'rgba(0,5,15,0)');
    ctx.fillStyle = leftGrad; ctx.fillRect(0, 0, w * 0.18, h);

    const rightGrad = ctx.createLinearGradient(w, 0, w * 0.82, 0);
    rightGrad.addColorStop(0, 'rgba(0,5,15,0.35)');
    rightGrad.addColorStop(1, 'rgba(0,5,15,0)');
    ctx.fillStyle = rightGrad; ctx.fillRect(w * 0.82, 0, w * 0.18, h);
}

/* ─────────────────────────────────────────────
   SURFACE SHIMMER  (light dancing on top of water)
───────────────────────────────────────────── */
function drawSurfaceShimmer(ctx: CanvasRenderingContext2D, w: number, h: number,
                             surfaceY: number, nightFactor: number, time: number): void {
    if (nightFactor > 0.9) return;
    const alpha = (1 - nightFactor) * 0.18;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 18; i++) {
        const sx = (w / 18) * i + Math.sin(time * 0.001 + i * 0.7) * 20;
        const sy = surfaceY + Math.cos(time * 0.0013 + i) * 4;
        const shimmerW = 8 + Math.sin(time * 0.002 + i * 1.3) * 5;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, shimmerW * 2);
        grad.addColorStop(0, `rgba(180,240,255,${alpha * 1.5})`);
        grad.addColorStop(1, `rgba(100,200,220,0)`);
        ctx.beginPath(); ctx.ellipse(sx, sy, shimmerW, shimmerW * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
    }
    ctx.restore();
}

/* ─────────────────────────────────────────────
   MAIN CLASS
───────────────────────────────────────────── */
export class SynapseBackground {
    gameWidth: number;
    gameHeight: number;
    layers: Layer[];
    stars: Star[];
    shootingStars: ShootingStar[];
    fireflies: Firefly[];
    plankton: Plankton[];
    causticRays: CausticRay[];
    bubbles: Bubble[];
    marineSnow: MarineSnow[];
    aurora: Aurora;
    sandHeight: number;
    targetSandHeight: number;
    sandTextureCanvas: HTMLCanvasElement | null;

    private _bubbleTimer: number = 0;
    private _shootingTimer: number = 0;

    constructor(gameWidth: number, gameHeight: number) {
        this.gameWidth  = gameWidth;
        this.gameHeight = gameHeight;

        // Three water layers — richer, more distinct colours
        this.layers = [
            new Layer(gameWidth, gameHeight, 0.18, '#062840', gameHeight * 0.36),
            new Layer(gameWidth, gameHeight, 0.48, '#0a4060', gameHeight * 0.38),
            new Layer(gameWidth, gameHeight, 0.95, '#0d5878', gameHeight * 0.40),
        ];

        this.stars         = Array.from({ length: 70 }, () => new Star(gameWidth, gameHeight));
        this.shootingStars = Array.from({ length: 3 },  () => new ShootingStar(gameWidth, gameHeight));
        this.fireflies     = Array.from({ length: 18 }, () => new Firefly(gameWidth, gameHeight));
        this.plankton      = Array.from({ length: 80 }, () => new Plankton(gameWidth, gameHeight));
        this.causticRays   = Array.from({ length: 14 }, (_, i) => new CausticRay(gameWidth, gameHeight, i));
        this.bubbles       = [];
        this.marineSnow    = Array.from({ length: 60 }, () => new MarineSnow(gameWidth, gameHeight));
        this.aurora        = new Aurora(gameWidth, gameHeight);

        this.sandHeight       = 50;
        this.targetSandHeight = 50;
        this.sandTextureCanvas = this._createSandTexture();
    }

    private _createSandTexture(): HTMLCanvasElement | null {
        if (typeof document === 'undefined') return null;
        const canvas = document.createElement('canvas');
        canvas.width = 200; canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        for (let i = 0; i < 1200; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
            ctx.fillRect(Math.random() * 200, Math.random() * 200, 1 + Math.random(), 1 + Math.random());
            ctx.fillStyle = `rgba(255,220,140,${Math.random() * 0.08})`;
            ctx.fillRect(Math.random() * 200, Math.random() * 200, 1 + Math.random(), 1 + Math.random());
        }
        // Add some tiny pebble shapes
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(100,70,30,${0.05 + Math.random() * 0.1})`;
            ctx.beginPath();
            ctx.ellipse(Math.random() * 200, Math.random() * 200, 2 + Math.random() * 4, 1 + Math.random() * 2, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        return canvas;
    }

    update(gameTime: number): number {
        // ── DAY / NIGHT CYCLE (3 min) ──
        const CYCLE = 180000;
        const pos = (gameTime % CYCLE) / CYCLE;
        let nightFactor = 0;
        if      (pos < 0.25) nightFactor = 0;
        else if (pos < 0.35) nightFactor = (pos - 0.25) * 10;
        else if (pos < 0.75) nightFactor = 1;
        else if (pos < 0.85) nightFactor = 1 - (pos - 0.75) * 10;
        else                 nightFactor = 0;

        // ── SAND DIFFICULTY ──
        if (Math.floor(gameTime / 10000) % 3 === 0) {
            this.targetSandHeight = Math.min(220, 50 + gameTime / 2000);
        } else {
            this.targetSandHeight = Math.max(50, this.targetSandHeight - 0.2);
        }
        this.sandHeight += (this.targetSandHeight - this.sandHeight) * 0.01;

        const difficulty = (this.sandHeight - 50) / 150;
        this.layers.forEach(l => l.update(difficulty));
        this.fireflies.forEach(f => f.update(this.gameWidth, this.gameHeight));
        this.plankton.forEach(p => p.update());
        this.marineSnow.forEach(m => m.update());
        this.aurora.update();

        // Shooting stars
        this._shootingTimer += 16;
        if (this._shootingTimer > 3500 + Math.random() * 4000) {
            const s = this.shootingStars.find(ss => !ss.active);
            if (s) {
                s.x = Math.random() * this.gameWidth;
                s.y = Math.random() * this.gameHeight * 0.25;
                s.life = s.maxLife;
                s.active = true;
            }
            this._shootingTimer = 0;
        }
        this.shootingStars.forEach(s => s.update());

        // Bubble spawner
        this._bubbleTimer += 16;
        if (this._bubbleTimer > 400 + Math.random() * 800) {
            this.bubbles.push(new Bubble(this.gameWidth, this.gameHeight));
            this._bubbleTimer = 0;
        }
        this.bubbles = this.bubbles.filter(b => { b.update(); return !b.isDone; });

        return nightFactor;
    }

    draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        const time = Date.now();

        // ── 1. SKY GRADIENT ──
        const sky = ctx.createLinearGradient(0, 0, 0, this.gameHeight);
        if (nightFactor < 1) {
            sky.addColorStop(0,   lerpColor('#5ba8d9', '#030815', nightFactor));
            sky.addColorStop(0.3, lerpColor('#7bc8e8', '#08152e', nightFactor));
            sky.addColorStop(0.6, lerpColor('#b0e4f7', '#111828', nightFactor));
            sky.addColorStop(1,   '#020c1b');
        } else {
            sky.addColorStop(0,   '#030815');
            sky.addColorStop(0.5, '#08152e');
            sky.addColorStop(1,   '#020c1b');
        }
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        // ── 2. AURORA ──
        this.aurora.draw(ctx, nightFactor);

        // ── 3. CELESTIAL BODIES ──
        this._drawSun(ctx, nightFactor, time);
        this._drawMoon(ctx, nightFactor, time);

        // ── 4. STARS & SHOOTING STARS ──
        this.stars.forEach(s => s.draw(ctx, nightFactor));
        this.shootingStars.forEach(s => s.draw(ctx, nightFactor));

        // ── 5. FIREFLIES (surface, above water) ──
        this.fireflies.forEach(f => f.draw(ctx, nightFactor));

        // ── 6. WATER LAYERS ──
        this.layers.forEach(l => l.draw(ctx, time, nightFactor));

        // Surface Y for shimmer & caustics (use middle layer)
        const surfaceY = this.layers[1].getSurfaceY(time);

        // ── 7. CAUSTIC LIGHT RAYS (above and into water) ──
        this.causticRays.forEach(r => r.draw(ctx, nightFactor, surfaceY, time));

        // ── 8. SURFACE SHIMMER ──
        drawSurfaceShimmer(ctx, this.gameWidth, this.gameHeight, surfaceY, nightFactor, time);

        // ── 9. UNDERWATER BIOLUMINESCENCE & PARTICLES ──
        ctx.save();
        // Clip to below water surface so plankton stays underwater
        ctx.beginPath();
        ctx.rect(0, surfaceY, this.gameWidth, this.gameHeight);
        ctx.clip();
        this.plankton.forEach(p => p.draw(ctx));
        this.marineSnow.forEach(m => m.draw(ctx));
        this.bubbles.forEach(b => b.draw(ctx));
        ctx.restore();

        // ── 10. DEPTH FOG (volumetric underwater atmosphere) ──
        drawDepthFog(ctx, this.gameWidth, this.gameHeight, nightFactor);

        // ── 11. SAND ──
        this._drawSand(ctx, nightFactor, time);

        // ── 12. GLOBAL DEPTH TINT (done here so game objects are drawn after) ──
        // NOTE: The main loop's "DEPTH TINT" step can be kept or removed —
        // this one provides the base underwater colour cast
        ctx.fillStyle = `rgba(0,18,38,${0.08 + nightFactor * 0.07})`;
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
    }

    private _drawSun(ctx: CanvasRenderingContext2D, nightFactor: number, time: number): void {
        if (nightFactor >= 1) return;
        const alpha = 1 - nightFactor;
        const yPos  = 70 + nightFactor * 380;
        const x     = this.gameWidth - 110;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Outer corona
        const corona = ctx.createRadialGradient(x, yPos, 30, x, yPos, 100);
        corona.addColorStop(0,   'rgba(255,220,80,0.25)');
        corona.addColorStop(0.5, 'rgba(255,160,20,0.08)');
        corona.addColorStop(1,   'rgba(255,120,0,0)');
        ctx.beginPath();
        ctx.arc(x, yPos, 100, 0, Math.PI * 2);
        ctx.fillStyle = corona;
        ctx.fill();

        // Sun disk
        const sunGrad = ctx.createRadialGradient(x - 8, yPos - 8, 0, x, yPos, 38);
        sunGrad.addColorStop(0,   '#fff8c0');
        sunGrad.addColorStop(0.4, '#FFE140');
        sunGrad.addColorStop(1,   '#FF8C00');
        ctx.shadowBlur  = 50;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, yPos, 38, 0, Math.PI * 2);
        ctx.fillStyle = sunGrad;
        ctx.fill();

        // Surface reflection on water (sunset only)
        if (nightFactor > 0.2) {
            const refl = ctx.createLinearGradient(x - 60, this.gameHeight * 0.4, x + 60, this.gameHeight);
            refl.addColorStop(0,   `rgba(255,160,20,${alpha * 0.12})`);
            refl.addColorStop(1,   'rgba(255,160,20,0)');
            ctx.shadowBlur = 0;
            ctx.fillStyle  = refl;
            ctx.fillRect(x - 60, this.gameHeight * 0.38, 120, this.gameHeight * 0.62);
        }
        ctx.restore();
    }

    private _drawMoon(ctx: CanvasRenderingContext2D, nightFactor: number, time: number): void {
        if (nightFactor <= 0) return;
        const alpha = nightFactor;
        const yPos  = 380 - nightFactor * 310;
        const x     = 105;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Soft moon glow
        const glow = ctx.createRadialGradient(x, yPos, 20, x, yPos, 80);
        glow.addColorStop(0,   'rgba(220,240,255,0.15)');
        glow.addColorStop(1,   'rgba(180,210,255,0)');
        ctx.beginPath();
        ctx.arc(x, yPos, 80, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Moon disk
        const moonGrad = ctx.createRadialGradient(x - 8, yPos - 8, 0, x, yPos, 30);
        moonGrad.addColorStop(0,   '#FAFCF5');
        moonGrad.addColorStop(0.7, '#E8EEE0');
        moonGrad.addColorStop(1,   '#C8D4BC');
        ctx.shadowBlur  = 20;
        ctx.shadowColor = 'rgba(200,220,255,0.6)';
        ctx.beginPath();
        ctx.arc(x, yPos, 30, 0, Math.PI * 2);
        ctx.fillStyle = moonGrad;
        ctx.fill();

        // Craters
        ctx.shadowBlur = 0;
        const craters = [
            { ox: -8, oy: -5, r: 5 }, { ox: 9, oy: 8, r: 7 }, { ox: -3, oy: 12, r: 3.5 },
        ];
        craters.forEach(c => {
            ctx.fillStyle = 'rgba(180,195,170,0.4)';
            ctx.beginPath();
            ctx.arc(x + c.ox, yPos + c.oy, c.r, 0, Math.PI * 2);
            ctx.fill();
        });

        // Moon reflection on water
        const reflH = 80;
        const reflY = this.gameHeight - this.sandHeight - reflH;
        const refl  = ctx.createLinearGradient(x - 25, reflY, x + 25, reflY + reflH);
        refl.addColorStop(0,   `rgba(200,220,255,${0.08 * nightFactor})`);
        refl.addColorStop(0.5, `rgba(200,220,255,${0.15 * nightFactor})`);
        refl.addColorStop(1,   'rgba(200,220,255,0)');
        ctx.fillStyle = refl;
        ctx.fillRect(x - 25, reflY, 50, reflH);

        ctx.restore();
    }

    private _drawSand(ctx: CanvasRenderingContext2D, nightFactor: number, time: number): void {
        const sandTop = lerpColor('#D4A853', '#3a2c18', nightFactor);
        const sandBot = lerpColor('#7a3a0e', '#100a04', nightFactor);

        // Compute bump path
        const buildPath = () => {
            const bumps: number[] = [];
            for (let i = 0; i <= this.gameWidth; i += 6) {
                bumps.push(
                    Math.sin(i * 0.014) * 14
                    + Math.cos(i * 0.048) * 6
                    + Math.sin(i * 0.11 + time * 0.0005) * 2  // subtle animated ripple
                );
            }
            return bumps;
        };
        const bumps = buildPath();

        // ── Sand shape ──
        ctx.beginPath();
        ctx.moveTo(0, this.gameHeight);
        ctx.lineTo(0, this.gameHeight - this.sandHeight + bumps[0]);
        for (let i = 1; i < bumps.length; i++) {
            ctx.lineTo(i * 6, this.gameHeight - this.sandHeight + bumps[i]);
        }
        ctx.lineTo(this.gameWidth, this.gameHeight);
        ctx.closePath();

        // Base gradient
        const grad = ctx.createLinearGradient(0, this.gameHeight - this.sandHeight, 0, this.gameHeight);
        grad.addColorStop(0,   sandTop);
        grad.addColorStop(0.3, lerpColor('#9a5a20', '#221408', nightFactor));
        grad.addColorStop(1,   sandBot);
        ctx.fillStyle = grad;
        ctx.fill();

        // Grain texture overlay
        if (this.sandTextureCanvas) {
            ctx.save();
            ctx.clip();
            const pat = ctx.createPattern(this.sandTextureCanvas, 'repeat');
            if (pat) {
                ctx.fillStyle = pat;
                ctx.globalCompositeOperation = 'overlay';
                ctx.globalAlpha = 0.6;
                ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            }
            ctx.restore();
        }

        // ── Top rim: bright highlight + softer secondary line ──
        ctx.beginPath();
        ctx.moveTo(0, this.gameHeight - this.sandHeight + bumps[0]);
        for (let i = 1; i < bumps.length; i++) {
            ctx.lineTo(i * 6, this.gameHeight - this.sandHeight + bumps[i]);
        }
        ctx.strokeStyle = `rgba(255,220,120,${0.55 - nightFactor * 0.45})`;
        ctx.lineWidth   = 2.5;
        ctx.stroke();

        // Darker subsurface rim (gives sand a physical edge)
        ctx.strokeStyle = `rgba(80,40,10,${0.25 + nightFactor * 0.15})`;
        ctx.lineWidth   = 4;
        ctx.beginPath();
        ctx.moveTo(0, this.gameHeight - this.sandHeight + bumps[0] + 4);
        for (let i = 1; i < bumps.length; i++) {
            ctx.lineTo(i * 6, this.gameHeight - this.sandHeight + bumps[i] + 4);
        }
        ctx.stroke();

        // ── Bioluminescent sand shimmer at night ──
        if (nightFactor > 0.3) {
            const glowAlpha = (nightFactor - 0.3) * 0.12;
            const sandGlow  = ctx.createLinearGradient(0, this.gameHeight - this.sandHeight - 8, 0, this.gameHeight - this.sandHeight + 20);
            sandGlow.addColorStop(0,   `rgba(0,200,180,0)`);
            sandGlow.addColorStop(0.5, `rgba(0,200,180,${glowAlpha})`);
            sandGlow.addColorStop(1,   `rgba(0,200,180,0)`);
            ctx.beginPath();
            ctx.moveTo(0, this.gameHeight - this.sandHeight + bumps[0] - 6);
            for (let i = 1; i < bumps.length; i++) {
                ctx.lineTo(i * 6, this.gameHeight - this.sandHeight + bumps[i] - 6);
            }
            ctx.lineTo(this.gameWidth, this.gameHeight - this.sandHeight + 20);
            ctx.lineTo(0, this.gameHeight - this.sandHeight + 20);
            ctx.closePath();
            ctx.fillStyle = sandGlow;
            ctx.fill();
        }
    }
}