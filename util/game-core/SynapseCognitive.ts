// util/game-core/SynapseCognitive.ts
// ─────────────────────────────────────────────────────────────────────────────
//  Neural Pulse Shells — replaces the plain pearl system
//
//  TARGET  → Nautilus Shell  : smooth teal bioluminescent spiral, opens as
//            the fish approaches, shatters into arc-fragments on collect.
//  WRONG   → Spine Urchin    : jagged dark-purple spiny ball, implodes with
//            shockwave + ink cloud on wrong collect.
//
//  Public API is backward-compatible with page.tsx:
//    new Pearl(gameWidth, y, color, isTarget)
//    pearl.update(speed)
//    pearl.draw(ctx)
//    pearl.collected / pearl.markedForDeletion / pearl.isTarget / pearl.x / pearl.y / pearl.radius
// ─────────────────────────────────────────────────────────────────────────────

export interface CognitiveTask {
  instruction: string;
  targetColor: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

// ── Shared fragment types ─────────────────────────────────────────────────────
interface ArcFragment {
  angle: number;   // world-space angle
  dist:  number;   // current distance from origin
  speed: number;   // px/frame outward
  len:   number;   // arc length in radians
  alpha: number;
  hue:   number;
}

interface InkParticle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; alpha: number;
}

// ═══════════════════════════════════════════════════════════════════════════
//  NAUTILUS SHELL  (target)
// ═══════════════════════════════════════════════════════════════════════════
class NautilusShell {
  // ── Approach reaction ─────────────────────────────────────────────────
  private openAngle   = 0;        // 0 = closed, 1 = fully open
  private baseRadius: number;

  // ── Collection burst ──────────────────────────────────────────────────
  private fragments:  ArcFragment[] = [];
  private shockR      = 0;
  private shockAlpha  = 0;
  private bursting    = false;

  // ── Animation ─────────────────────────────────────────────────────────
  private rotation    = 0;
  private phase:      number;
  private spawnTime:  number;

  constructor(
    private x0: number,   // world X (updated each frame)
    private r:  number,   // base radius
  ) {
    this.baseRadius = r;
    this.phase      = Math.random() * Math.PI * 2;
    this.spawnTime  = Date.now();
  }

  // Build collection burst
  triggerBurst() {
    this.bursting  = true;
    this.shockR    = this.r * 0.5;
    this.shockAlpha= 1;
    this.fragments = [];
    for (let i = 0; i < 14; i++) {
      this.fragments.push({
        angle: (i / 14) * Math.PI * 2 + this.rotation,
        dist:  this.r * 0.8,
        speed: 2.2 + Math.random() * 3.8,
        len:   0.18 + Math.random() * 0.32,
        alpha: 0.9 + Math.random() * 0.1,
        hue:   168 + Math.random() * 30,   // teal range
      });
    }
  }

  get done() {
    return this.bursting && this.shockAlpha <= 0 && this.fragments.every(f => f.alpha <= 0);
  }

