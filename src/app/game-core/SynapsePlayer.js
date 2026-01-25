export class Player {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.x = 100;
        this.y = gameHeight / 2;
        
        // VISUALS
        this.radius = 30; 
        this.image = new Image();
        this.image.src = "/images/fish.png"; 

        // RHYTHMIC PUMPING
        this.velocity = 0;
        
        // Gravity is lighter (Floaty feel)
        this.weight = 0.15;      
        
        // Buoyancy is STRONG (Burst feel)
        this.buoyancy = -2.0;   

        // Max Speed Cap (Prevents flying off screen too fast)
        this.maxUpwardSpeed = -6; 

        // TIMERS
        this.airTime = 0;       
        this.floorTime = 0;     
        this.maxTime = 3000;    
        
        this.isDead = false;
        this.deathReason = "";  
        this.status = "swimming"; 
    }
    //  ADD THIS FUNCTION INSIDE PLAYER CLASS
    checkCollision(obstacles) {
        if (!obstacles) return false;

        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            
            // Calculate distance between Player Center and Jellyfish Center
            const dx = this.x - obs.x;
            const dy = this.y - obs.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If circles touch (Hitbox overlap)
            // use * 0.8 to make the hitbox slightly smaller than the image 
            if (distance < (this.radius + obs.radius) * 0.8) {
                this.isDead = true;
                this.deathReason = "stung"; 
                return true;
            }
        }
        return false;
    }

    update(inputActive, deltaTime = 16.6, currentSandHeight = 50) {
        if (this.isDead) return; 

        // PHYSICS ENGINE (Updated for Pump-Style)
        this.status = "swimming"; 

        if (inputActive) {
            // APPLY STRONG BURST FORCE
            this.velocity += this.buoyancy; 
            
            // Cap the speed so they don't teleport instantly
            if (this.velocity < this.maxUpwardSpeed) {
                this.velocity = this.maxUpwardSpeed;
            }
        } else {
            // GRAVITY (Gentle sink)
            this.velocity += this.weight;   
        }

        // Air Resistance (Drag) slows the fish down smoothly after a burst
        this.velocity *= 0.95; 

        // Apply movement
        this.y += this.velocity;

        //  BOUNDARIES 
        const waterSurface = this.gameHeight * 0.42; 
        const floorLevel = this.gameHeight - currentSandHeight - this.radius;

        // Check Air
        if (this.y < waterSurface) {
            this.airTime += deltaTime;
            this.status = "hit_ceiling"; 
            if (this.airTime > this.maxTime) {
                this.isDead = true;
                this.deathReason = "dried_out";
            }
        } else {
            this.airTime = 0; 
        }

        // Check Floor
        if (this.y > floorLevel) { 
            this.y = floorLevel; 
            this.velocity = 0;
            this.status = "hit_floor"; 
            this.floorTime += deltaTime;
            if (this.floorTime > this.maxTime) {
                this.isDead = true;
                this.deathReason = "crushed";
            }
        } else {
            this.floorTime = 0; 
        }

        // Ceiling Hard Stop
        if (this.y < this.radius) {
            this.y = this.radius;
            this.velocity = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Rotationnn - Tilt up when swimming fast, tilt down when sinking
        // The divider- controls how much it tilts
        const angle = this.velocity / 10; 
        ctx.rotate(angle);

        // Visual Feedback for Danger
        if (this.airTime > 2000 || this.floorTime > 2000 || this.isDead) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#FF4500";
        }

        if (this.image.complete) {
            const size = this.radius * 2.8; 
            ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
        } else {
            ctx.fillStyle = "yellow";
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}    