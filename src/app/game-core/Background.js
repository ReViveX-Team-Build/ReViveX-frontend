// HELPER: Color Blending
function lerpColor(a, b, amount) {
    const ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + (rb | 0)).toString(16).slice(1);
}

class Layer {
    constructor(gameWidth, gameHeight, speedModifier, color, yOffset) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.speedModifier = speedModifier;
        this.color = color;
        this.x = 0;
        this.speed = 2;
        this.baseY = yOffset;
        this.waveHeightModifier = 1.0; 
    }

    update(difficulty) {
        // Move layer left to create illusion of forward movement
        this.x -= this.speed * this.speedModifier;
        if (this.x <= -this.gameWidth) this.x = 0;
        
        // Waves get rougher as difficulty (sand) rises
        this.waveHeightModifier = Math.max(0.3, 1.0 - (difficulty * 0.5));
    }

    draw(ctx, time, nightFactor) {
        // Darken water at night
        const nightColor = lerpColor(this.color, "#000510", nightFactor * 0.6);
        ctx.fillStyle = nightColor;
        
        ctx.beginPath();
        // Draw two waves to ensure seamless looping
        this.drawWave(ctx, this.x, time);
        this.drawWave(ctx, this.x + this.gameWidth, time);
        ctx.fill();
    }

    drawWave(ctx, offsetX, time) {
        const wobble = Math.sin(time * 0.002 + this.speedModifier) * (20 * this.waveHeightModifier);
        const surfaceY = this.baseY + wobble;

        ctx.moveTo(offsetX, this.gameHeight);
        ctx.lineTo(offsetX, surfaceY);
        // Bezier curve for smooth wave shape
        ctx.bezierCurveTo(
            offsetX + this.gameWidth / 3, surfaceY - (50 * this.waveHeightModifier), 
            offsetX + (this.gameWidth / 3) * 2, surfaceY + (50 * this.waveHeightModifier), 
            offsetX + this.gameWidth, surfaceY
        );
        ctx.lineTo(offsetX + this.gameWidth, this.gameHeight);
    }
}

export class Background {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        // Parallax Layers (Far, Mid, Near)
        this.layers = [
            new Layer(gameWidth, gameHeight, 0.2, "#0b2c4d", gameHeight * 0.38), 
            new Layer(gameWidth, gameHeight, 0.5, "#104e6e", gameHeight * 0.40), 
            new Layer(gameWidth, gameHeight, 1.0, "#196f91", gameHeight * 0.42)  
        ];

        this.sandHeight = 50; 
        this.targetSandHeight = 50;
    }
}