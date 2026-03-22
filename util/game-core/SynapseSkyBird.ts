// ─── SKY BIRD PLAYER ─────────────────────────────────────────────────────────
// Flappy Bird style player for the sky-themed memory game

import { Particle } from "./SynapseParticles";

type BirdStatus = "flying" | "hit_ceiling" | "hit_ground";

export class SkyBird {
    gameWidth: number;
    gameHeight: number;
    x: number;
    y: number;
    
    radius: number;
    rotation: number;
    targetRotation: number;
    velocity: number;
    
    // Physics - adjusted for therapy ball use (gentler, slower, less sensitive)
    gravity: number = 0.15;      // Reduced from 0.25 - falls slower
    jumpForce: number = -2.2;    // Further reduced - gentle therapy motion
    maxFallSpeed: number = 4;    // Reduced from 6 - slower fall
    maxRiseSpeed: number = -2.6; // Further reduced - moves only a bit
    
    status: BirdStatus = "flying";
    isDead: boolean = false;
    
    trail: {x: number, y: number, alpha: number}[] = [];

    constructor(gameWidth: number, gameHeight: number) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.x = 120;
        this.y = gameHeight / 2;
        
        this.radius = 26;
        this.rotation = 0;
        this.targetRotation = 0;
        this.velocity = 0;
    }

    jump(): void {
        if (this.isDead) return;
        this.velocity = this.jumpForce;
    }

    update(deltaTime: number, groundHeight: number): void {
        if (this.isDead) return;

        // Apply gravity
        this.velocity += this.gravity;
        
        // Clamp velocity
        if (this.velocity > this.maxFallSpeed) this.velocity = this.maxFallSpeed;
        if (this.velocity < this.maxRiseSpeed) this.velocity = this.maxRiseSpeed;

        this.y += this.velocity;

        // Boundaries
        const groundY = this.gameHeight - groundHeight;
        const ceilingLimit = this.radius;

        // Hit ceiling
        if (this.y < ceilingLimit) {
            this.y = ceilingLimit;
            this.velocity = 0;
            this.status = "hit_ceiling";
            this.targetRotation = -0.4;
        }
        // Hit ground
        else if (this.y > groundY) {
            this.y = groundY;
            this.velocity = 0;
            this.status = "hit_ground";
            this.targetRotation = 0.2;
        }
        // Flying (safe zone)
        else {
            this.status = "flying";
            this.targetRotation = this.velocity * 0.06;
        }

        // Smooth rotation
        this.rotation += (this.targetRotation - this.rotation) * 0.12;

        // Update trail
        this.updateTrail();
    }

    private updateTrail(): void {
        this.trail.unshift({ x: this.x, y: this.y, alpha: 0.5 });
        
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].alpha -= 0.06;
            if (this.trail[i].alpha <= 0) {
                this.trail.splice(i, 1);
            }
        }
        
        if (this.trail.length > 10) {
            this.trail.pop();
        }
    }

    draw(ctx: CanvasRenderingContext2D): void {
        // Draw trail
        this.trail.forEach((t, i) => {
            ctx.save();
            ctx.globalAlpha = t.alpha * 0.3;
            ctx.fillStyle = "#FBBF24";
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.radius * 0.4 * (1 - i/this.trail.length), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Warning flash if near boundaries
        if (this.status !== "flying") {
            const flash = (Math.sin(Date.now() * 0.015) + 1) / 2;
            ctx.shadowBlur = 12 + flash * 8;
            ctx.shadowColor = this.status === "hit_ceiling" ? "#FBBF24" : "#EF4444";
        }

        // Draw bird (yellow bird like Flappy Bird)
        this.drawBirdShape(ctx);

        ctx.restore();
    }

    private drawBirdShape(ctx: CanvasRenderingContext2D): void {
        // Body - yellow
        const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        bodyGrad.addColorStop(0, "#FEF08A");
        bodyGrad.addColorStop(0.7, "#FACC15");
        bodyGrad.addColorStop(1, "#EAB308");
        
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.2, this.radius, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye white
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(6, -6, 9, 0, Math.PI * 2);
        ctx.fill();

        // Eye pupil
        ctx.fillStyle = "#1F2937";
        ctx.beginPath();
        ctx.arc(8, -6, 4, 0, Math.PI * 2);
        ctx.fill();

        // Eye shine
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(6, -8, 2, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = "#F97316";
        ctx.beginPath();
        ctx.moveTo(this.radius * 0.8, 0);
        ctx.lineTo(this.radius * 1.3, 3);
        ctx.lineTo(this.radius * 0.8, 6);
        ctx.closePath();
        ctx.fill();

        // Wing
        const wingY = Math.sin(Date.now() * 0.015) * 5;
        ctx.fillStyle = "#EAB308";
        ctx.beginPath();
        ctx.ellipse(-4, wingY, this.radius * 0.5, this.radius * 0.35, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrow (concerned expression when near boundaries)
        if (this.status !== "flying") {
            ctx.strokeStyle = "#1F2937";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(12, -12);
            ctx.stroke();
        }
    }

    reset(): void {
        this.y = this.gameHeight / 2;
        this.velocity = 0;
        this.rotation = 0;
        this.targetRotation = 0;
        this.status = "flying";
        this.isDead = false;
        this.trail = [];
    }

    getBounds(): { left: number, right: number, top: number, bottom: number } {
        return {
            left: this.x - this.radius,
            right: this.x + this.radius,
            top: this.y - this.radius,
            bottom: this.y + this.radius
        };
    }
}

