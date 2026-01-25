export class SynapseCorals {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.corals = [];
        this.init();
    }

    init() {
        // Spawn fewer, but higher quality corals
        for (let i = 0; i < 5; i++) {
            this.spawnCoral(i * (this.gameWidth / 4) + Math.random() * 100);
        }
    }

    spawnCoral(xPosition) {
        // 3 Types: 
        // 1. 'fan' (Wide, swaying, soft)
        // 2. 'staghorn' (Thick, rigid, pointy)
        // 3. 'tubes' (Vertical, tall, swaying tips)
        const types = ['fan', 'staghorn', 'tubes'];
        const type = types[Math.floor(Math.random() * types.length)];

        const isPurple = Math.random() > 0.5;
        const colorBase = isPurple ? '#4B0082' : '#008B8B'; 
        const colorHighlight = isPurple ? '#DA70D6' : '#7FFFD4';
        
        const newCoral = {
            x: xPosition,
            y: this.gameHeight - 10, 
            type: type,
            // 2. ASSIGN THEM CORRECTLY HERE
            colorBase: colorBase, 
            colorHighlight: colorHighlight, // <--- This was missing!
            branches: [],
            swayOffset: Math.random() * 100, 
            scale: 0.8 + Math.random() * 0.4 
        };

        // GENERATE STRUCTURE
        if (type === 'fan') {
            this.generateFan(newCoral);
        } else if (type === 'staghorn') {
            this.generateBranching(newCoral, 0, 0, -Math.PI/2, 6, 18);
        } else {
            this.generateTubes(newCoral);
        }
        
        this.corals.push(newCoral);
    }

    // --- GENERATORS (The Geometry) ---

    generateFan(coral) {
        // Fans branch out in a semi-circle
        const numRibs = 8;
        for(let i=0; i<numRibs; i++) {
            const angle = -Math.PI + (i * (Math.PI/ (numRibs-1))); // Spread -180 to 0
            // Fan ribs are simple curves
            coral.branches.push({
                x: 0, y: 0,
                length: 80 + Math.random() * 40,
                angle: angle * 0.8 - (Math.PI/2 * 0.2), // Clamped spread
                thickness: 4,
                type: 'fan_rib'
            });
        }
    }

    generateBranching(coral, x, y, angle, depth, length) {
        if (depth === 0) return;

        // Curve control point (gives it the organic bend)
        const bend = (Math.random() - 0.5) * 1.5; 
        
        const endX = x + Math.cos(angle + bend) * length;
        const endY = y + Math.sin(angle + bend) * length;

        coral.branches.push({
            x: x, y: y,
            ex: endX, ey: endY,
            cp1x: x + Math.cos(angle) * (length/2), // Control Point 1
            cp1y: y + Math.sin(angle) * (length/2),
            depth: depth,
            thickness: depth * 1.5, // Tapering: Thicker at bottom
            type: 'branch'
        });

        // Split into 2 or 3 branches
        const branchCount = Math.random() > 0.3 ? 2 : 1;
        for(let i=0; i<branchCount; i++) {
            const spread = 0.6; 
            const newAngle = angle + (Math.random() * spread - (spread/2));
            this.generateBranching(coral, endX, endY, newAngle, depth - 1, length * 0.9);
        }
    }

    generateTubes(coral) {
        // Tall vertical tubes
        for(let i=0; i<5; i++) {
            coral.branches.push({
                x: (Math.random() - 0.5) * 20, 
                y: 0,
                length: 60 + Math.random() * 60,
                thickness: 6 + Math.random() * 4,
                type: 'tube'
            });
        }
    }

    // --- UPDATE (The Movement) ---
    update() {
        this.corals.forEach((coral, index) => {
            // Scroll Left
            coral.x -= 2; 

            // Respawn
            if (coral.x < -150) {
                this.corals.splice(index, 1);
                this.spawnCoral(this.gameWidth + 50 + Math.random() * 150);
            }
        });
    }

    // --- DRAW (The Art) ---
    draw(ctx, nightFactor) {
       const time = Date.now() * 0.0008;

        this.corals.forEach(coral => {
            ctx.save();
            ctx.translate(coral.x, coral.y);
            ctx.scale(coral.scale, coral.scale);
            // BASE SHADOW
            ctx.shadowBlur = 5;
            ctx.shadowColor = "rgba(0,0,0,0.5)";

            // GLOW SETUP
            if (nightFactor > 0.1) {
                ctx.shadowBlur = 15 * nightFactor;
                ctx.shadowColor = coral.colorBase;
            }

            coral.branches.forEach(branch => {
                // Complex Sway Math (Combining two sine waves for realism)
                const swayBase = Math.sin(time + coral.swayOffset);
                const swayTip = Math.sin(time * 1.5 + coral.swayOffset + 1);

                const gradient = ctx.createLinearGradient(0, 0, 0, -100);
                gradient.addColorStop(0, coral.colorBase);       // Roots are dark
                gradient.addColorStop(1, coral.colorHighlight);  // Tips are bright
                ctx.strokeStyle = gradient;
                ctx.fillStyle = gradient;
                ctx.lineCap = "round";
                
                // Different draw styles per type
               if (coral.type === 'fan') {
                    // FAN: Ripple like fabric
                    const tipX = Math.cos(branch.angle) * branch.length + (swayTip * 8); // Reduced sway amplitude
                    const tipY = Math.sin(branch.angle) * branch.length + (swayBase * 4);
                    
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.quadraticCurveTo(tipX/2, tipY/2 + (swayBase * 5), tipX, tipY);
                    
                    ctx.lineWidth = branch.thickness;
                    ctx.stroke();

                } else if (coral.type === 'staghorn') {
                    // STAGHORN: Rigid, organic curves
                   ctx.beginPath();
                    ctx.moveTo(branch.x, branch.y);
                    ctx.quadraticCurveTo(branch.cp1x, branch.cp1y, branch.ex, branch.ey);
                    
                    ctx.lineWidth = branch.thickness;
                    ctx.stroke();

                } else if (coral.type === 'tubes') {
                    // TUBES: Rubber-like sway
                    const sway = swayBase * (branch.length / 8);
                    
                    ctx.beginPath();
                    ctx.moveTo(branch.x, branch.y);
                    // Curve the whole body
                    ctx.quadraticCurveTo(branch.x + sway, branch.y - (branch.length/2), branch.x + (sway*1.5), branch.y - branch.length);
                    
                    ctx.lineWidth = branch.thickness;
                    ctx.strokeStyle = coral.colorBase;
                    ctx.lineCap = "round";
                    ctx.stroke();
                    
                    // Hollow top effect
                    ctx.fillStyle = "#0a0a1a"; // Dark center
                    ctx.beginPath(); 
                    ctx.arc(branch.x + (sway*1.5), branch.y - branch.length, branch.thickness/2 - 1, 0, Math.PI*2); 
                    ctx.fill();
                }
            });

            ctx.restore();
        });
    }
}