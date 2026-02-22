// util/game-core/SynapsePlayer.ts
import { Particle } from "./SynapseParticles";

// Types
type PlayerStatus = "swimming" | "hit_ceiling" | "hit_floor";
type DeathReason = "" | "stung" | "dried_out" | "crushed"; 

interface Obstacle {
    x: number;
    y: number;
    radius: number;
}

export class Player {
    gameWidth: number;
    gameHeight: number;
    x: number;
    y: number;
    
    // VISUALS
    radius: number;
    image: HTMLImageElement;
    rotation: number;
    targetRotation: number;

    // PHYSICS
    velocity: number;
    weight: number = 0.18;
    buoyancy: number = -2.2;
    maxUpwardSpeed: number = -7;

    // TIMERS (Safe Zones)
    surfaceTime: number = 0; 
    floorTime: number = 0;   
    maxSafeTime: number = 5000; 
    warnTime: number = 2000;    
    
    isDead: boolean = false;
    deathReason: DeathReason = ""; 
    status: PlayerStatus = "swimming";

    totalForce: number = 0; 

    constructor(gameWidth: number, gameHeight: number) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.x = 100;
        this.y = gameHeight / 2;
        
        this.radius = 30; 
        this.image = new Image();
        this.image.src = "/images/fish.png"; 
        this.rotation = 0;
        this.targetRotation = 0;
        this.velocity = 0; 
    }

    // UPDATE METHOD - THIS IS THE CRITICAL CHANGE
    // It now accepts 'shouldSwim' (boolean) instead of checking keys itself
    update(shouldSwim: boolean, deltaTime: number, sandHeight: number, particles: Particle[], nightFactor: number): void {
        if (this.isDead) return;

        // --- 1. PHYSICS ---
        if (shouldSwim) {
            this.velocity += this.buoyancy;
            if (this.velocity < this.maxUpwardSpeed) this.velocity = this.maxUpwardSpeed;

            // Bubble Logic
            const pressureRatio = Math.min(1, Math.abs(this.velocity) / 6);
            this.totalForce += pressureRatio;

            // Spawn bubbles when swimming
            if (Math.random() < 0.3 + (pressureRatio * 0.5)) {
                let bubbleCount = 1;
                if (pressureRatio > 0.8) bubbleCount = Math.floor(Math.random() * 3) + 1;
                
                for (let i = 0; i < bubbleCount; i++) {
                     const angle = this.rotation;
                     const tailX = (this.x - Math.cos(angle) * 25) + (Math.random() * 5 - 2.5);
                     const tailY = (this.y - Math.sin(angle) * 25) + (Math.random() * 5 - 2.5);
                     // Note: Ensure Particle class constructor supports this signature!
                     particles.push(new Particle(tailX, tailY, pressureRatio, true));
                }
            }
        } else {
            this.velocity += this.weight;
        }

        this.velocity *= 0.96; 
        this.y += this.velocity;

        // --- 2. BOUNDARIES ---
        const waterLevel = this.gameHeight * 0.38; 
        const floorLevel = this.gameHeight - sandHeight - this.radius;
        const ceilingLimit = this.radius;

        // Air
        if (this.y < waterLevel) {
            this.surfaceTime += deltaTime;
            this.floorTime = 0; 
            if (this.surfaceTime > this.maxSafeTime) this.status = "hit_ceiling";
            
            if (this.y < ceilingLimit) {
                this.y = ceilingLimit;
                this.velocity = 0;
            }
            this.targetRotation = -0.3;
        } 
        // Floor
        else if (this.y > floorLevel) {
            this.y = floorLevel;
            this.velocity = 0;
            this.floorTime += deltaTime;
            this.surfaceTime = 0; 
            if (this.floorTime > this.maxSafeTime) this.status = "hit_floor";
            this.targetRotation = 0.1;
        } 
        // Water
        else {
            this.floorTime = 0; 
            this.surfaceTime = 0;
            this.status = "swimming";
            this.targetRotation = this.velocity * 0.1;
        }

        this.rotation += (this.targetRotation - this.rotation) * 0.1;
    }

    draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        ctx.save();
        ctx.translate(this.x, this.y);

        const warningTime = Math.max(this.surfaceTime, this.floorTime);
        const isRedPhase = warningTime > this.warnTime; 
        const isDangerPhase = warningTime > 4000;

        if (isDangerPhase) {
            const shake = (Math.random() - 0.5) * 5;
            ctx.translate(shake, shake);
        }

        ctx.rotate(this.rotation);

        if (this.image.complete && this.image.naturalWidth > 0) {
            const size = this.radius * 2.8; 
            if (isRedPhase) {
                const pulse = (Math.sin(Date.now() * 0.01) + 1) / 2; 
                ctx.shadowBlur = 20 + (pulse * 20);
                ctx.shadowColor = isDangerPhase ? "#FF0000" : "#FF4500"; 
            }
            ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = isRedPhase ? "#FF4444" : "#FFD700";
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Accessories based on Night Factor
        if (this.status === "hit_ceiling") {
            if (nightFactor < 0.5) this.drawSunglasses(ctx);
            else this.drawNightVision(ctx);
        }

        if (this.status === "hit_floor") {
             this.drawSpeechBubble(ctx, "Zzz...");
        }

        ctx.restore();
    }

    drawSunglasses(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.arc(12, -5, 6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(22, -5, 6, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = "black"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(12, -5); ctx.lineTo(22, -5); ctx.stroke();
    }

    drawNightVision(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = "#00FF00";
        ctx.shadowBlur = 10; ctx.shadowColor = "#00FF00";
        ctx.beginPath(); ctx.arc(12, -5, 6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(22, -5, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "rgba(0, 50, 0, 0.5)"; 
        ctx.fillRect(8, -8, 20, 6);
    }

    drawSpeechBubble(ctx: CanvasRenderingContext2D, text: string) {
        ctx.save();
        ctx.rotate(-this.rotation); 
        ctx.font = "bold 16px sans-serif";
        const textWidth = ctx.measureText(text).width;
        const bx = -textWidth/2; 
        const by = -70;
        ctx.fillStyle = "white";
        ctx.fillRect(bx - 10, by - 10, textWidth + 20, 30);
        ctx.fillStyle = "#0B1E33";
        ctx.fillText(text, 0, by + 18);
        ctx.restore();
    }
}