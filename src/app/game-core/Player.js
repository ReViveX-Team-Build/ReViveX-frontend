export class Player {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        this.x = 100;
        this.y = gameHeight / 2;
        
        this.radius = 30; 
        this.image = new Image();
        this.image.src = "/images/fish.png"; 

        this.velocity = 0;
        this.weight = 0.15;      
        this.buoyancy = -2.0;    
        this.maxUpwardSpeed = -6; 

        // TIMERS FIXED HERE
        this.airTime = 0;       
        this.floorTime = 0;     
        this.maxTime = 3000; // Fixed to 3 seconds for instant feedback
        
        this.isDead = false;
        this.deathReason = "";  
        this.status = "swimming"; 
    }

    update(inputActive, deltaTime = 16.6, currentSandHeight = 50) {
        if (this.isDead) return; 

        this.status = "swimming"; 

        if (inputActive) {
            this.velocity += this.buoyancy; 
            if (this.velocity < this.maxUpwardSpeed) this.velocity = this.maxUpwardSpeed;
        } else {
            this.velocity += this.weight;   
        }

        this.velocity *= 0.95; 
        this.y += this.velocity;

        const waterSurface = this.gameHeight * 0.42; 
        const floorLevel = this.gameHeight - currentSandHeight - this.radius;

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

        if (this.y < this.radius) {
            this.y = this.radius;
            this.velocity = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const angle = this.velocity / 10; 
        ctx.rotate(angle);

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
