export class SynapseCorals {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.corals = [];
        this.init();
    }

    init() {
        // Spawn fewer, but higher quality corals
        for (let i = 0; i < 3; i++) {
            this.spawnCluster(i * (this.gameWidth / 2.5) + 150);
        }
    }
   generateBoulderPile(rockGroup) {
        
    
    const numBoulders = 3 + Math.floor(Math.random() * 3);
        for(let i=0; i<numBoulders; i++) {
        rockGroup.boulders.push({
            relX: (Math.random() - 0.5) * 120, // Spread width
            relY: (Math.random() * 30) - 10,   // Height variation
            r: 30 + Math.random() * 25,        // Radius size
            color: Math.random() > 0.5 ? '#708090' : '#5F9EA0' // SlateGray or CadetBlue
        });
    }
    // Sort by Y so lower boulders draw in front
    rockGroup.boulders.sort((a, b) => a.relY - b.relY);
}

    spawnCluster(centerX) {
        // 1. Create the Anchor Rock
        const isRockPile = Math.random() > 0.4; // 60% chance of rocks
        
        if (isRockPile) {
            const rockGroup = {
            type: 'rock_pile',
            x: centerX,
            y: this.gameHeight - 15,
            boulders: [],
            scale: 0.0 + Math.random() * 0.5
        };
        
        this.generateBoulderPile(rockGroup); 
        this.corals.push(rockGroup);
         
        //GROW A "BUSH" OF CORALS ON TOP OF THE ROCK
        const numCorals = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numCorals; i++) {
            // Find a random boulder to sit on
            const hostBoulder = rockGroup.boulders[Math.floor(Math.random() * rockGroup.boulders.length)];
        
           // Calculate position relative to the group center
            const coralX = centerX + hostBoulder.relX; 
            const coralY = (this.gameHeight - 15) + hostBoulder.relY - (hostBoulder.r * 0.8); // Sit on top

            this.createSingleCoral(coralX, coralY, 'rock_dweller');
        }

        } else {
        // --- OPTION B: TUBES ON SAND (No Rocks) ---
        const numTubes = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numTubes; i++) {
            const offsetX = (Math.random() - 0.5) * 80;
            this.createSingleCoral(centerX + offsetX, this.gameHeight - 10, 'sand_dweller');
        }
    }
}
    
