// ─── SKY MEMORY GATE ────────────────────────────────────────────────────────
// Memory gates for the sky-themed Flappy Bird game
// Player must memorize color sequences to pass through gates

export type MemoryColor = 'red' | 'green' | 'blue' | 'yellow';

export interface ColorConfig {
    name: MemoryColor;
    hex: string;
    glow: string;
    darkHex: string;
}

export const SKY_COLOR_PALETTE: ColorConfig[] = [
    { name: 'red',    hex: '#EF4444', glow: 'rgba(239, 68, 68, 0.8)',   darkHex: '#B91C1C' },
    { name: 'green',  hex: '#22C55E', glow: 'rgba(34, 197, 94, 0.8)',   darkHex: '#15803D' },
    { name: 'blue',   hex: '#3B82F6', glow: 'rgba(59, 130, 246, 0.8)',  darkHex: '#1D4ED8' },
    { name: 'yellow', hex: '#FACC15', glow: 'rgba(250, 204, 21, 0.8)',  darkHex: '#A16207' },
];

type GateState = 'approaching' | 'showing' | 'waiting' | 'passed_checkpoint' | 'passed' | 'failed';

interface Checkpoint {
    color: MemoryColor;
    passed: boolean;
    x: number;
    width: number;
}

export class SkyGate {
    difficulty: number;
    x: number;
    y: number;
    width: number;
    height: number;
    
    sequence: MemoryColor[];
    checkpoints: Checkpoint[];
    currentCheckpoint: number;
    
    state: GateState;
    stateTimer: number;
    showDuration: number;
    holdDuration: number;
    
    flashTimer: number = 0;
    passed: boolean = false;
    failed: boolean = false;
    
    correctCheckpoints: number = 0;
    wrongCheckpoints: number = 0;

    constructor(
        gameWidth: number, 
        gameHeight: number, 
        sequence: MemoryColor[],
        checkpointCount: number = 3,
        difficulty: number = 1
    ) {
        // Difficulty affects gate size and timing
        const sizeMultiplier = 1 - (difficulty - 1) * 0.1; // Slightly smaller gates at higher levels
        
        this.width = 80 * sizeMultiplier;
        this.height = gameHeight * 0.45 * sizeMultiplier;
        this.x = gameWidth + 100;
        this.y = gameHeight / 2;
        
        this.sequence = sequence;
        this.currentCheckpoint = 0;
        this.state = 'approaching';
        this.stateTimer = 0;
        
        // Difficulty affects timing
        const baseShowTime = 2500;
        const baseHoldTime = 3500;
        this.showDuration = baseShowTime - (difficulty - 1) * 300; // Less time to memorize at higher levels
        this.holdDuration = baseHoldTime - (difficulty - 1) * 300; // Less time to pass at higher levels
        
        this.checkpoints = this.createCheckpoints(checkpointCount);
        this.difficulty = difficulty;  // Store for gap sizing
        
        // Generate multiple pillar positions at different heights
        this.generatePillars(gameHeight);
    }
    
    // Store pillar positions
    pillarTops: number[] = [];
    pillarBottoms: number[] = [];
    
    private generatePillars(gameHeight: number): void {
        // Dynamic gap size by difficulty - tighter for Precision Peaks+
        const gapSize = this.height * (this.difficulty === 3 ? 0.90 : this.difficulty === 4 ? 0.80 : 0.70); // User specs
        const minY = gameHeight * 0.10;
        const maxY = gameHeight - gapSize - gameHeight * 0.10;
        
        // Ensure we have valid bounds
        if (maxY <= minY) {
            // Fallback to center gap if calculation fails
            this.pillarTops = [gameHeight * 0.3];
            this.pillarBottoms = [gameHeight * 0.7];
            return;
        }
        
        // Random gap position
        const gapY = minY + Math.random() * (maxY - minY);
        
        // Store top pillar bottom and bottom pillar top
        this.pillarTops = [gapY]; // Top of the gap
        this.pillarBottoms = [gapY + gapSize]; // Bottom of the gap
    }

