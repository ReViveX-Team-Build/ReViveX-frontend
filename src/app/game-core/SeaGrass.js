export class SeaGrass {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.grassBlades = [];

        for (let i = 0; i < 20; i++) {
            this.grassBlades.push({
                x: Math.random() * gameWidth,
                height: 50 + Math.random() * 100, // Random height
                width: 10 + Math.random() * 10,
                color: Math.random() > 0.5 ? "#2E8B57" : "#3CB371",
                swaySpeed: 0.002 + Math.random() * 0.003,
                swayOffset: Math.random() * Math.PI * 2
            });
        }
    }

    update() {
        // Move grass left to match the player swimming forward
        this.grassBlades.forEach(blade => {
            blade.x -= 2; // Match background speed

            //Loop it back to the right side if it goes off screen 
            if (blade.x < -20) {
                blade.x = this.gameWidth + 20;
            }
        });
    }

    draw(ctx) {
        const time = Date.now();
        
        this.grassBlades.forEach(blade => {
            //calculate swaying - top moves bottom fixed
            const tipSway = Math.sin(time * blade.swaySpeed + blade.swayOffset) * 20;

            ctx.fillStyle = blade.color;
            ctx.beginPath();

            // Draw a curved blade using Bezier curves

            ctx.moveTo(blade.x, this.gameHeight); // Bottom Center
            ctx.quadraticCurveTo(
                blade.x - 10, this.gameHeight - (blade.height / 2), // Control Point
                blade.x + tipSway, this.gameHeight - blade.height   // Top Tip (Moving)
            );
            ctx.quadraticCurveTo(
                blade.x + 10, this.gameHeight - (blade.height / 2), // Control Point
                blade.x + blade.width, this.gameHeight              // Bottom Right
            );
            
            ctx.fill();
        });
    }
}