  update(fishX: number, fishY: number, worldY: number) {
    this.rotation += 0.008;

    // Approach detection — within 2.4× radius → shell opens
    const dx   = fishX - this.x0;
    const dy   = fishY - worldY;
    const dist = Math.hypot(dx, dy);
    const near = dist < this.r * 2.4;
    const targetOpen = near ? 1 : 0;
    this.openAngle  += (targetOpen - this.openAngle) * 0.08;

    if (this.bursting) {
      this.shockR     += 6;
      this.shockAlpha  = Math.max(0, this.shockAlpha - 0.045);
      for (const f of this.fragments) {
        f.dist  += f.speed;
        f.speed *= 0.93;
        // Fragments slowly spiral outward
        f.angle += 0.018;
        f.alpha  = Math.max(0, f.alpha - 0.022);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, wx: number, wy: number, scale: number) {
    const r   = this.r * scale;
    const now = Date.now();
    const t   = now * 0.001;

    ctx.save();
    ctx.translate(wx, wy);

    if (!this.bursting) {
      // ── Outer bioluminescent glow ────────────────────────────────────
      const pulse = 0.75 + Math.sin(t * 1.8 + this.phase) * 0.25;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.28 * pulse;
      const aura = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.6);
      aura.addColorStop(0,   'rgba(45,212,191,0.90)');
      aura.addColorStop(0.5, 'rgba(45,212,191,0.22)');
      aura.addColorStop(1,   'rgba(45,212,191,0)');
      ctx.beginPath(); ctx.arc(0, 0, r * 2.6, 0, Math.PI * 2);
      ctx.fillStyle = aura; ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.rotate(this.rotation);

      // ── Shell body: filled spiral ────────────────────────────────────
      // Draw Fibonacci-style spiral using bezier segments
      const shellCol = ctx.createRadialGradient(-r*0.2, -r*0.25, r*0.05, 0, 0, r);
      shellCol.addColorStop(0,    '#e8fffe');
      shellCol.addColorStop(0.28, '#7de8d8');
      shellCol.addColorStop(0.65, '#1ea89a');
      shellCol.addColorStop(1,    '#0a4a42');
      ctx.fillStyle = shellCol;
      ctx.shadowBlur  = 14 * pulse;
      ctx.shadowColor = '#2DD4BF';

      // Outer silhouette — slightly organic egg-like shell shape
      const openExtra = this.openAngle * r * 0.18;
      ctx.beginPath();
      ctx.ellipse(0, 0, r + openExtra, r * 0.92, 0, 0, Math.PI * 2);
      ctx.fill();

      // ── Spiral grooves (ridges) ───────────────────────────────────────
      ctx.shadowBlur = 0;
      const numRidges = 6;
      for (let ri = 0; ri < numRidges; ri++) {
        const ridgeFrac = (ri + 1) / (numRidges + 1);
        const ridgeR    = r * ridgeFrac;
        const ridgeAlpha = 0.15 + ridgeFrac * 0.35;
        const glowPulse  = 0.5 + Math.sin(t * 2.2 + this.phase + ri * 0.9) * 0.5;

        ctx.beginPath();
        ctx.arc(0, 0, ridgeR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(45,212,191,${ridgeAlpha * (0.6 + glowPulse * 0.4)})`;
        ctx.lineWidth   = 0.8 + ridgeFrac * 1.2;
        ctx.stroke();

        // Luminescent dot at each groove intersection
        if (glowPulse > 0.72) {
          const dotA = Math.random() * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(Math.cos(dotA) * ridgeR, Math.sin(dotA) * ridgeR, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180,255,245,${glowPulse * 0.8})`;
          ctx.fill();
        }
      }

      // ── Spiral arm ───────────────────────────────────────────────────
      // Golden spiral drawn with bezier
      ctx.beginPath();
      ctx.moveTo(r * 0.12, 0);
      let sr = r * 0.12;
      const goldenAngle = 0.3;
      for (let i = 0; i < 24; i++) {
        const a1 = i       * goldenAngle;
        const a2 = (i + 1) * goldenAngle;
        const r1 = sr;
        const r2 = sr * 1.14;
        ctx.quadraticCurveTo(
          Math.cos(a1 + goldenAngle * 0.5) * r1 * 1.2,
          Math.sin(a1 + goldenAngle * 0.5) * r1 * 1.2,
          Math.cos(a2) * r2,
          Math.sin(a2) * r2,
        );
        sr = r2;
        if (sr > r * 0.92) break;
      }
      ctx.strokeStyle = `rgba(200,255,248,${0.55 + pulse * 0.3})`;
      ctx.lineWidth   = 1.6;
      ctx.stroke();

      // ── Opening mouth highlight (approach reaction) ───────────────────
      if (this.openAngle > 0.05) {
        const mouthA = this.openAngle * Math.PI * 0.55;
        const mouthG = ctx.createRadialGradient(r*0.5, 0, 0, r*0.5, 0, r*0.6);
        mouthG.addColorStop(0,   `rgba(180,255,245,${this.openAngle * 0.8})`);
        mouthG.addColorStop(1,   'rgba(45,212,191,0)');
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, -mouthA, mouthA);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = mouthG;
        ctx.globalAlpha = this.openAngle * 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ── Specular highlight ────────────────────────────────────────────
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(-r*0.28, -r*0.30, r*0.30, r*0.14, -Math.PI/4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();

      ctx.restore(); // rotation

    } else {
      // ── BURST PHASE: shockwave ring + arc fragments ───────────────────
      if (this.shockAlpha > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, this.shockR * scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(45,212,191,${this.shockAlpha})`;
        ctx.lineWidth   = 3.5 * this.shockAlpha;
        ctx.shadowBlur  = 18;
        ctx.shadowColor = '#2DD4BF';
        ctx.stroke();
        ctx.shadowBlur  = 0;

        // Second ring slightly behind
        ctx.beginPath();
        ctx.arc(0, 0, (this.shockR - 12) * scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180,255,245,${this.shockAlpha * 0.5})`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }

      for (const f of this.fragments) {
        if (f.alpha <= 0) continue;
        const fx = Math.cos(f.angle) * f.dist * scale;
        const fy = Math.sin(f.angle) * f.dist * scale;
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(f.angle);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.55, 0, f.len);
        ctx.strokeStyle = `hsla(${f.hue},90%,72%,${f.alpha})`;
        ctx.lineWidth   = 2.8 * f.alpha;
        ctx.shadowBlur  = 10;
        ctx.shadowColor = `hsla(${f.hue},90%,72%,0.8)`;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    }

    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SPINE URCHIN  (wrong / distractor)
// ═══════════════════════════════════════════════════════════════════════════
class SpineUrchin {
  private spineCount  = 12;
  private spineLengths: number[];
  private spinePhases: number[];
  private rotation    = 0;
  private phase:      number;
  private spawnTime:  number;

  // Collection implosion
  private imploding   = false;
  private implodeT    = 0;          // 0 → 1
  private shockR      = 0;
  private shockAlpha  = 0;
  private inkParticles: InkParticle[] = [];

  constructor(private r: number) {
    this.phase      = Math.random() * Math.PI * 2;
    this.spawnTime  = Date.now();
    this.spineLengths = Array.from({ length: this.spineCount },
      () => r * (0.55 + Math.random() * 0.5));
    this.spinePhases  = Array.from({ length: this.spineCount },
      () => Math.random() * Math.PI * 2);
  }

  triggerImplosion() {
    this.imploding  = true;
    this.shockR     = this.r * 2.8;
    this.shockAlpha = 0.85;
    // Spawn ink cloud
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.6 + Math.random() * 2.4;
      this.inkParticles.push({
        x: 0, y: 0,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r:  3 + Math.random() * 8,
        alpha: 0.55 + Math.random() * 0.35,
      });
    }
  }

  get done() {
    return this.imploding && this.shockAlpha <= 0 && this.inkParticles.every(p => p.alpha <= 0);
  }

  update() {
    this.rotation -= 0.010;   // counter-clockwise
    if (this.imploding) {
      this.implodeT   = Math.min(1, this.implodeT + 0.06);
      this.shockR     = Math.max(0, this.shockR - 4.5);
      this.shockAlpha = Math.max(0, this.shockAlpha - 0.038);
      for (const p of this.inkParticles) {
        p.x     += p.vx; p.y += p.vy;
        p.vx    *= 0.96;  p.vy *= 0.96;
        p.r     *= 1.025; // expands as it diffuses
        p.alpha  = Math.max(0, p.alpha - 0.018);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, wx: number, wy: number, scale: number) {
    const r   = this.r * scale;
    const now = Date.now();
    const t   = now * 0.001;

    ctx.save();
    ctx.translate(wx, wy);

    if (!this.imploding) {
      // ── Outer warning glow ────────────────────────────────────────────
      const warnPulse = 0.5 + Math.sin(t * 2.6 + this.phase) * 0.5;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 0.18 * warnPulse;
      const aura = ctx.createRadialGradient(0, 0, r*0.3, 0, 0, r*2.2);
      aura.addColorStop(0,   'rgba(200,60,200,0.80)');
      aura.addColorStop(0.5, 'rgba(160,30,180,0.25)');
      aura.addColorStop(1,   'rgba(80,0,100,0)');
      ctx.beginPath(); ctx.arc(0, 0, r*2.2, 0, Math.PI*2);
      ctx.fillStyle = aura; ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.rotate(this.rotation);

      // ── Spines ────────────────────────────────────────────────────────
      for (let i = 0; i < this.spineCount; i++) {
        const ang    = (i / this.spineCount) * Math.PI * 2;
        const slen   = this.spineLengths[i] * scale;
        const wobble = Math.sin(t * 1.8 + this.spinePhases[i]) * 0.08;
        const angW   = ang + wobble;

        // Spine base (thick, dark purple)
        const x1 = Math.cos(angW) * r * 0.72;
        const y1 = Math.sin(angW) * r * 0.72;
        const x2 = Math.cos(angW) * (r * 0.72 + slen);
        const y2 = Math.sin(angW) * (r * 0.72 + slen);

        const spineG = ctx.createLinearGradient(x1, y1, x2, y2);
        spineG.addColorStop(0,   'rgba(140,40,180,0.95)');
        spineG.addColorStop(0.6, 'rgba(200,60,220,0.75)');
        spineG.addColorStop(1,   `rgba(255,80,255,${0.3 + warnPulse * 0.55})`);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = spineG;
        ctx.lineWidth   = 2.2 - (i % 3) * 0.3;
        ctx.lineCap     = 'round';
        ctx.shadowBlur  = 6 + warnPulse * 8;
        ctx.shadowColor = 'rgba(220,60,255,0.75)';
        ctx.stroke();

        // Glowing spine tip
        ctx.beginPath();
        ctx.arc(x2, y2, 2.0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,160,255,${0.5 + warnPulse * 0.4})`;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = 'rgba(255,100,255,0.8)';
        ctx.fill();
      }

      ctx.shadowBlur = 0;

      // ── Body ──────────────────────────────────────────────────────────
      const bodyG = ctx.createRadialGradient(-r*0.2, -r*0.2, r*0.05, 0, 0, r*0.72);
      bodyG.addColorStop(0,    '#c870e8');
      bodyG.addColorStop(0.35, '#7a22a0');
      bodyG.addColorStop(0.72, '#3a0858');
      bodyG.addColorStop(1,    '#1a0230');
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.fillStyle = bodyG;
      ctx.shadowBlur  = 12;
      ctx.shadowColor = 'rgba(160,40,200,0.7)';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Crack pattern on body (visual "wrong" cue)
      ctx.strokeStyle = 'rgba(255,120,255,0.28)';
      ctx.lineWidth   = 0.9;
      for (let c = 0; c < 4; c++) {
        const ca = (c / 4) * Math.PI * 2 + this.rotation * 0.3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ca) * r * 0.65, Math.sin(ca) * r * 0.65);
        ctx.stroke();
      }

      // Specular
      ctx.beginPath();
      ctx.ellipse(-r*0.22, -r*0.25, r*0.22, r*0.10, -Math.PI/4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,220,255,0.42)';
      ctx.fill();

      ctx.restore(); // rotation

    } else {
      // ── IMPLOSION: shrinking body + shockwave + ink ────────────────────
      const shrink = 1 - this.implodeT * 0.85;
      if (shrink > 0.05) {
        ctx.save();
        ctx.scale(shrink, shrink);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(60,10,80,${shrink})`;
        ctx.shadowBlur  = 20;
        ctx.shadowColor = 'rgba(200,0,255,0.6)';
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Contracting shockwave ring
      if (this.shockAlpha > 0) {
        ctx.beginPath();
        ctx.arc(0, 0, this.shockR * scale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200,60,255,${this.shockAlpha})`;
        ctx.lineWidth   = 4 * this.shockAlpha;
        ctx.shadowBlur  = 16;
        ctx.shadowColor = 'rgba(200,60,255,0.7)';
        ctx.stroke();
        ctx.shadowBlur  = 0;
      }

      // Ink cloud
      for (const p of this.inkParticles) {
        if (p.alpha <= 0) continue;
        const ig = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        ig.addColorStop(0,   `rgba(80,5,100,${p.alpha})`);
        ig.addColorStop(0.5, `rgba(50,0,70,${p.alpha * 0.5})`);
        ig.addColorStop(1,   'rgba(30,0,50,0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = ig;
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  PEARL — public wrapper (keeps page.tsx API identical)
// ═══════════════════════════════════════════════════════════════════════════
export class Pearl {
  x:                   number;
  y:                   number;
  radius:              number = 28;
  color:               string;
  isTarget:            boolean;
  markedForDeletion:   boolean = false;
  collected:           boolean = false;

  private baseY:       number;
  private phase:       number;
  private spawnTime:   number;
  private scale:       number = 0;          // pop-in

  // Inner renderers
  private shell:  NautilusShell | null = null;
  private urchin: SpineUrchin   | null = null;

  // Burst/implosion in progress
  private effectActive = false;

  constructor(gameWidth: number, y: number, color: string, isTarget: boolean) {
    this.x        = gameWidth + 60;
    this.baseY    = y;
    this.y        = y;
    this.color    = color;
    this.isTarget = isTarget;
    this.phase    = Math.random() * Math.PI * 2;
    this.spawnTime= Date.now();

    if (isTarget) {
      this.shell  = new NautilusShell(this.x, this.radius);
    } else {
      this.urchin = new SpineUrchin(this.radius);
    }
  }

  update(speed: number, fishX = -999, fishY = -999) {
    // Pop-in
    const age   = Date.now() - this.spawnTime;
    this.scale  = Math.min(1, age / 380);

    if (!this.effectActive) {
      this.x  -= speed;
      this.phase += 0.048;
      this.y  = this.baseY + Math.sin(this.phase) * 11;
    }

    if (this.shell)  this.shell.update(fishX, fishY, this.y);
    if (this.urchin) this.urchin.update();

    // Mark for deletion when off screen or burst finished
    if (this.x + this.radius * 6 < 0) {
      this.markedForDeletion = true;
    }
    if (this.effectActive) {
      const done = this.shell?.done ?? this.urchin?.done ?? true;
      if (done) this.markedForDeletion = true;
    }
  }

  // Called by collectPearl in page.tsx instead of just setting collected = true
  collect() {
    if (this.collected) return;
    this.collected    = true;
    this.effectActive = true;
    this.shell?.triggerBurst();
    this.urchin?.triggerImplosion();
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.scale < 0.01) return;
    const s = this.scale;

    if (this.shell)  this.shell.draw(ctx,  this.x, this.y, s);
    if (this.urchin) this.urchin.draw(ctx, this.x, this.y, s);

    // ── Pop-in ring ──────────────────────────────────────────────────────
    if (s < 1) {
      ctx.save();
      ctx.translate(this.x, this.y);
      const col = this.isTarget ? '45,212,191' : '180,60,220';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * s * 2.4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${col},${(1 - s) * 0.6})`;
      ctx.lineWidth   = 2.5 * (1 - s);
      ctx.stroke();
      ctx.restore();
    }
  }
}