    private createCheckpoints(count: number): Checkpoint[] {
        const checkpoints: Checkpoint[] = [];
        const segmentWidth = (this.width - 20) / count;
        
        for (let i = 0; i < count; i++) {
            const colorIndex = i % this.sequence.length;
            checkpoints.push({
                color: this.sequence[colorIndex],
                passed: false,
                x: this.x + 10 + i * segmentWidth,
                width: segmentWidth - 5
            });
        }
        
        return checkpoints;
    }

    update(scrollSpeed: number): void {
        if (this.state !== 'passed' && this.state !== 'failed') {
            this.x -= scrollSpeed;
        }

        // Update checkpoint positions
        const segmentWidth = (this.width - 20) / this.checkpoints.length;
        this.checkpoints.forEach((cp, i) => {
            cp.x = this.x + 10 + i * segmentWidth;
        });

        switch (this.state) {
            case 'approaching':
                if (this.x < this.getScreenX() + 100) {
                    this.state = 'showing';
                    this.stateTimer = 0;
                }
                break;
                
            case 'showing':
                this.stateTimer += 16.67;
                if (this.stateTimer >= this.showDuration) {
                    this.state = 'waiting';
                    this.stateTimer = 0;
                }
                break;
                
            case 'waiting':
                // No timeout - player can take as long as they want
                // Just show subtle flash warning after a very long time (optional)
                this.stateTimer += 16.67;
                if (this.stateTimer > this.holdDuration * 0.9) {
                    this.flashTimer = (this.flashTimer + 1) % 30;
                }
                // Removed: No automatic failure after holdDuration
                break;
                
            case 'passed_checkpoint':
                this.stateTimer += 16.67;
                if (this.stateTimer > 300) {
                    if (this.currentCheckpoint >= this.checkpoints.length) {
                        this.state = 'passed';
                        this.passed = true;
                    } else {
                        this.state = 'waiting';
                    }
                }
                break;
        }
    }

    getScreenX(): number {
        return this.x - this.width / 2;
    }

    checkCheckpoint(playerX: number, playerY: number, playerRadius: number): { hit: boolean; correct: boolean; isLast: boolean } {
        if (this.state !== 'waiting' && this.state !== 'passed_checkpoint') {
            return { hit: false, correct: false, isLast: false };
        }
        
        if (this.currentCheckpoint >= this.checkpoints.length) {
            return { hit: false, correct: false, isLast: true };
        }

        const cp = this.checkpoints[this.currentCheckpoint];
        
        if (playerX > cp.x && playerX < cp.x + cp.width) {
            const playerTop = playerY - playerRadius;
            const playerBottom = playerY + playerRadius;
            const gateTop = this.y - this.height / 2;
            const gateBottom = this.y + this.height / 2;
            
            if (playerBottom > gateTop && playerTop < gateBottom) {
                cp.passed = true;
                const isCorrect = cp.color === this.sequence[this.currentCheckpoint];
                const isLast = this.currentCheckpoint === this.checkpoints.length - 1;
                
                if (isCorrect) {
                    this.correctCheckpoints++;
                } else {
                    this.wrongCheckpoints++;
                }
                
                this.currentCheckpoint++;
                this.state = 'passed_checkpoint';
                this.stateTimer = 0;
                
                return { hit: true, correct: isCorrect, isLast };
            }
        }
        
        return { hit: false, correct: false, isLast: false };
    }

    private fail(): void {
        this.state = 'failed';
        this.failed = true;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        const gateTop = this.y - this.height / 2;
        const gateBottom = this.y + this.height / 2;
        
        this.drawGateFrame(ctx, gateTop, gateBottom);
        
        if (this.state === 'showing' || this.state === 'waiting' || this.state === 'passed_checkpoint') {
            this.drawCheckpoints(ctx, gateTop, gateBottom);
        }
        
        if (this.state === 'showing') {
            this.drawSequenceIndicator(ctx);
        }
    }

