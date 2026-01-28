// HELPER: Color Blending
function lerpColor(a: string, b: string, amount: number): string {
    const ah = parseInt(a.replace(/#/g, ''), 16),
        ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
        bh = parseInt(b.replace(/#/g, ''), 16),
        br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
        rr = ar + amount * (br - ar),
        rg = ag + amount * (bg - ag),
        rb = ab + amount * (bb - ab);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + (rb | 0)).toString(16).slice(1);
}

class Star {
    x: number;
    y: number;
    size: number;
    offset: number;

    constructor(gameWidth: number, gameHeight: number) {
        this.x = Math.random() * gameWidth;
        this.y = Math.random() * (gameHeight * 0.6); // Stars stay in upper sky
        this.size = Math.random() * 1.5; // Smaller, subtler stars
        this.offset = Math.random() * Math.PI * 2;
    }

    draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        // Only visible at night
        if (nightFactor < 0.3) return;

        // Twinkle effect
        const twinkle = Math.sin(Date.now() * 0.003 + this.offset);
        const currentAlpha = Math.max(0, (0.7 + twinkle * 0.3) * nightFactor);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Firefly {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;

    constructor(gameWidth: number, gameHeight: number) {
        this.x = Math.random() * gameWidth;
        this.y = Math.random() * gameHeight;
        this.vx = (Math.random() - 0.5) * 0.5; 
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = 1 + Math.random() * 2;
    }

    update(gameWidth: number, gameHeight: number): void {
        this.x += this.vx;
        this.y += this.vy;
        if(this.x < 0) this.x = gameWidth;
        if(this.x > gameWidth) this.x = 0;
        if(this.y < 0) this.y = gameHeight;
        if(this.y > gameHeight) this.y = 0;
    }

    draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        if (nightFactor < 0.2) return; 
        ctx.fillStyle = `rgba(200, 255, 100, ${nightFactor * 0.6})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Layer {
    gameWidth: number;
    gameHeight: number;
    speedModifier: number;
    color: string;
    x: number;
    speed: number;
    baseY: number;
    waveHeightModifier: number;

    constructor(gameWidth: number, gameHeight: number, speedModifier: number, color: string, yOffset: number) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.speedModifier = speedModifier;
        this.color = color;
        this.x = 0;
        this.speed = 2;
        this.baseY = yOffset;
        this.waveHeightModifier = 1.0; 
    }

    update(difficulty: number): void {
        this.x -= this.speed * this.speedModifier;
        if (this.x <= -this.gameWidth) this.x = 0;
        this.waveHeightModifier = Math.max(0.3, 1.0 - (difficulty * 0.5));
    }

    draw(ctx: CanvasRenderingContext2D, time: number, nightFactor: number): void {
        // Darken water at night
        const nightColor = lerpColor(this.color, "#000510", nightFactor * 0.6);
        ctx.fillStyle = nightColor;
        
        ctx.beginPath();
        this.drawWave(ctx, this.x, time);
        this.drawWave(ctx, this.x + this.gameWidth, time);
        ctx.fill();
    }

    drawWave(ctx: CanvasRenderingContext2D, offsetX: number, time: number): void {
        const wobble = Math.sin(time * 0.002 + this.speedModifier) * (20 * this.waveHeightModifier);
        const surfaceY = this.baseY + wobble;

        ctx.moveTo(offsetX, this.gameHeight);
        ctx.lineTo(offsetX, surfaceY);
        ctx.bezierCurveTo(
            offsetX + this.gameWidth / 3, surfaceY - (50 * this.waveHeightModifier), 
            offsetX + (this.gameWidth / 3) * 2, surfaceY + (50 * this.waveHeightModifier), 
            offsetX + this.gameWidth, surfaceY
        );
        ctx.lineTo(offsetX + this.gameWidth, this.gameHeight);
    }
}

export class SynapseBackground {
    gameWidth: number;
    gameHeight: number;
    layers: Layer[];
    stars: Star[];
    fireflies: Firefly[];
    sandHeight: number;
    targetSandHeight: number;
    sandTextureCanvas: HTMLCanvasElement | null;

    constructor(gameWidth: number, gameHeight: number) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        
        this.layers = [
            new Layer(gameWidth, gameHeight, 0.2, "#0b2c4d", gameHeight * 0.38), 
            new Layer(gameWidth, gameHeight, 0.5, "#104e6e", gameHeight * 0.40), 
            new Layer(gameWidth, gameHeight, 1.0, "#196f91", gameHeight * 0.42)  
        ];

        this.stars = Array.from({ length: 40 }, () => new Star(gameWidth, gameHeight));
        this.fireflies = Array.from({ length: 15 }, () => new Firefly(gameWidth, gameHeight));

        this.sandHeight = 50; 
        this.targetSandHeight = 50;

        this.sandTextureCanvas = this.createSandTexture();
    }

    createSandTexture(): HTMLCanvasElement | null {
        if (typeof document === 'undefined') return null; 

        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return null;

        // Draw 500 random specks
        for (let i = 0; i < 500; i++) {
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.15})`; // Dark specks
            ctx.fillRect(Math.random() * 100, Math.random() * 100, 2, 2);

            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`; // Light specks
            ctx.fillRect(Math.random() * 100, Math.random() * 100, 2, 2);
        }
        return canvas;
    }

    update(gameTime: number): number {
        // --- 1. THE LOOPING DAY/NIGHT CYCLE ---
        // 3 Minutes = 180,000ms
        const CYCLE_DURATION = 180000; 
        
        // Get position in cycle from 0.0 to 1.0
        const cyclePosition = (gameTime % CYCLE_DURATION) / CYCLE_DURATION;
        
        let nightFactor = 0;
        
        // Logic:
        // 0.0 - 0.25: Day (Factor 0)
        // 0.25 - 0.35: Sunset (Factor 0 -> 1)
        // 0.35 - 0.75: Night (Factor 1)
        // 0.75 - 0.85: Sunrise (Factor 1 -> 0)
        // 0.85 - 1.0: Day (Factor 0)

        if (cyclePosition < 0.25) {
            nightFactor = 0; // Day
        } else if (cyclePosition < 0.35) {
            nightFactor = (cyclePosition - 0.25) * 10; // Sunset
        } else if (cyclePosition < 0.75) {
            nightFactor = 1; // Night
        } else if (cyclePosition < 0.85) {
            nightFactor = 1 - ((cyclePosition - 0.75) * 10); // Sunrise
        } else {
            nightFactor = 0; // Day
        }

        // --- 2. DIFFICULTY (Sand Rising) ---
        if (Math.floor(gameTime / 10000) % 3 === 0) {
            this.targetSandHeight = Math.min(220, 50 + (gameTime / 2000));
        } else {
            this.targetSandHeight = Math.max(50, this.targetSandHeight - 0.2);
        }
        this.sandHeight += (this.targetSandHeight - this.sandHeight) * 0.01;

        // Update Children
        const difficulty = (this.sandHeight - 50) / 150; 
        this.layers.forEach(layer => layer.update(difficulty));
        this.fireflies.forEach(f => f.update(this.gameWidth, this.gameHeight));
        
        return nightFactor; 
    }

    draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        const time = Date.now();

        // 1. SKY
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.gameHeight);
        if (nightFactor < 1) {
            // Day/Sunset Mix
            skyGradient.addColorStop(0, lerpColor("#87CEEB", "#050510", nightFactor)); 
            skyGradient.addColorStop(0.5, lerpColor("#E0F7FA", "#151020", nightFactor)); 
            skyGradient.addColorStop(1, "#020c1b");
        } else {
            // Full Night
            skyGradient.addColorStop(0, "#050510"); 
            skyGradient.addColorStop(0.6, "#151020"); 
            skyGradient.addColorStop(1, "#020c1b");
        }
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        // 2. CELESTIAL BODIES (Sun & Moon)
        this.drawSun(ctx, nightFactor);
        this.drawMoon(ctx, nightFactor); // New!

        // 3. STARS & FIREFLIES
        this.stars.forEach(star => star.draw(ctx, nightFactor));
        this.fireflies.forEach(f => f.draw(ctx, nightFactor));

        // 4. WATER
        this.layers.forEach(layer => layer.draw(ctx, time, nightFactor));

        // 5. SAND
        this.drawSand(ctx, nightFactor);
    }

    drawSun(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        // Sun moves down and fades out
        if (nightFactor >= 1) return;
        
        const yPos = 80 + (nightFactor * 400); // Moves down
        
        ctx.save();
        ctx.globalAlpha = 1 - nightFactor;
        ctx.shadowBlur = 40;
        ctx.shadowColor = "#FFD700";
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(this.gameWidth - 100, yPos, 40, 0, Math.PI * 2); 
        ctx.fill();
        ctx.restore();
    }

    drawMoon(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        // Moon moves up and fades in
        if (nightFactor <= 0) return;

        const yPos = 400 - (nightFactor * 320); // Moves Up from bottom
        
        ctx.save();
        ctx.globalAlpha = nightFactor; // Fades in
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.fillStyle = "#F4F6F0"; // Pale Moon Color
        
        ctx.beginPath();
        ctx.arc(100, yPos, 30, 0, Math.PI * 2); // Left Side
        ctx.fill();
        
        // Subtle Craters
        ctx.fillStyle = "rgba(200, 200, 200, 0.3)";
        ctx.beginPath(); ctx.arc(90, yPos - 5, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(110, yPos + 8, 7, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }

    drawSand(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        const sandColorTop = lerpColor("#E6D09E", "#3e3221", nightFactor);
        const sandColorBot = lerpColor("#8B4513", "#110e0a", nightFactor);

        // 1. Draw the Shape
        ctx.beginPath();
        ctx.moveTo(0, this.gameHeight);
        ctx.lineTo(0, this.gameHeight - this.sandHeight);

        // High resolution bumps for better look
        for (let i = 0; i <= this.gameWidth; i += 10) {
            const bump = Math.sin(i * 0.015) * 15 + Math.cos(i * 0.05) * 5;
            ctx.lineTo(i, this.gameHeight - this.sandHeight + bump);
        }
        ctx.lineTo(this.gameWidth, this.gameHeight);
        ctx.lineTo(0, this.gameHeight); // Close the loop

        // 2. Base Gradient
        const gradient = ctx.createLinearGradient(0, this.gameHeight - this.sandHeight, 0, this.gameHeight);
        gradient.addColorStop(0, sandColorTop);
        gradient.addColorStop(1, sandColorBot);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 3. Apply Grain Texture
        if (this.sandTextureCanvas) {
            ctx.save();
            ctx.clip(); // Only draw inside the sand
            const pattern = ctx.createPattern(this.sandTextureCanvas, 'repeat');
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.globalCompositeOperation = 'overlay'; // Blend mode for realism
                ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            }
            ctx.restore();
        }

        // 4. Top Rim Highlight (The "Pop")
        ctx.beginPath();
        ctx.moveTo(0, this.gameHeight - this.sandHeight);
        for (let i = 0; i <= this.gameWidth; i += 10) {
            const bump = Math.sin(i * 0.015) * 15 + Math.cos(i * 0.05) * 5;
            ctx.lineTo(i, this.gameHeight - this.sandHeight + bump);
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 - (nightFactor * 0.2)})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}