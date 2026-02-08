export class Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
    markedForDeletion: boolean;
    isBiofeedback: boolean;

    constructor(x: number, y: number, pressure: number = 0.5, isBiofeedback: boolean = false) {
        this.x = x;
        this.y = y;
        this.isBiofeedback = isBiofeedback;

        if (isBiofeedback) {
            this.size = 2 + (pressure * 8); 
            this.speedX = -2 - (Math.random() * 2);
            this.speedY = (Math.random() - 0.5) * 1;

            const alpha = 0.4 + (pressure * 0.6);
            this.color = `rgba(45, 212, 191, ${alpha})`;
        } else {
            this.size = Math.random() * 3 + 1; 
            this.speedX = Math.random() * 1 - 2.5; 
            this.speedY = Math.random() * 1 - 0.5;
            this.color = `rgba(200, 240, 255, ${Math.random() * 0.3})`; 
        }
        
        this.markedForDeletion = false;
    }

    update(): void {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.isBiofeedback) {
            this.size *= 0.96; 
        } else {
            this.size -= 0.05; 
        }

        if (this.size <= 0.1) this.markedForDeletion = true;
    }
    

    draw(ctx: CanvasRenderingContext2D): void {
        // not allow invisible / negative particles
        if (this.size > 0) {
            ctx.save();
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();

            // Add extra glow stroke for biofeedback bubbles
            if (this.isBiofeedback && this.size > 5) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#2DD4BF";
                ctx.strokeStyle = "white";
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
            ctx.restore();
        }
    }
}