    private drawGateFrame(ctx: CanvasRenderingContext2D, gateTop: number, gateBottom: number): void {
        ctx.save();
        
        // Flappy Bird style green pipes - THICKER PIPES
        const pillarWidth = 70; // Increased from 52
        const capHeight = 35; // Increased from 26
        
        // Get gap positions from pillarTops if available
        const gapTop = this.pillarTops.length > 0 ? this.pillarTops[0] : gateTop;
        const gapBottom = this.pillarBottoms.length > 0 ? this.pillarBottoms[0] : gateBottom;
        
        // Gate opening dimensions
        const gateLeft = this.x - this.width / 2;
        const gateRight = this.x + this.width / 2;
        
        // Pipe colors - Flappy Bird style
        const pipeColor = '#73BF2E';
        const pipeDark = '#558C22';
        const pipeLight = '#9DEA5A';
        
        // Draw top pipe (from top of screen to gap)
        this.drawPipe(ctx, this.x, 0, gapTop, pillarWidth, true);
        
        // Draw bottom pipe (from gap to bottom of screen)
        this.drawPipe(ctx, this.x, gapBottom, 1000, pillarWidth, false);
        
        ctx.restore();
    }

    private drawPipe(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, width: number, isTop: boolean): void {
        if (height <= 0) return;
        
        const pipeColor = '#73BF2E';
        const pipeDark = '#558C22';
        const pipeLight = '#9DEA5A';
        
        ctx.save();
        
        // Main pipe body
        ctx.fillStyle = pipeColor;
        ctx.fillRect(x - width/2, y, width, height);
        
        // Pipe cap (the flared part) - THICKER PIPES
        const capHeight = 35; // Increased from 26
        const capWidth = width + 16;
        
        if (isTop) {
            // Top cap - below the pipe body
            ctx.fillStyle = pipeColor;
            ctx.fillRect(x - capWidth/2, y + height - capHeight/2, capWidth, capHeight);
            
            // Cap highlight
            ctx.fillStyle = pipeLight;
            ctx.fillRect(x - width/2 + 4, y + height - capHeight/2 + 4, 8, capHeight - 8);
            
            // Cap outline
            ctx.strokeStyle = pipeDark;
            ctx.lineWidth = 3;
            ctx.strokeRect(x - capWidth/2, y + height - capHeight/2, capWidth, capHeight);
        } else {
            // Bottom cap - above the pipe body
            ctx.fillStyle = pipeColor;
            ctx.fillRect(x - capWidth/2, y - capHeight/2, capWidth, capHeight);
            
            // Cap highlight
            ctx.fillStyle = pipeLight;
            ctx.fillRect(x - width/2 + 4, y - capHeight/2 + 4, 8, capHeight - 8);
            
            // Cap outline
            ctx.strokeStyle = pipeDark;
            ctx.lineWidth = 3;
            ctx.strokeRect(x - capWidth/2, y - capHeight/2, capWidth, capHeight);
        }
        
        // Pipe body shading (left side highlight)
        ctx.fillStyle = pipeLight;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x - width/2, y, 8, height);
        
