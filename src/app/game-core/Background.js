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

class Cloud {
    constructor(gameWidth, gameHeight) {
        this.x = Math.random() * gameWidth;
        this.y = Math.random() * (gameHeight * 0.3); // Top 30% of screen
        this.speed = 0.2 + Math.random() * 0.3;
        this.size = 0.5 + Math.random() * 0.5; 
        this.opacity = 0.4 + Math.random() * 0.4;
    }

    update(gameWidth) {
            this.x -= this.speed;
            if (this.x < -150) { // Reset to right side
                this.x = gameWidth + 50;
                this.y = Math.random() * 200;
            }

      }
    draw(ctx, nightFactor) {
        if (nightFactor > 0.8) return;

        ctx.save();
        ctx.globalAlpha = (1 - nightFactor) * this.opacity;
        ctx.fillStyle = "#FFFFFF";
        ctx.translate(this.x, this.y);
        ctx.scale(this.size, this.size);

        // Draw Fluffy Shapes
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.arc(25, -10, 35, 0, Math.PI * 2);
        ctx.arc(50, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Star {
    constructor(gameWidth, gameHeight) {
        this.x = Math.random() * gameWidth;
        this.y = Math.random() * (gameHeight * 0.6);
        this.size = Math.random() * 1.5;
        this.offset = Math.random() * Math.PI * 2;
    }
      draw(ctx, nightFactor) {
        if (nightFactor < 0.3) return; // Only visible at night
        const twinkle = Math.sin(Date.now() * 0.003 + this.offset);
        const alpha = Math.max(0, (0.7 + twinkle * 0.3) * nightFactor);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

    }
}

class Firefly {
    constructor(gameWidth, gameHeight) {
        this.x = Math.random() * gameWidth;
        this.y = Math.random() * gameHeight;
        this.vx = (Math.random() - 0.5) * 0.5; 
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = 1 + Math.random() * 2;
    }

    update(width, height) {
        this.x += this.vx; this.y += this.vy;
        if(this.x < 0) this.x = width; if(this.x > width) this.x = 0;
        if(this.y < 0) this.y = height; if(this.y > height) this.y = 0;
    }

    draw(ctx, nightFactor) {
        if (nightFactor < 0.2) return; 
        ctx.fillStyle = `rgba(200, 255, 100, ${nightFactor * 0.6})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
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

        //ATMOSPHERIC ELEMENTS
        this.stars = Array.from({ length: 40 }, () => new Star(gameWidth, gameHeight));
        this.fireflies = Array.from({ length: 15 }, () => new Firefly(gameWidth, gameHeight));
        this.clouds = Array.from({ length: 5 }, () => new Cloud(gameWidth, gameHeight));

        this.sandHeight = 50; 
        this.targetSandHeight = 50;


        //static sand grains (Texture)

        this.sandGrains = [];
        for(let i=0; i<300; i++) {
            this.sandGrains.push({
                x: Math.random() * gameWidth,
                yOffset: Math.random(), // 0 to 1 (relative to sand height)
                size: Math.random() * 2 + 1,
                alpha: Math.random() * 0.3 + 0.1
            });
        }
    }

    update(gameTime) {
        // --- Day/Night Cycle Logic ---
        // 3 Minutes = 180,000ms
        const CYCLE_DURATION = 180000; 
        const cyclePosition = (gameTime % CYCLE_DURATION) / CYCLE_DURATION;
        
        let nightFactor = 0;
        
        // Calculate how "dark" it is based on time (0.0 = Day, 1.0 = Night)
        if (cyclePosition < 0.25) nightFactor = 0; // Day
        else if (cyclePosition < 0.35) nightFactor = (cyclePosition - 0.25) * 10; // Sunset
        else if (cyclePosition < 0.75) nightFactor = 1; // Night
        else if (cyclePosition < 0.85) nightFactor = 1 - ((cyclePosition - 0.75) * 10); // Sunrise
        else nightFactor = 0; // Day

        // --- Sand Rising Mechanic (Difficulty) ---
        // Every 10 seconds, sand target moves
        if (Math.floor(gameTime / 10000) % 3 === 0) {
            this.targetSandHeight = Math.min(220, 50 + (gameTime / 2000));
        } else {
            this.targetSandHeight = Math.max(50, this.targetSandHeight - 0.2);
        }
        // Smoothly animate sand height
        this.sandHeight += (this.targetSandHeight - this.sandHeight) * 0.01;

        const difficulty = (this.sandHeight - 50) / 150; 
        this.layers.forEach(layer => layer.update(difficulty));
        this.fireflies.forEach(f => f.update(this.gameWidth, this.gameHeight));
        this.clouds.forEach(c => c.update(this.gameWidth));
        
        return nightFactor; 
    }

    draw(ctx, nightFactor) {
        const time = Date.now();

        // 1. Draw Sky (Gradient based on Night Factor)
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.gameHeight);
        if (nightFactor < 1) {
            // Day/Sunset Mix
            skyGradient.addColorStop(0, lerpColor("#87CEEB", "#050510", nightFactor)); 
            skyGradient.addColorStop(0.5, lerpColor("#E0F7FA", "#151020", nightFactor));
            skyGradient.addColorStop(1, "#020c1b");
        } else {
            // Full Night
            skyGradient.addColorStop(0, "#050510"); 
            skyGradient.addColorStop(1, "#020c1b");
        }
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        //celestial elements
        this.stars.forEach(s => s.draw(ctx, nightFactor));
        this.drawSun(ctx, nightFactor);
        this.drawMoon(ctx, nightFactor);
        this.clouds.forEach(c => c.draw(ctx, nightFactor));

        // 2. Draw Water Layers
        this.layers.forEach(layer => layer.draw(ctx, time, nightFactor));

        // 3. Draw Sand n details
        this.drawSand(ctx, nightFactor);
        this.fireflies.forEach(f => f.draw(ctx, nightFactor));
    }

    drawSun(ctx, nightFactor) {
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

    drawMoon(ctx, nightFactor) {
        if (nightFactor <= 0) return;
        const yPos = 400 - (nightFactor * 320); 
        ctx.save();
        ctx.globalAlpha = nightFactor; 
        ctx.shadowBlur = 20;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.fillStyle = "#F4F6F0"; 
        ctx.beginPath();
        ctx.arc(100, yPos, 30, 0, Math.PI * 2); 
        ctx.fill();
        // Craters
        ctx.fillStyle = "rgba(200, 200, 200, 0.3)";
        ctx.beginPath(); ctx.arc(90, yPos - 5, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(110, yPos + 8, 7, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    drawSand(ctx, nightFactor) {
        // MAIN GRADIENT
        const sandColorTop = lerpColor("#E6D09E", "#3e3221", nightFactor);
        const sandColorBot = lerpColor("#8B4513", "#110e0a", nightFactor);

        const gradient = ctx.createLinearGradient(0, this.gameHeight - this.sandHeight, 0, this.gameHeight);
        gradient.addColorStop(0, sandColorTop);
        gradient.addColorStop(1, sandColorBot);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, this.gameHeight);
        ctx.lineTo(0, this.gameHeight - this.sandHeight);
        // Wavy Surface
        for (let i = 0; i <= this.gameWidth; i += 50) {
            const bump = Math.sin(i * 0.01) * 10 + Math.cos(i * 0.03) * 5;
            ctx.lineTo(i, this.gameHeight - this.sandHeight + bump);
        }
        ctx.lineTo(this.gameWidth, this.gameHeight);
        ctx.fill();
         
        //sand TEXTURE - adding the depth 
        ctx.fillStyle = nightFactor > 0.5 ? "rgba(0,0,0,0.2)" : "rgba(100, 70, 20, 0.15)";
        this.sandGrains.forEach(grain => {
            // Draw grain relative to current sand height
            const grainY = this.gameHeight - (this.sandHeight * grain.yOffset);
            if (grainY > this.gameHeight - this.sandHeight) { // Ensure it's below surface
                ctx.beginPath();
                ctx.arc(grain.x, grainY, grain.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

    }
}