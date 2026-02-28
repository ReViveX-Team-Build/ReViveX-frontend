// ─────────────────────────────────────────────────────────────────────────────
//  Particle  v3  — Underwater particle system
//
//  Types:
//    bubble   — small translucent sphere, rises with horizontal wobble
//    plankton — tiny slow-drifting mote
//    sparkle  — quick bright 4-point star fleck
//    dust     — god-ray mote, floats gently downward
//    exhaust  — player wake bubble (fires backward, shrinks fast)
// ─────────────────────────────────────────────────────────────────────────────

export type ParticleType = 'bubble' | 'plankton' | 'sparkle' | 'dust' | 'exhaust';

export class Particle {
  x:                 number;
  y:                 number;
  size:              number;
  speedX:            number;
  speedY:            number;
  color:             string;
  markedForDeletion: boolean = false;
  isBubble:          boolean = false;

  private type:       ParticleType;
  private alpha:      number;
  private alphaDecay: number;
  private wobbleAmp:  number;
  private wobbleFreq: number;
  private wobbleOff:  number;
  private age:        number = 0;
  private maxAge:     number;
  private shimmer:    number = 0;

  constructor(
    x: number,
    y: number,
    pressureRatio: number = 0,
    isBubble: boolean = false,
    type: ParticleType = isBubble ? 'bubble' : 'plankton'
  ) {
    this.x        = x;
    this.y        = y;
    this.isBubble = isBubble;
    this.type     = type;

    switch (type) {

      // ── Bubble: SMALLER — rim highlight + inner glint, wobbles as it rises ──
      case 'bubble':
        this.size       = 1.2 + Math.random() * 2.8 + pressureRatio * 2.0; // was 2.5+5.5
        this.speedX     = (Math.random() - 0.5) * 0.25;
        this.speedY     = -(0.7 + Math.random() * 1.0 + pressureRatio * 0.6);
        this.alpha      = 0.22 + Math.random() * 0.30;
        this.alphaDecay = 0.0014 + Math.random() * 0.0008;
        this.wobbleAmp  = 0.5 + Math.random() * 0.9;
        this.wobbleFreq = 0.028 + Math.random() * 0.018;
        this.wobbleOff  = Math.random() * Math.PI * 2;
        this.maxAge     = 200 + Math.random() * 100;
        this.color      = `rgba(190,235,255,${this.alpha.toFixed(2)})`;
        break;

      // ── Exhaust: player wake — slightly smaller too ────────────────────────
      case 'exhaust':
        this.size       = 1.5 + Math.random() * 3.0 + pressureRatio * 3.5; // was 2+4+5
        this.speedX     = -(1.8 + Math.random() * 2.0 + pressureRatio * 2.5);
        this.speedY     = (Math.random() - 0.5) * 0.8;
        this.alpha      = 0.40 + Math.random() * 0.28;
        this.alphaDecay = 0.024;
        this.wobbleAmp  = 0;
        this.wobbleFreq = 0;
        this.wobbleOff  = 0;
        this.maxAge     = 38 + Math.random() * 28;
        this.color      = `rgba(210,245,255,${this.alpha.toFixed(2)})`;
        break;

      // ── Plankton: tiny slow mote drifting in any direction ────────────────
      case 'plankton':
        this.size       = 0.7 + Math.random() * 1.6;
        this.speedX     = (Math.random() - 0.5) * 0.35;
        this.speedY     = (Math.random() - 0.5) * 0.25 - 0.04;
        this.alpha      = 0.28 + Math.random() * 0.42;
        this.alphaDecay = 0.0006 + Math.random() * 0.0005;
        this.wobbleAmp  = 0.14 + Math.random() * 0.18;
        this.wobbleFreq = 0.018 + Math.random() * 0.012;
        this.wobbleOff  = Math.random() * Math.PI * 2;
        this.maxAge     = 320 + Math.random() * 200;
        const g = 200 + Math.floor(Math.random() * 55);
        this.color = `rgba(120,${g},210,${this.alpha.toFixed(2)})`;
        break;

      // ── Sparkle: 4-point rotating star ────────────────────────────────────
      case 'sparkle':
        this.size       = 1.0 + Math.random() * 2.2;
        this.speedX     = (Math.random() - 0.5) * 0.5;
        this.speedY     = -0.12 - Math.random() * 0.22;
        this.alpha      = 0.70 + Math.random() * 0.30;
        this.alphaDecay = 0.022 + Math.random() * 0.014;
        this.wobbleAmp  = 0;
        this.wobbleFreq = 0;
        this.wobbleOff  = 0;
        this.shimmer    = Math.random() * Math.PI * 2;
        this.maxAge     = 22 + Math.random() * 18;
        this.color      = `rgba(255,252,210,${this.alpha.toFixed(2)})`;
        break;

      // ── Dust: god-ray mote, drifts very slowly downward ──────────────────
      case 'dust':
      default:
        this.size       = 0.5 + Math.random() * 1.2;
        this.speedX     = (Math.random() - 0.5) * 0.18;
        this.speedY     = 0.04 + Math.random() * 0.10;
        this.alpha      = 0.10 + Math.random() * 0.18;
        this.alphaDecay = 0.00030 + Math.random() * 0.00022;
        this.wobbleAmp  = 0.10 + Math.random() * 0.14;
        this.wobbleFreq = 0.012 + Math.random() * 0.010;
        this.wobbleOff  = Math.random() * Math.PI * 2;
        this.maxAge     = 500 + Math.random() * 400;
        this.color      = `rgba(230,245,255,${this.alpha.toFixed(2)})`;
        break;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  update(speedMultiplier: number = 1): void {
    this.age++;

    const wobble = this.wobbleAmp > 0
      ? Math.sin(this.age * this.wobbleFreq + this.wobbleOff) * this.wobbleAmp
      : 0;

    this.x += (this.speedX + wobble) * speedMultiplier;
    this.y += this.speedY * speedMultiplier;

    if (this.type === 'exhaust') this.size *= 0.95;

    this.alpha -= this.alphaDecay;
    if (this.type === 'sparkle') this.shimmer += 0.18;

    if (this.alpha <= 0 || this.age >= this.maxAge || this.size < 0.25)
      this.markedForDeletion = true;
  }

  // ─────────────────────────────────────────────────────────────────────────
  draw(ctx: CanvasRenderingContext2D): void {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));

    switch (this.type) {

      case 'bubble':
      case 'exhaust': {
        const r = this.size;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,235,255,0.15)`;
        ctx.fill();
        ctx.lineWidth   = Math.max(0.4, r * 0.20);
        ctx.strokeStyle = `rgba(220,248,255,${Math.min(1, this.alpha * 1.5).toFixed(2)})`;
        ctx.stroke();
        // Inner glint
        if (r > 1.2) {
          ctx.beginPath();
          ctx.arc(this.x - r * 0.28, this.y - r * 0.28, r * 0.26, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,0.55)`;
          ctx.fill();
        }
        break;
      }

      case 'plankton': {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        break;
      }

      case 'sparkle': {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.shimmer);
        const s = this.size;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const rad   = i % 2 === 0 ? s * 2.0 : s * 0.45;
          if (i === 0) ctx.moveTo(Math.cos(angle)*rad, Math.sin(angle)*rad);
          else         ctx.lineTo(Math.cos(angle)*rad, Math.sin(angle)*rad);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(255,252,200,${this.alpha.toFixed(2)})`;
        ctx.fill();
        break;
      }

      case 'dust':
      default: {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,245,255,${this.alpha.toFixed(2)})`;
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }
}