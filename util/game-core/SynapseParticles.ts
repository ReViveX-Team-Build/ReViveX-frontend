export class Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;
    markedForDeletion: boolean = false;
    isBubble: boolean = false;

    constructor(x: number, y: number, pressureRatio: number = 0, isBubble: boolean = false) {
        this.x = x;
        this.y = y;
        this.isBubble = isBubble;
        if (isBubble) {
            this.size = Math.random() * 5 + 2 + (pressureRatio * 5);
            this.speedY = Math.random() * 1 - 0.5;
            this.speedX = -Math.random() * 2 - 1 - (pressureRatio * 2); // Shoot backward
            this.color = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.3})`;
        } else {
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 1 - 0.5;
            this.speedY = Math.random() * 1 - 0.5;
            this.color = 'white';
        }
    }

    update(speedMultiplier: number = 1) {
        this.x += this.speedX * speedMultiplier;
        this.y += this.speedY * speedMultiplier;
        this.size *= 0.95;
        if (this.size < 0.5) this.markedForDeletion = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}