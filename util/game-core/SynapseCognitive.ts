export interface CognitiveTask {
    instruction: string; // e.g., "Collect RED"
    targetColor: string; // The hex code they need
}

export class Pearl {
    x: number;
    y: number;
    radius: number = 25;
    color: string;
    isTarget: boolean; // Is this the correct pearl?
    markedForDeletion: boolean = false;
    collected: boolean = false;

    constructor(gameWidth: number, y: number, color: string, isTarget: boolean) {
        this.x = gameWidth;
        this.y = y;
        this.color = color;
        this.isTarget = isTarget;
    }

    update(speed: number) {
        this.x -= speed;
        if (this.x + this.radius < 0) this.markedForDeletion = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.collected) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow Effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Pearl Body (Gradient for 3D look)
        const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, this.radius);
        grad.addColorStop(0, "white");
        grad.addColorStop(0.3, this.color);
        grad.addColorStop(1, "rgba(0,0,0,0.2)");
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Shine Reflection
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(-8, -8, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}