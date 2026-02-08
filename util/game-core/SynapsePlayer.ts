import { Particle } from "./SynapseParticles";

interface Obstacle {
    x: number;
    y: number;
    radius: number;
}

type PlayerStatus = "swimming" | "hit_ceiling" | "hit_floor";
type DeathReason = "" | "stung"; 

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

    // Timers for the 5-Second Rule
    surfaceTime: number = 0; 
    floorTime: number = 0;   
    maxSafeTime: number = 5000; // 5 Seconds Grace Period
    
    isDead: boolean = false;
    deathReason: DeathReason = "";
    status: PlayerStatus = "swimming";

    // METRICS
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
        this.velocity = 0; // Initialize velocity
    }

    checkCollision(obstacles: Obstacle[]): boolean {
        if (!obstacles) return false;
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            const dx = this.x - obs.x;
            const dy = this.y - obs.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (this.radius + obs.radius) * 0.8) {
                this.isDead = true;
                this.deathReason = "stung"; 
                return true;
            }
        }
        return false;
    }

    //  Added 'nightFactor' t
    update(inputActive: boolean, deltaTime: number, sandHeight: number, particles: Particle[], nightFactor: number): void {
        if (this.isDead) return;

        // --- 1. PHYSICS ---
        if (inputActive) {
            this.velocity += this.buoyancy;
            if (this.velocity < this.maxUpwardSpeed) this.velocity = this.maxUpwardSpeed;

            // Biofeedback Bubbles
            const pressureRatio = Math.min(1, Math.abs(this.velocity) / 6);
            this.totalForce += pressureRatio;

            if (Math.random() > 0.4) {
                 const angle = this.rotation;
                 const tailX = this.x - Math.cos(angle) * 25;
                 const tailY = this.y - Math.sin(angle) * 25;
                 particles.push(new Particle(tailX, tailY, pressureRatio, true));
            }
        } else {
            this.velocity += this.weight;
        }

        this.velocity *= 0.96; 
        this.y += this.velocity;

        // --- 2. BOUNDARY LOGIC (TIMED 5 SECONDS) ---
        const waterSurface = 60; 
        const floorLevel = this.gameHeight - sandHeight - this.radius;

        // A. CEILING ZONE
        if (this.y < waterSurface) {
            this.y = waterSurface;
            this.velocity = 0;
            
            //  Increment Timer
            this.surfaceTime += deltaTime;
            this.floorTime = 0; // Reset floor timer
            
            // Fail ONLY after 5 seconds
            if (this.surfaceTime > this.maxSafeTime) {
                this.status = "hit_ceiling";
            } else {
                this.status = "swimming"; // Warning state handled in draw()
            }
            this.targetRotation = -0.2;
        } 
        // B. FLOOR ZONE
        else if (this.y > floorLevel) {
            this.y = floorLevel;
            this.velocity = 0;
            
            // NEW: Increment Timer
            this.floorTime += deltaTime;
            this.surfaceTime = 0; 
            
            // Fail ONLY after 5 seconds
            if (this.floorTime > this.maxSafeTime) {
                this.status = "hit_floor";
            } else {
                this.status = "swimming";
            }
            this.targetRotation = 0.1;
        } 
        // C. SAFE ZONE
        else {
            this.floorTime = 0; 
            this.surfaceTime = 0;
            this.status = "swimming";
            this.targetRotation = this.velocity * 0.1;
        }

        this.rotation += (this.targetRotation - this.rotation) * 0.1;
    }

    //  Helper for Menu Animation
    hover(time: number): void {
        this.y = (this.gameHeight / 2) + Math.sin(time * 0.002) * 30;
        this.velocity = 0;
        this.rotation = 0;
        this.status = "swimming";
    }

    // CHANGED: Added 'nightFactor' to draw method for Day/Night awareness
    draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        ctx.save();
        ctx.translate(this.x, this.y);

        // --- 1. NEW: VISUAL WARNING (Red Glow) ---
        const warningTime = Math.max(this.surfaceTime, this.floorTime);
        
        // If timer is running but hasn't failed yet
        if (warningTime > 0 && warningTime < this.maxSafeTime) {
            const urgency = warningTime / this.maxSafeTime; // 0.0 to 1.0
            
            // Pulse Red Glow
            ctx.shadowBlur = 20 + (Math.sin(Date.now() * 0.02) * 10);
            ctx.shadowColor = `rgba(255, 0, 0, ${urgency})`;
            
            // Shake Effect
            ctx.translate((Math.random() - 0.5) * (urgency * 3), 0);
            
            // Warning Text
            ctx.save();
            ctx.rotate(-this.rotation);
            ctx.fillStyle = `rgba(255, 100, 100, ${urgency})`;
            ctx.font = "bold 14px Arial";
            ctx.fillText(this.surfaceTime > 0 ? "Dive Down!" : "Swim Up!", -30, -50);
            
            // Countdown Bar
            ctx.fillStyle = "red";
            ctx.fillRect(-30, -45, 60 * (1 - urgency), 5);
            ctx.restore();
        }

        // --- 2. DRAW FISH ---
        ctx.rotate(this.rotation);
        if (this.image.complete && this.image.naturalWidth > 0) {
            const size = this.radius * 2.8; 
            ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
        } else {
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // --- 3. NEW: CONTEXT AWARE ACCESSORIES ---
        
        // A. CEILING FAIL
        if (this.status === "hit_ceiling") {
            if (nightFactor < 0.5) {
                // DAY: Sunglasses
                this.drawSunglasses(ctx);
                this.drawSpeechBubble(ctx, "Too Bright! 😎");
            } else {
                // NIGHT: Night Vision Goggles
                this.drawNightVision(ctx);
                this.drawSpeechBubble(ctx, "Too Cold! 🥶");
            }
        }

        // B. FLOOR FAIL
        if (this.status === "hit_floor") {
             this.drawSpeechBubble(ctx, "Zzz... 😴");
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

    // NEW: Night Vision Goggles
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
        ctx.font = "bold 16px 'Inter', sans-serif";
        const textWidth = ctx.measureText(text).width;
        const p = 10; 
        const bx = -textWidth/2; 
        const by = -70;

        ctx.fillStyle = "white";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx - p, by - p, textWidth + p*2, 30, 10);
        else ctx.rect(bx - p, by - p, textWidth + p*2, 30);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, by + 30 - p); 
        ctx.lineTo(-5, by + 40);    
        ctx.lineTo(5, by + 30 - p);
        ctx.fill();

        ctx.fillStyle = "#0B1E33";
        ctx.textAlign = "center";
        ctx.fillText(text, 0, by + 18);
        ctx.restore();
    }
}