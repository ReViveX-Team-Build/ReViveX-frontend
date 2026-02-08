import { Particle } from "./SynapseParticles";

// --- TYPES ---
interface Obstacle {
    x: number;
    y: number;
    radius: number;
}

type PlayerStatus = "swimming" | "hit_ceiling" | "hit_floor" | "burrowed";
type DeathReason = "" | "stung"; // Removed "dried_out" & "crushed" (converted to Soft Fails)

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

    // PHYSICS (Rhythmic Pump)
    velocity: number;
    weight: number;      // Gravity
    buoyancy: number;    // Upward force
    maxUpwardSpeed: number;

    // TIMERS & STATE
    airTime: number;
    floorTime: number;
    maxSafeTime: number; // Time before "Soft Fail" fully triggers
    
    isDead: boolean;
    deathReason: DeathReason;
    status: PlayerStatus;

    // CLINICAL METRICS
    totalForce: number; 

    constructor(gameWidth: number, gameHeight: number) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.x = 100;
        this.y = gameHeight / 2;
        
        // VISUALS
        this.radius = 30; 
        this.image = new Image();
        this.image.src = "/images/fish.png"; 
        this.rotation = 0;
        this.targetRotation = 0;

        // PHYSICS TUNING
        this.velocity = 0;
        this.weight = 0.18;      // Slightly heavier for better "release" feel
        this.buoyancy = -2.2;    // Strong burst
        this.maxUpwardSpeed = -7; 

        // TIMERS
        this.airTime = 0;       
        this.floorTime = 0;     
        this.maxSafeTime = 1000; // 1 second grace period before "Animation" starts
        
        this.isDead = false;
        this.deathReason = "";  
        this.status = "swimming"; 
        this.totalForce = 0;
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

    update(inputActive: boolean, deltaTime: number, sandHeight: number, particles: Particle[]): void {
        if (this.isDead) return;

        // --- 1. PHYSICS ENGINE ---
        if (inputActive) {
            // APPLY BURST
            this.velocity += this.buoyancy;
            if (this.velocity < this.maxUpwardSpeed) this.velocity = this.maxUpwardSpeed;

            // BIOFEEDBACK: Emit Bubbles based on "Effort" (Speed)
            const pressureRatio = Math.min(1, Math.abs(this.velocity) / 6);
            this.totalForce += pressureRatio;

            // Spawn bubbles at tail
            if (Math.random() > 0.4) {
                 // Calculate tail position based on rotation
                 const angle = this.rotation;
                 const tailX = this.x - Math.cos(angle) * 25;
                 const tailY = this.y - Math.sin(angle) * 25;
                 particles.push(new Particle(tailX, tailY, pressureRatio, true));
            }
        } else {
            this.velocity += this.weight;
        }

        // Drag / Air Resistance
        this.velocity *= 0.96; 
        this.y += this.velocity;

        // --- 2. BOUNDARY & SOFT FAIL LOGIC ---
        const waterSurface = 60; // Keep fish inside water, not flying into sky
        const floorLevel = this.gameHeight - sandHeight - this.radius;

        // A. CEILING (SUNGLASSES MODE)
        if (this.y < waterSurface) {
            this.y = waterSurface;
            this.velocity = 0;
            this.status = "hit_ceiling";
            this.targetRotation = -0.2; // Look slightly up at sun
            this.airTime += deltaTime;
        } 
        // B. FLOOR (BURROW MODE)
        else if (this.y > floorLevel) {
            this.y = floorLevel; // Snap to floor
            this.velocity = 0;
            this.status = "hit_floor";
            this.targetRotation = 0.1; // Slight tilt down
            this.floorTime += deltaTime;
        } 
        // C. SWIMMING (NORMAL)
        else {
            this.status = "swimming";
            this.airTime = 0;
            this.floorTime = 0;
            // Rotate based on velocity (Up = tilt up, Down = tilt down)
            this.targetRotation = this.velocity * 0.1;
        }

        // Smooth Rotation Lerp
        this.rotation += (this.targetRotation - this.rotation) * 0.1;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.x, this.y);

        // --- DRAWING LOGIC FOR STATES ---

        // 1. FLOOR STATE: Draw the "Hole" before the fish
        if (this.status === "hit_floor" && this.floorTime > 500) {
            const holeSize = Math.min(1, (this.floorTime - 500) / 1000); // Grow hole over 1s
            
            ctx.save();
            ctx.translate(0, this.radius + 10); // Move to bottom of fish
            ctx.scale(1, 0.3); // Flatten circle into oval
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.beginPath();
            ctx.arc(0, 0, 40 * holeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // SINK EFFECT: Translate fish down slightly to look like it's entering
            const sinkDepth = Math.min(15, (this.floorTime - 1000) * 0.02);
            if (sinkDepth > 0) ctx.translate(0, sinkDepth);
        }

        // 2. DRAW FISH BODY
        ctx.rotate(this.rotation);
        
        if (this.image.complete && this.image.naturalWidth > 0) {
            const size = this.radius * 2.8; 
            ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
        } else {
            // Fallback (Gold Circle)
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. CEILING STATE: Sunglasses
        if (this.status === "hit_ceiling") {
            this.drawSunglasses(ctx);
            // Optional: Speech Bubble
            if (this.airTime > 500) {
                 this.drawSpeechBubble(ctx, "Too Bright! 😎");
            }
        }

        // 4. FLOOR STATE: Zzz Text
        if (this.status === "hit_floor" && this.floorTime > 1500) {
             this.drawSpeechBubble(ctx, "Zzz... 😴");
        }

        ctx.restore();
    }

    // --- PROCEDURAL ACCESSORIES ---

    drawSunglasses(ctx: CanvasRenderingContext2D) {
        // Assuming Fish faces Right. Adjust offsets if your sprite faces Left.
        // Lens 1
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(12, -5, 6, 0, Math.PI*2);
        ctx.fill();

        // Lens 2
        ctx.beginPath();
        ctx.arc(22, -5, 6, 0, Math.PI*2);
        ctx.fill();

        // Frame
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, -5);
        ctx.lineTo(22, -5);
        ctx.stroke();

        // Glint
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(14, -7, 2, 0, Math.PI*2);
        ctx.arc(24, -7, 2, 0, Math.PI*2);
        ctx.fill();
    }

    drawSpeechBubble(ctx: CanvasRenderingContext2D, text: string) {
        ctx.save();
        // Reset rotation so text is always readable (upright)
        ctx.rotate(-this.rotation); 
        
        ctx.font = "bold 16px 'Inter', sans-serif";
        const textWidth = ctx.measureText(text).width;
        const p = 10; // Padding
        const bx = -textWidth/2; 
        const by = -60;

        // Bubble Body
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.roundRect(bx - p, by - p, textWidth + p*2, 30, 10);
        ctx.fill();

        // Bubble Tail
        ctx.beginPath();
        ctx.moveTo(0, by + 30 - p); // Bottom of bubble
        ctx.lineTo(-5, by + 40);    // Pointy bit
        ctx.lineTo(5, by + 30 - p);
        ctx.fill();

        // Text
        ctx.fillStyle = "#0B1E33";
        ctx.textAlign = "center";
        ctx.fillText(text, 0, by + 18);

        ctx.restore();
    }
}