        // Pipe body outline
        ctx.globalAlpha = 1;
        ctx.strokeStyle = pipeDark;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - width/2, y, width, height);
        
        ctx.restore();
    }

    private drawBushes(ctx: CanvasRenderingContext2D, x: number, y: number): void {
        ctx.save();
        
        // Bush colors
        const bushColors = ['#22C55E', '#16A34A', '#4ADE80'];
        
        // Draw a row of bushes across the top
        for (let i = 0; i < 8; i++) {
            const bx = x - this.width/2 + (i + 0.5) * (this.width / 8);
            const by = y - 5;
            const size = 18 + Math.sin(i * 2) * 6;
            
            ctx.fillStyle = bushColors[i % bushColors.length];
            ctx.beginPath();
            ctx.arc(bx, by, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    private drawCheckpoints(ctx: CanvasRenderingContext2D, gateTop: number, gateBottom: number): void {
        this.checkpoints.forEach((cp, index) => {
            const colorConfig = SKY_COLOR_PALETTE.find(c => c.name === cp.color)!;
            
            ctx.save();
            
            let alpha = 0.6;
            let isActive = index === this.currentCheckpoint && this.state === 'waiting';
            let isPassed = cp.passed;
            let isWrong = isPassed && cp.color !== this.sequence[index];
            
            if (isPassed) {
                if (isWrong) {
                    ctx.globalAlpha = 0.8;
                    ctx.fillStyle = '#EF4444';
                    ctx.strokeStyle = '#EF4444';
                    ctx.lineWidth = 4;
                    
                    const cx = cp.x + cp.width/2;
                    const cy = this.y;
                    const size = 18;
                    
                    ctx.beginPath();
                    ctx.moveTo(cx - size, cy - size);
                    ctx.lineTo(cx + size, cy + size);
                    ctx.moveTo(cx + size, cy - size);
                    ctx.lineTo(cx - size, cy + size);
                    ctx.stroke();
                } else {
                    alpha = 0.9;
                    ctx.fillStyle = colorConfig.hex;
                    
                    const cx = cp.x + cp.width/2;
                    const cy = this.y;
                    
                    ctx.beginPath();
                    ctx.moveTo(cx - 10, cy);
                    ctx.lineTo(cx - 3, cy + 8);
                    ctx.lineTo(cx + 12, cy - 6);
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.stroke();
                }
            } else if (isActive) {
                const pulse = (Math.sin(Date.now() * 0.008) + 1) / 2;
                ctx.globalAlpha = 0.5 + pulse * 0.5;
                ctx.fillStyle = colorConfig.hex;
                ctx.shadowBlur = 15 + pulse * 15;
                ctx.shadowColor = colorConfig.glow;
            } else if (this.state === 'showing') {
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = colorConfig.hex;
            } else {
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = colorConfig.darkHex;
            }
            
            // Draw checkpoint marker
            if (!isPassed || !isWrong) {
                const barHeight = 30;
                ctx.fillRect(cp.x, this.y - barHeight/2, cp.width, barHeight);
                
                ctx.fillStyle = isPassed || this.state === 'showing' ? colorConfig.hex : colorConfig.darkHex;
                ctx.fillRect(cp.x + cp.width/2 - 5, this.y - 5, 10, 10);
            }
            
            ctx.restore();
        });
    }

    private drawSequenceIndicator(ctx: CanvasRenderingContext2D): void {
        const indicatorY = this.y - this.height/2 - 45;
        const spacing = 35;
        const startX = this.x - ((this.sequence.length - 1) * spacing) / 2;
        
        ctx.save();
        
        // Background panel
        ctx.fillStyle = 'rgba(30, 58, 138, 0.9)'; // Dark blue
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.5)';
        ctx.lineWidth = 2;
        
        const panelWidth = this.sequence.length * spacing + 25;
        const panelHeight = 50;
        
        ctx.beginPath();
        ctx.roundRect(
            this.x - panelWidth/2,
            indicatorY - panelHeight/2,
            panelWidth,
            panelHeight,
            8
        );
        ctx.fill();
        ctx.stroke();
        
        // Memory text
        ctx.fillStyle = '#93C5FD';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', this.x, indicatorY - 12);
        
        // Show sequence colors
        this.sequence.forEach((color, index) => {
            const colorConfig = SKY_COLOR_PALETTE.find(c => c.name === color)!;
            const x = startX + index * spacing;
            
            const flash = (Math.sin(Date.now() * 0.01 + index * 0.5) + 1) / 2;
            
            ctx.globalAlpha = 0.6 + flash * 0.4;
            ctx.fillStyle = colorConfig.hex;
            ctx.shadowBlur = 8 + flash * 8;
            ctx.shadowColor = colorConfig.glow;
            
            ctx.beginPath();
            ctx.arc(x, indicatorY + 8, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        });
        
        ctx.restore();
    }

    isOffScreen(): boolean {
        return this.x + this.width < -50;
    }

    getResults(): { correct: number; wrong: number; passed: boolean } {
        return {
            correct: this.correctCheckpoints,
            wrong: this.wrongCheckpoints,
            passed: this.passed
        };
    }
}

// Generate random sequence based on difficulty
export function generateSkySequence(length: number, difficulty: number): MemoryColor[] {
    const availableColors: MemoryColor[] = 
        difficulty <= 1 ? ['red', 'blue'] :
        difficulty <= 2 ? ['red', 'green', 'blue'] :
        ['red', 'green', 'blue', 'yellow'];
    
    const sequence: MemoryColor[] = [];
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * availableColors.length);
        sequence.push(availableColors[randomIndex]);
    }
    return sequence;
}

