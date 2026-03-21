// util/game-core/SynapsePlayer.ts
import { Particle } from "./SynapseParticles";

type PlayerStatus = "swimming" | "hit_ceiling" | "hit_floor";
type DeathReason  = "" | "stung" | "dried_out" | "crushed";

export class Player {
  gameWidth:  number;
  gameHeight: number;
  x:          number;
  y:          number;

  // VISUALS
  radius:         number;
  rotation:       number;
  targetRotation: number;
  tailPhase:      number;
  eyeBlinkTimer:  number;

  // PHYSICS
  velocity:       number;
  weight:         number = 0.18;
  buoyancy:       number = -2.2;
  maxUpwardSpeed: number = -7;

  // TIMERS
  surfaceTime:  number = 0;
  floorTime:    number = 0;
  maxSafeTime:  number = 5000;
  warnTime:     number = 2000;

  isDead:      boolean = false;
  deathReason: DeathReason = "";
  status:      PlayerStatus = "swimming";
  totalForce:  number = 0;

  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth  = gameWidth;
    this.gameHeight = gameHeight;
    this.x = 100;
    this.y = gameHeight / 2;

    this.radius         = 30;   // original size
    this.rotation       = 0;
    this.targetRotation = 0;
    this.velocity       = 0;
    this.tailPhase      = 0;
    this.eyeBlinkTimer  = 0;
  }

  // ─────────────────────────────────────────────────────────────────────────
  update(
    shouldSwim:    boolean,
    deltaTime:     number,
    sandHeight:    number,
    particles:     Particle[],
    nightFactor:   number,
  ): void {
    if (this.isDead) return;

    // 1. PHYSICS
    if (shouldSwim) {
      this.velocity += this.buoyancy;
      if (this.velocity < this.maxUpwardSpeed) this.velocity = this.maxUpwardSpeed;

      const pressureRatio = Math.min(1, Math.abs(this.velocity) / 6);
      this.totalForce += pressureRatio;

      if (Math.random() < 0.3 + pressureRatio * 0.5) {
        const bubbleCount = pressureRatio > 0.8 ? Math.floor(Math.random() * 3) + 1 : 1;
        for (let i = 0; i < bubbleCount; i++) {
          const angle = this.rotation;
          const tailX = (this.x - Math.cos(angle) * 35) + (Math.random() * 5 - 2.5);
          const tailY = (this.y - Math.sin(angle) * 35) + (Math.random() * 5 - 2.5);
          particles.push(new Particle(tailX, tailY, pressureRatio, true));
        }
      }
    } else {
      this.velocity += this.weight;
    }

    this.velocity *= 0.96;
    this.y += this.velocity;

    // 2. ANIMATION TIMERS
    const wagSpeed = shouldSwim ? 0.035 : 0.015;
    this.tailPhase += deltaTime * wagSpeed;

    this.eyeBlinkTimer += deltaTime;
    if (this.eyeBlinkTimer > 4150) this.eyeBlinkTimer = 0;

    // 3. BOUNDARIES
    const waterLevel  = this.gameHeight * 0.38;
    const floorLevel  = this.gameHeight - sandHeight - this.radius;
    const ceilLimit   = this.radius;

    if (this.y < waterLevel) {
      this.surfaceTime += deltaTime;
      this.floorTime    = 0;
      if (this.surfaceTime > this.maxSafeTime) this.status = "hit_ceiling";
      if (this.y < ceilLimit) { this.y = ceilLimit; this.velocity = 0; }
      this.targetRotation = this.velocity * 0.1;
    } else if (this.y > floorLevel) {
      this.y        = floorLevel;
      this.velocity = 0;
      this.floorTime += deltaTime;
      this.surfaceTime = 0;
      if (this.floorTime > this.maxSafeTime) this.status = "hit_floor";
      this.targetRotation = 0.1;
    } else {
      this.floorTime   = 0;
      this.surfaceTime = 0;
      this.status      = "swimming";
      this.targetRotation = this.velocity * 0.1;
    }

    this.rotation += (this.targetRotation - this.rotation) * 0.1;
  }

  // ─────────────────────────────────────────────────────────────────────────
  draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    const warnTime     = Math.max(this.surfaceTime, this.floorTime);
    const isRedPhase   = warnTime > this.warnTime;
    const isDangerPhase= warnTime > 4000;

    if (isDangerPhase) {
      const shake = (Math.random() - 0.5) * 5;
      ctx.translate(shake, shake);
    }

    ctx.rotate(this.rotation);

    const r         = this.radius;
    const wagOffset = Math.sin(this.tailPhase) * 18; // tail pivot oscillation
    const isBlinking= this.eyeBlinkTimer > 4000;

    // ── Body color ──────────────────────────────────────────────────────────
    // Day:  medium purple  rgb(138,92,208)  → Night: teal rgb(45,212,191)
    // Smooth continuous lerp — no hard threshold snap
    const nf  = nightFactor;
    const lerp = (a: number, b: number) => Math.round(a + (b - a) * nf);
    const bR  = lerp(138, 45);
    const bG  = lerp( 92,212);
    const bB  = lerp(208,191);
    const b2R = lerp(175, 94);
    const b2G = lerp(130,234);
    const b2B = lerp(235,212);
    const bodyColor  = isRedPhase ? "#ef4444" : `rgb(${bR},${bG},${bB})`;
    const bodyColor2 = isRedPhase ? "#fca5a5" : `rgb(${b2R},${b2G},${b2B})`;
    const finColor   = isRedPhase ? "rgba(239,100,60,0.72)" : `rgba(${bR},${bG},${bB},0.75)`;
    const finColor2  = isRedPhase ? "rgba(239,100,60,0.40)" : `rgba(${bR},${bG},${bB},0.38)`;

    // ════════════════════════════════════════════════════════════════════════
    // DRAW ORDER: tail → far pectoral → body → dorsal → anal → near pectoral → eye
    // This gives correct depth layering
    // ════════════════════════════════════════════════════════════════════════

    // ── 1. TAIL FIN ─────────────────────────────────────────────────────────
    // Pivots at the wrist of the tail, wags with wagOffset
    ctx.save();
    ctx.translate(-r * 0.85, 0);
    // Rotate tail so it fans around the wrist point
    const tailAngle = Math.sin(this.tailPhase) * 0.38;
    ctx.rotate(tailAngle);

    const tailGrad = ctx.createLinearGradient(-r * 1.4, 0, 0, 0);
    tailGrad.addColorStop(0, finColor2);
    tailGrad.addColorStop(0.55, finColor);
    tailGrad.addColorStop(1, bodyColor);
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    // Top lobe
    ctx.bezierCurveTo(-r * 0.3, -r * 0.3, -r * 1.1, -r * 0.8, -r * 1.4, -r * 0.85);
    ctx.bezierCurveTo(-r * 1.3, -r * 0.5, -r * 1.1, -r * 0.25, -r * 0.7, 0);
    // Bottom lobe (mirror)
    ctx.bezierCurveTo(-r * 1.1, r * 0.25, -r * 1.3, r * 0.5, -r * 1.4, r * 0.85);
    ctx.bezierCurveTo(-r * 1.1, r * 0.8, -r * 0.3, r * 0.3, 0, 0);
    ctx.closePath();
    ctx.fill();

    // Fin rays
    ctx.strokeStyle = finColor2;
    ctx.lineWidth   = 0.8;
    for (let i = 1; i <= 3; i++) {
      const d = i * 0.24;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-r * 0.5, -r * d, -r * 1.0, -r * (d + 0.2), -r * 1.35, -r * (0.85 - i * 0.15));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-r * 0.5, r * d, -r * 1.0, r * (d + 0.2), -r * 1.35, r * (0.85 - i * 0.15));
      ctx.stroke();
    }
    ctx.restore();

    // ── 2. FAR PECTORAL FIN (below body, behind head — other side) ──────────
    // Small transparent ellipse angled downward — looks like the far-side fin
    ctx.save();
    ctx.translate(r * 0.15, r * 0.35);
    ctx.rotate(0.55);
    const fpg = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.7);
    fpg.addColorStop(0, finColor2.replace(/[\d.]+\)$/, "0.30)"));
    fpg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.70, r * 0.26, 0, 0, Math.PI * 2);
    ctx.fillStyle = fpg;
    ctx.fill();
    ctx.restore();

    // ── 3. MAIN BODY ────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.ellipse(0, 0, r + 4, r * 0.78, 0, 0, Math.PI * 2);

    const bodyGrad = ctx.createLinearGradient(-r, -r * 0.78, r, r * 0.78);
    bodyGrad.addColorStop(0,    bodyColor);
    bodyGrad.addColorStop(0.45, bodyColor2);
    bodyGrad.addColorStop(1,    bodyColor);
    ctx.fillStyle   = bodyGrad;
    ctx.shadowColor = isRedPhase ? "#ef4444" : `rgb(${bR},${bG},${bB})`;
    ctx.shadowBlur  = isDangerPhase ? 30 : 14;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Belly shimmer
    const shimmer = ctx.createRadialGradient(r * 0.2, -r * 0.3, r * 0.05, r * 0.1, -r * 0.25, r * 0.7);
    shimmer.addColorStop(0, "rgba(255,255,255,0.28)");
    shimmer.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shimmer;
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.40)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // ── 4. DORSAL FIN (top, swept backward like a sail) ─────────────────────
    // Anchored at two points on top of the body — rear anchor moves with wag
    // This gives the fin a subtle flex as the tail moves
    const dorsalFlex = Math.sin(this.tailPhase) * 1.8; // subtle
    ctx.save();
    const dgFin = ctx.createLinearGradient(-r * 0.2, -r * 0.78, -r * 0.8, -r * 1.55);
    dgFin.addColorStop(0, finColor);
    dgFin.addColorStop(0.6, finColor2);
    dgFin.addColorStop(1, "rgba(180,240,235,0.55)");

    ctx.beginPath();
    // Front anchor on body top (near middle)
    ctx.moveTo(r * 0.12, -r * 0.72);
    // Sweep up and back to tip
    ctx.bezierCurveTo(
      r * 0.0,  -r * 1.45 + dorsalFlex,
      -r * 0.5, -r * 1.60 + dorsalFlex,
      -r * 0.82,-r * 1.30 + dorsalFlex * 0.5,
    );
    // Curve back down to rear anchor
    ctx.bezierCurveTo(
      -r * 0.7, -r * 0.95,
      -r * 0.4, -r * 0.82,
      -r * 0.18,-r * 0.76,
    );
    ctx.closePath();
    ctx.fillStyle = dgFin;
    ctx.fill();

    // Inner shadow on leading edge
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(r * 0.12, -r * 0.72);
    ctx.bezierCurveTo(r*0.0,-r*1.45+dorsalFlex,-r*0.5,-r*1.60+dorsalFlex,-r*0.82,-r*1.30+dorsalFlex*0.5);
    ctx.bezierCurveTo(-r*0.7,-r*0.95,-r*0.4,-r*0.82,-r*0.18,-r*0.76);
    ctx.clip();
    const ds = ctx.createLinearGradient(r*0.12,-r*0.72,-r*0.82,-r*1.3);
    ds.addColorStop(0, "rgba(0,0,0,0.22)");
    ds.addColorStop(0.4, "rgba(0,0,0,0)");
    ctx.fillStyle = ds;
    ctx.fillRect(-r*1.0, -r*1.8, r*1.4, r*1.2);
    ctx.restore();

    ctx.strokeStyle = finColor2;
    ctx.lineWidth   = 0.85;
    ctx.stroke();

    // Fin rays (3 — sweep from base toward tip)
    ctx.strokeStyle = finColor2.replace(/[\d.]+\)$/, "0.45)");
    ctx.lineWidth   = 0.65;
    ctx.beginPath(); ctx.moveTo(r*0.10,-r*0.74); ctx.bezierCurveTo(r*0.05,-r*1.10,-r*0.08,-r*1.38,-r*0.22,-r*1.50+dorsalFlex); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r*0.05,-r*0.75); ctx.bezierCurveTo(-r*0.15,-r*1.15,-r*0.35,-r*1.40,-r*0.55,-r*1.42+dorsalFlex*0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r*0.14,-r*0.75); ctx.bezierCurveTo(-r*0.28,-r*1.08,-r*0.50,-r*1.25,-r*0.70,-r*1.18+dorsalFlex*0.5); ctx.stroke();

    ctx.restore();

    // ── 5. ANAL FIN (bottom belly — small, swept backward) ──────────────────
    const analFlex = -Math.sin(this.tailPhase) * 1.4; // opposite phase to dorsal
    ctx.save();
    const agFin = ctx.createLinearGradient(0, r * 0.72, -r * 0.55, r * 1.35);
    agFin.addColorStop(0, finColor);
    agFin.addColorStop(0.65, finColor2);
    agFin.addColorStop(1, "rgba(180,240,235,0.45)");

    ctx.beginPath();
    ctx.moveTo(r * 0.05, r * 0.74);
    ctx.bezierCurveTo(
      -r * 0.10, r * 1.20 + analFlex,
      -r * 0.40, r * 1.38 + analFlex,
      -r * 0.60, r * 1.15 + analFlex * 0.5,
    );
    ctx.bezierCurveTo(-r * 0.45, r * 0.90, -r * 0.18, r * 0.80, -r * 0.08, r * 0.76);
    ctx.closePath();
    ctx.fillStyle = agFin;
    ctx.fill();

    ctx.strokeStyle = finColor2;
    ctx.lineWidth   = 0.8;
    ctx.stroke();

    // 2 rays
    ctx.strokeStyle = finColor2.replace(/[\d.]+\)$/, "0.40)");
    ctx.lineWidth   = 0.60;
    ctx.beginPath(); ctx.moveTo(r*0.02,r*0.76); ctx.bezierCurveTo(-r*0.12,r*1.05,-r*0.28,r*1.22,-r*0.42,r*1.18+analFlex*0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r*0.04,r*0.77); ctx.bezierCurveTo(-r*0.22,r*1.02,-r*0.38,r*1.12,-r*0.52,r*1.05+analFlex*0.5); ctx.stroke();

    ctx.restore();

    // ── 6. NEAR PECTORAL FIN (side fin near head — clearly visible) ─────────
    // Fans out from body side, slightly animated
    const pecFlex = Math.sin(this.tailPhase * 0.7) * 0.12; // gentle wave
    ctx.save();
    ctx.translate(r * 0.18, r * 0.12);
    ctx.rotate(-0.30 + pecFlex);

    const pfg = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.82);
    pfg.addColorStop(0, finColor);
    pfg.addColorStop(0.55, finColor2);
    pfg.addColorStop(1, "rgba(0,0,0,0)");

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(r * 0.10, r * 0.35, r * 0.25, r * 0.70, r * 0.18, r * 0.85);
    ctx.bezierCurveTo(r * 0.05, r * 0.70, -r * 0.15, r * 0.45, -r * 0.22, r * 0.18);
    ctx.closePath();
    ctx.fillStyle = pfg;
    ctx.fill();

    // Inner shadow on leading edge
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.bezierCurveTo(r*0.10,r*0.35,r*0.25,r*0.70,r*0.18,r*0.85);
    ctx.bezierCurveTo(r*0.05,r*0.70,-r*0.15,r*0.45,-r*0.22,r*0.18); ctx.clip();
    const ps = ctx.createLinearGradient(-r*0.22, 0, r*0.25, 0);
    ps.addColorStop(0, "rgba(0,0,0,0)");
    ps.addColorStop(0.6, "rgba(0,0,0,0)");
    ps.addColorStop(1, "rgba(0,0,0,0.20)");
    ctx.fillStyle = ps; ctx.fillRect(-r*0.24, -r*0.05, r*0.55, r*0.95);
    ctx.restore();

    ctx.strokeStyle = finColor2;
    ctx.lineWidth   = 0.7;
    ctx.stroke();

    // 2 rays
    ctx.strokeStyle = finColor2.replace(/[\d.]+\)$/, "0.45)");
    ctx.lineWidth   = 0.60;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(r*0.08,r*0.28,r*0.18,r*0.55,r*0.16,r*0.80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(-r*0.04,r*0.22,-r*0.08,r*0.44,-r*0.12,r*0.58); ctx.stroke();

    ctx.restore();

    // ── 7. EYE ──────────────────────────────────────────────────────────────
    ctx.beginPath();
    ctx.ellipse(r * 0.38, -r * 0.24, 7, isBlinking ? 0.8 : 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    if (!isBlinking) {
      // Pupil
      ctx.beginPath();
      ctx.arc(r * 0.38 + 2, -r * 0.24, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#0B1E33";
      ctx.fill();
      // Iris ring
      ctx.beginPath();
      ctx.arc(r * 0.38 + 1.5, -r * 0.24, 3, 0, Math.PI * 2);
      ctx.strokeStyle = nightFactor > 0.5 ? "#2DD4BF" : "#0891b2";
      ctx.lineWidth = 1.1;
      ctx.stroke();
      // Specular highlight
      ctx.beginPath();
      ctx.arc(r * 0.38 - 1.5, -r * 0.24 - 2.2, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fill();
    }

    // Eye outline
    ctx.beginPath();
    ctx.ellipse(r * 0.38, -r * 0.24, 7.5, isBlinking ? 1.2 : 7.5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(8,60,55,0.70)";
    ctx.lineWidth   = 1;
    ctx.stroke();

    // ── 8. MOUTH — subtle upward curve, like a gentle smile ─────────────────
    // Positioned ahead of the eye, front of the face
    ctx.save();
    ctx.beginPath();
    // Small arc: starts left, curves gently up then right — looks like a soft smile
    ctx.moveTo(r * 0.52, r * 0.06);
    ctx.bezierCurveTo(
      r * 0.60,  r * 0.18,   // control 1 — dips down in middle
      r * 0.74,  r * 0.20,   // control 2
      r * 0.80,  r * 0.08,   // end point
    );
    ctx.strokeStyle = `rgba(${Math.round(bR*0.45)},${Math.round(bG*0.35)},${Math.round(bB*0.55)},0.75)`;
    ctx.lineWidth   = 1.6;
    ctx.lineCap     = "round";
    ctx.stroke();
    // Tiny lower lip highlight — a fainter shorter arc just below
    ctx.beginPath();
    ctx.moveTo(r * 0.55, r * 0.13);
    ctx.bezierCurveTo(r * 0.63, r * 0.22, r * 0.72, r * 0.22, r * 0.78, r * 0.14);
    ctx.strokeStyle = `rgba(255,255,255,0.18)`;
    ctx.lineWidth   = 1.0;
    ctx.stroke();
    ctx.restore();

    // ── 9. ACCESSORIES ──────────────────────────────────────────────────────
    if (this.status === "hit_ceiling") {
      nightFactor < 0.5 ? this.drawSunglasses(ctx) : this.drawNightVision(ctx);
    }
    if (this.status === "hit_floor") this.drawSpeechBubble(ctx, "Zzz...");

    ctx.restore();
  }

  // ─────────────────────────────────────────────────────────────────────────
  drawSunglasses(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    ctx.beginPath(); ctx.arc(12, -7, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(26, -7, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "black"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(12, -7); ctx.lineTo(26, -7); ctx.stroke();
  }

  drawNightVision(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#00FF00";
    ctx.shadowBlur = 10; ctx.shadowColor = "#00FF00";
    ctx.beginPath(); ctx.arc(12, -7, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(26, -7, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,50,0,0.5)";
    ctx.fillRect(5, -12, 28, 10);
  }

  drawSpeechBubble(ctx: CanvasRenderingContext2D, text: string) {
    ctx.save();
    ctx.rotate(-this.rotation);
    ctx.font = "bold 16px sans-serif";
    const textWidth = ctx.measureText(text).width;
    const bx = -textWidth / 2;
    const by = -80;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.roundRect(bx - 10, by - 10, textWidth + 20, 30, 8);
    ctx.fill();
    ctx.fillStyle = "#0B1E33";
    ctx.fillText(text, 0, by + 12);
    ctx.restore();
  }
}