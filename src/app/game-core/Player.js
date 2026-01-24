export class Player {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        // Position: Start slightly to the left, middle height
        this.x = 100;
        this.y = gameHeight / 2;
        
        // Visuals
        this.radius = 30; 
        this.image = new Image();
        this.image.src = "/images/fish.png"; 

        // Physics: "Rhythmic Pumping" Mechanics
        this.velocity = 0;
        this.weight = 0.15;      // Light gravity for floaty feel
        this.buoyancy = -2.0;    // Strong burst for swimming up
        this.maxUpwardSpeed = -6; 

        // State Management
        this.isDead = false;
        this.deathReason = "";  
        this.status = "swimming"; 
        
        // Safety Timers (prevent instant death at start)
        this.airTime = 0;       
        this.floorTime = 0;     
        this.maxTime = 5000;    
    }


    update(inputActive, deltaTime = 16.6, currentSandHeight = 50) {
        if (this.isDead) return; 

        // 1. Apply Forces
        this.status = "swimming"; 

        if (inputActive) {
            // Burst swim
            this.velocity += this.buoyancy; 
            if (this.velocity < this.maxUpwardSpeed) {
                this.velocity = this.maxUpwardSpeed;
            }
        } else {
            // Gravity sink
            this.velocity += this.weight;   
        }

        // Drag (Air resistance)
        this.velocity *= 0.95; 
        this.y += this.velocity;

        // 2. Boundary Checks
        const waterSurface = this.gameHeight * 0.42; 
        const floorLevel = this.gameHeight - currentSandHeight - this.radius;

        // Check Ceiling (Air)
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

        // Check Floor (Sand)
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

        // Absolute Ceiling Cap
        if (this.y < this.radius) {
            this.y = this.radius;
            this.velocity = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Tilt based on speed
        const angle = this.velocity / 10; 
        ctx.rotate(angle);

        // Visual warnings
        if (this.airTime > 2000 || this.floorTime > 2000 || this.isDead) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#FF4500";
        }

        // Draw Image or Fallback Circle
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