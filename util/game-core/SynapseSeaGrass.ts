interface GrassBlade {
    x: number;
    height: number;
    width: number;
    colorBase: string;
    swaySpeed: number;
    swayOffset: number;
    lean: number;
}

export class SeaGrass {
    gameWidth: number;
    gameHeight: number;
    grassBlades: GrassBlade[];

    constructor(gameWidth: number, gameHeight: number) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.grassBlades = [];

        for (let i = 0; i < 40; i++) {
            this.grassBlades.push({
                x: Math.random() * gameWidth,
                // Taller, varied heights for realism
                height: 100 + Math.random() * 150, 
                width: 12 + Math.random() * 8,
                // Slight transparency for "watery" look
                colorBase: Math.random() > 0.5 ? "rgba(46, 139, 87," : "rgba(60, 179, 113,", 
                swaySpeed: 0.002 + Math.random() * 0.003,
                swayOffset: Math.random() * Math.PI * 2,
                lean: 0 // Physics interaction value
            });
        }
    }

    update(playerX: number, playerY: number, speed: number): void {
        this.grassBlades.forEach(blade => {
            // 1. Move Left (Scroll with background)
            blade.x -= 2; 

            // 2. Loop around
            if (blade.x < -20) {
                blade.x = this.gameWidth + 20;
                blade.lean = 0; // Reset lean when respawning
            }

            // 3. INTERACTION: Check distance to player
            // If player is close (within 100px) and low enough (near the grass)
            const dist = (playerX - blade.x);
            const heightCheck = (playerY > this.gameHeight - blade.height - 50);

            if (Math.abs(dist) < 80 && heightCheck) {
                // Push grass away from player (Right if player is left, etc.)
                // The '0.2' is the strength of the push
                blade.lean = Math.max(-40, Math.min(40, blade.lean - (dist * 0.2)));
            } else {
                // Elasticity: Slowly return to 0 lean
                blade.lean *= 0.90; 
            }
        });
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const time = Date.now();
        
        this.grassBlades.forEach(blade => {
            // Natural sway (Sine wave) + Player Interaction (Lean)
            const naturalSway = Math.sin(time * blade.swaySpeed + blade.swayOffset) * 15;
            const totalTipX = blade.x + naturalSway + blade.lean;

            // GRADIENT: Dark bottom, light top (Fake lighting)
            // We create it on the fly for each blade (a bit expensive but looks great)
            const gradient = ctx.createLinearGradient(blade.x, this.gameHeight, totalTipX, this.gameHeight - blade.height);
            gradient.addColorStop(0, `${blade.colorBase} 0.2)`); // Dark/Transparent Bottom
            gradient.addColorStop(1, `${blade.colorBase} 0.9)`); // Bright Top

            ctx.fillStyle = gradient;
            ctx.beginPath();

            // Draw Curved Blade (Kelp Shape)
            ctx.moveTo(blade.x - (blade.width / 2), this.gameHeight); // Bottom Left
            
            // Curve to the top tip
            ctx.quadraticCurveTo(
                blade.x + blade.lean, this.gameHeight - (blade.height / 2), // Control Point (Bends with lean)
                totalTipX, this.gameHeight - blade.height                   // Top Tip
            );

            // Curve back to bottom right
            ctx.quadraticCurveTo(
                blade.x + blade.lean, this.gameHeight - (blade.height / 2), // Control Point
                blade.x + (blade.width / 2), this.gameHeight                  // Bottom Right
            );
            
            ctx.fill();
        });
    }
}