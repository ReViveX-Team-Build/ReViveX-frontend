// ─── SKY BACKGROUND ─────────────────────────────────────────────────────────
// Air/sky theme for Flappy Bird style gameplay
// Replaces underwater background with clouds and blue sky

export class SkyBackground {
    gameWidth: number;
    gameHeight: number;
    clouds: Cloud[] = [];
    birds: Bird[] = [];
    sunPosition: { x: number; y: number };
    
    // Colors
    skyGradientTop: string = '#1e40af';    // Dark blue
    skyGradientBottom: string = '#60a5fa';   // Light blue
    cloudColor: string = 'rgba(255, 255, 255, 0.8)';
    
    // Parallax layers
    layer1Speed: number = 0.3;  // Far clouds
    layer2Speed: number = 0.6; // Near clouds
    layer3Speed: number = 1.0;  // Birds
    
    constructor(gameWidth: number, gameHeight: number) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.sunPosition = { x: gameWidth * 0.85, y: gameHeight * 0.15 };
        this.init();
    }

    private init(): void {
        // Initial clouds
        for (let i = 0; i < 8; i++) {
            this.addCloud(Math.random() * this.gameWidth, Math.random() * this.gameHeight * 0.6);
        }
        
        // Initial birds
        for (let i = 0; i < 3; i++) {
            this.addBird();
        }
    }

    addCloud(x?: number, y?: number): void {
        const cloudX = x ?? this.gameWidth + 100;
        const cloudY = y ?? Math.random() * this.gameHeight * 0.5;
        const scale = 0.5 + Math.random() * 1.0;
        const layer = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
        
        this.clouds.push({
            x: cloudX,
            y: cloudY,
            width: 80 + Math.random() * 60,
            height: 30 + Math.random() * 25,
            layer: layer,
            speed: layer * 0.3 + Math.random() * 0.2,
            opacity: 0.4 + (layer * 0.15),
            puffCount: 3 + Math.floor(Math.random() * 3)
        });
    }

    addBird(): void {
        this.birds.push({
            x: this.gameWidth + 50 + Math.random() * 200,
            y: 50 + Math.random() * (this.gameHeight * 0.4),
            wingPhase: Math.random() * Math.PI * 2,
            speed: 1.5 + Math.random() * 1.0,
            size: 15 + Math.random() * 10
        });
    }

    update(_elapsed: number, _delta: number, scrollSpeed: number): number {
        // Update clouds
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            cloud.x -= cloud.speed * scrollSpeed * 0.5;
            
            // Remove off-screen clouds
            if (cloud.x + cloud.width < -50) {
                this.clouds.splice(i, 1);
            }
        }
        
        // Repopulate clouds
        if (this.clouds.length < 6) {
            this.addCloud();
        }

        // Update birds
        for (let i = this.birds.length - 1; i >= 0; i--) {
            const bird = this.birds[i];
            bird.x -= bird.speed * scrollSpeed;
            bird.wingPhase += 0.15;
            
            // Gentle bobbing
            bird.y += Math.sin(bird.wingPhase * 0.5) * 0.3;
            
            if (bird.x < -50) {
                this.birds.splice(i, 1);
            }
        }
        
        // Repopulate birds
        if (this.birds.length < 2 && Math.random() < 0.01) {
            this.addBird();
        }

        // Return night factor (always 1.0 for daytime sky)
        return 1.0;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.gameHeight);
        gradient.addColorStop(0, this.skyGradientTop);
        gradient.addColorStop(0.6, '#3b82f6');
        gradient.addColorStop(1, this.skyGradientBottom);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);

        // Sun
        this.drawSun(ctx);

        // Draw clouds by layer (back to front)
        const sortedClouds = [...this.clouds].sort((a, b) => a.layer - b.layer);
        sortedClouds.forEach(cloud => this.drawCloud(ctx, cloud));

        // Draw birds
        this.birds.forEach(bird => this.drawBird(ctx, bird));

        // Ground/platform (for Flappy Bird style)
        this.drawGround(ctx);
    }

    private drawSun(ctx: CanvasRenderingContext2D): void {
        const { x, y } = this.sunPosition;
        
        // Sun glow
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
        glowGradient.addColorStop(0, 'rgba(255, 236, 179, 0.9)');
        glowGradient.addColorStop(0.3, 'rgba(255, 224, 130, 0.5)');
        glowGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 80, 0, Math.PI * 2);
        ctx.fill();

        // Sun core
        const coreGradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, 30);
        coreGradient.addColorStop(0, '#FFFDE7');
        coreGradient.addColorStop(0.5, '#FFE082');
        coreGradient.addColorStop(1, '#FFB300');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawCloud(ctx: CanvasRenderingContext2D, cloud: Cloud): void {
        ctx.save();
        ctx.globalAlpha = cloud.opacity;
        
        const gradient = ctx.createLinearGradient(
            cloud.x, cloud.y - cloud.height / 2,
            cloud.x, cloud.y + cloud.height / 2
        );
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#E0E7FF');
        
        ctx.fillStyle = gradient;
        
        // Draw cloud as multiple overlapping circles (puffs)
        const puffRadius = cloud.height * 0.5;
        
        // Main body
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, puffRadius, 0, Math.PI * 2);
        ctx.arc(cloud.x + puffRadius * 0.6, cloud.y - puffRadius * 0.3, puffRadius * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x - puffRadius * 0.6, cloud.y - puffRadius * 0.3, puffRadius * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x + puffRadius * 1.2, cloud.y, puffRadius * 0.6, 0, Math.PI * 2);
        ctx.arc(cloud.x - puffRadius * 1.2, cloud.y, puffRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    private drawBird(ctx: CanvasRenderingContext2D, bird: Bird): void {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        
        const wingY = Math.sin(bird.wingPhase) * 8;
        
        // Bird body
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.size, bird.size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.ellipse(-bird.size * 0.2, -wingY, bird.size * 0.6, bird.size * 0.25, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.moveTo(bird.size * 0.8, 0);
        ctx.lineTo(bird.size * 1.2, -2);
        ctx.lineTo(bird.size * 0.8, 3);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    private drawGround(ctx: CanvasRenderingContext2D): void {
        // Green grassy ground at bottom
        const groundHeight = 60;
        const groundY = this.gameHeight - groundHeight;
        
        const groundGradient = ctx.createLinearGradient(0, groundY, 0, this.gameHeight);
        groundGradient.addColorStop(0, '#22C55E');
        groundGradient.addColorStop(0.3, '#16A34A');
        groundGradient.addColorStop(1, '#15803D');
        
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, groundY, this.gameWidth, groundHeight);
        
        // Grass line
        ctx.fillStyle = '#4ADE80';
        ctx.fillRect(0, groundY, this.gameWidth, 4);
        
        // Ground texture (simple dots)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < this.gameWidth; i += 15) {
            const h = 3 + Math.random() * 8;
            ctx.beginPath();
            ctx.arc(i + Math.random() * 10, groundY + 10 + Math.random() * 30, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    get sandHeight(): number {
        return 60; // Same as ground height
    }
}

interface Cloud {
    x: number;
    y: number;
    width: number;
    height: number;
    layer: number;
    speed: number;
    opacity: number;
    puffCount: number;
}

interface Bird {
    x: number;
    y: number;
    wingPhase: number;
    speed: number;
    size: number;
}