createSingleCoral(x, y, habitat) {
        let type;
    if (habitat === 'sand_dweller') {
        type = 'tubes'; // Tubes ONLY on sand
    } else {
        // Fans and Staghorns on rocks
        type = Math.random() > 0.5 ? 'fan' : 'staghorn';
    }

        // Colors
        const isPurple = Math.random() > 0.5;
        const colorBase = isPurple ? '#4B0082' : '#008B8B'; 
        const colorHighlight = isPurple ? '#DA70D6' : '#7FFFD4';

        const coral = {
            type: type,
            x: x, 
            y: y,
            colorBase: colorBase,
            colorHighlight: colorHighlight,
            branches: [],
            swayOffset: Math.random() * 100,
            scale: 1.0 + Math.random() * 0.5 // Bigger scale for "Bush" look
        };

        if (type === 'fan') this.generateFan(coral);
        else if (type === 'staghorn') this.generateBranching(coral, 0, 0, -Math.PI/2, 5, 20);
        else this.generateTubes(coral);

        this.corals.push(coral);
    }

    generateFan(coral) {
        // Denser fan (12 ribs instead of 8)
        const numRibs = 12;
        for(let i=0; i<numRibs; i++) {
            const angle = -Math.PI + (i * (Math.PI/ (numRibs-1))); 
            coral.branches.push({
                x: 0, y: 0,
                length: 90 + Math.random() * 50,
                angle: angle * 0.8 - (Math.PI/2 * 0.2), 
                thickness: 5,
                type: 'fan_rib'
            });
        }
    }

    generateBranching(coral, x, y, angle, depth, length) {
        if (depth === 0) return;

        const bend = (Math.random() - 0.5) * 1.5; 
        const endX = x + Math.cos(angle + bend) * length;
        const endY = y + Math.sin(angle + bend) * length;

        coral.branches.push({
            x: x, y: y, ex: endX, ey: endY,
            cp1x: x + Math.cos(angle) * (length/2), 
            cp1y: y + Math.sin(angle) * (length/2),
            depth: depth,
            thickness: depth * 1.8, // Thicker base
            type: 'branch'
        });

        // BUSHY FIX: Always split into at least 2 branches
        const branchCount = 2 + (Math.random() > 0.7 ? 1 : 0); 
        
        for(let i=0; i<branchCount; i++) {
            const spread = 0.7; 
            const newAngle = angle + (Math.random() * spread - (spread/2));
            this.generateBranching(coral, endX, endY, newAngle, depth - 1, length * 0.85);
        }
    }

    generateTubes(coral) {
        // More tubes per bunch (8 instead of 5)
        for(let i=0; i<8; i++) {
            coral.branches.push({
                x: (Math.random() - 0.5) * 30, // Wider bunch
                y: 0,
                length: 70 + Math.random() * 70,
                thickness: 8 + Math.random() * 4,
                type: 'tube'
            });
        }
    }

    update() {
        // Move everything left
        this.corals.forEach((item, index) => {
            item.x -= 2; 
        });

        // Loop clusters
        // Check the FIRST item (assuming it's a cluster leader). 
        // If it goes too far left, remove the whole group?
        // Simpler: Just remove individual items if they go way off screen
        for (let i = this.corals.length - 1; i >= 0; i--) {
            if (this.corals[i].x < -200) {
                this.corals.splice(i, 1);
            }
        }
        
        // Spawn new clusters if we run out
        if (this.corals.length < 5) {
             this.spawnCluster(this.gameWidth + 100);
        }
    }

    draw(ctx, nightFactor) {
        const time = Date.now() * 0.0008;

        this.corals.forEach(item => {
            ctx.save();
            ctx.translate(item.x, item.y);

            // --- DRAW ROCK ---
            if (item.type === 'rock') {
                ctx.fillStyle = item.color;
                ctx.beginPath();
                if (item.points.length > 0) {
                    ctx.moveTo(item.points[0].x, item.points[0].y);
                    for (let p of item.points) ctx.lineTo(p.x, p.y);
                }
                ctx.fill();
                
                // Rock Highlight (Mossy top)
                ctx.strokeStyle = "rgba(0,0,0,0.3)";
                ctx.lineWidth = 4;
                ctx.stroke();
            } 
            
            // --- DRAW CORAL ---
            else {
                ctx.scale(item.scale, item.scale);
                
                // Shadow
                ctx.shadowBlur = 5;
                ctx.shadowColor = "rgba(0,0,0,0.5)";
                if (nightFactor > 0.1) {
                    ctx.shadowBlur = 15 * nightFactor;
                    ctx.shadowColor = item.colorHighlight;
                }

                item.branches.forEach(branch => {
                    const swayBase = Math.sin(time + item.swayOffset);
                    const swayTip = Math.sin(time * 1.5 + item.swayOffset + 1);

                    const gradient = ctx.createLinearGradient(0, 0, 0, -100);
                    gradient.addColorStop(0, item.colorBase);       
                    gradient.addColorStop(1, item.colorHighlight);  
                    
                    ctx.strokeStyle = gradient;
                    ctx.fillStyle = gradient;
                    ctx.lineCap = "round";

                    if (item.type === 'fan') {
                        const tipX = Math.cos(branch.angle) * branch.length + (swayTip * 8);
                        const tipY = Math.sin(branch.angle) * branch.length + (swayBase * 4);
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.quadraticCurveTo(tipX/2, tipY/2 + (swayBase * 5), tipX, tipY);
                        ctx.lineWidth = branch.thickness;
                        ctx.stroke();

                    } else if (item.type === 'staghorn') {
                        ctx.beginPath();
                        ctx.moveTo(branch.x, branch.y);
                        ctx.quadraticCurveTo(branch.cp1x, branch.cp1y, branch.ex, branch.ey);
                        ctx.lineWidth = branch.thickness;
                        ctx.stroke();

                    } else if (item.type === 'tubes') {
                        const sway = swayBase * (branch.length / 8);
                        ctx.beginPath();
                        ctx.moveTo(branch.x, branch.y);
                        ctx.quadraticCurveTo(branch.x + sway, branch.y - (branch.length/2), branch.x + (sway*1.2), branch.y - branch.length);
                        ctx.lineWidth = branch.thickness;
                        ctx.stroke();
                        ctx.fillStyle = "#0a0a1a"; 
                        ctx.beginPath(); 
                        ctx.arc(branch.x + (sway*1.2), branch.y - branch.length, branch.thickness/2 - 1, 0, Math.PI*2); 
                        ctx.fill();
                    }
                });
            }
            ctx.restore();
        });
    }
}