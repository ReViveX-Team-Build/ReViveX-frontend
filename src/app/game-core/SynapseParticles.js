export class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 1; 
        this.speedX = Math.random() * 1 - 2.5; 
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `rgba(0, 255, 255, ${Math.random()})`; 
        this.markedForDeletion = false;
    }

     update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.size -= 0.05; 

        if (this.size <= 0) {
            this.size = 0; // Clamp it to zero
            this.markedForDeletion = true;
        }
    }

     draw(ctx) {
        //not allow invisble / negative particles

        if (this.size > 0) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

    