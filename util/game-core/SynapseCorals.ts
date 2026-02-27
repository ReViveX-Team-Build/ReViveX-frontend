// ─────────────────────────────────────────────────────────────────────────────
//  SynapseCorals  v2  — SVG-based coral rendering
//
//  WHAT CHANGED FROM v1:
//  • Branch generation (generateFan / generateBranching / generateTubes) removed
//  • Branch interface + branches[] array removed
//  • colorBase / colorHighlight removed (SVGs carry their own colours)
//  • draw() now uses ctx.drawImage() per coral, with sway as a whole-image rotation
//  • 4 SVG images preloaded in constructor: fan_coral, coral_group, coral_tube, coral_brain
//  • coral type extended: 'fan' | 'staghorn' | 'tubes' | 'brain'
//  • Rock piles remain procedural (no rock SVG available)
//
//  NOTHING ELSE IN THE REPO NEEDS TO CHANGE — SynapseBackground, SynapsePlayer,
//  and SeaGrass have zero coupling to coral internals.
// ─────────────────────────────────────────────────────────────────────────────

interface Boulder {
    relX: number;
    relY: number;
    r: number;
    color: string;
}

interface RockPile {
    type: 'rock_pile';
    x: number;
    y: number;
    boulders: Boulder[];
    scale: number;
}

interface Coral {
    type: 'fan' | 'staghorn' | 'tubes' | 'brain';
    x: number;
    y: number;
    swayOffset: number;
    scale: number;
    /** Natural width of this coral's SVG at scale=1, in canvas px */
    drawW: number;
    /** Natural height of this coral's SVG at scale=1, in canvas px */
    drawH: number;
}

type CoralItem = RockPile | Coral;
type Habitat = 'sand_dweller' | 'rock_dweller';

// ─── Size presets per coral type (tweak freely) ───────────────────────────────
const CORAL_SIZES: Record<Coral['type'], { w: number; h: number }> = {
    fan:      { w: 100, h: 120 },
    staghorn: { w:  90, h: 110 },
    tubes:    { w:  60, h: 130 },
    brain:    { w:  80, h:  80 },
};

export class SynapseCorals {
    gameWidth:  number;
    gameHeight: number;
    corals:     CoralItem[];

    // SVG image cache — loaded once, reused every frame
    private imgs: Record<Coral['type'], HTMLImageElement>;
    private imgsReady: Record<Coral['type'], boolean> = {
        fan: false, staghorn: false, tubes: false, brain: false,
    };

    constructor(gameWidth: number, gameHeight: number) {
        this.gameWidth  = gameWidth;
        this.gameHeight = gameHeight;
        this.corals     = [];

        // ── Preload SVGs ──────────────────────────────────────────────────
        const load = (src: string, key: Coral['type']) => {
            const img = new Image();
            img.onload = () => { this.imgsReady[key] = true; };
            img.src = src;
            return img;
        };

        this.imgs = {
            fan:      load('/images/fan_coral.svg',    'fan'),
            staghorn: load('/images/coral_group.svg',  'staghorn'),
            tubes:    load('/images/coral_tube.svg',   'tubes'),
            brain:    load('/images/coral_brain.svg',  'brain'),
        };

        this.init();
    }

    // ─────────────────────────────────────────────────────────────────────
    init(): void {
        for (let i = 0; i < 3; i++) {
            this.spawnCluster(i * (this.gameWidth / 2.5) + 150);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    generateBoulderPile(rockGroup: RockPile): void {
        const numBoulders = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numBoulders; i++) {
            rockGroup.boulders.push({
                relX:  (Math.random() - 0.5) * 120,
                relY:  (Math.random() * 30) - 10,
                r:     30 + Math.random() * 25,
                color: Math.random() > 0.5 ? '#708090' : '#5F9EA0',
            });
        }
        rockGroup.boulders.sort((a, b) => a.relY - b.relY);
    }

    // ─────────────────────────────────────────────────────────────────────
    spawnCluster(centerX: number): void {
        const isRockPile = Math.random() > 0.4;

        if (isRockPile) {
            const rockGroup: RockPile = {
                type:    'rock_pile',
                x:       centerX,
                y:       this.gameHeight - 15,
                boulders: [],
                scale:   0.5 + Math.random() * 0.5,
            };
            this.generateBoulderPile(rockGroup);
            this.corals.push(rockGroup);

            // Corals that sit on top of the rock
            const numCorals = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < numCorals; i++) {
                const host   = rockGroup.boulders[Math.floor(Math.random() * rockGroup.boulders.length)];
                const coralX = centerX + host.relX;
                const coralY = (this.gameHeight - 15) + host.relY - host.r * 0.8;
                this.createSingleCoral(coralX, coralY, 'rock_dweller');
            }
        } else {
            // Tubes scattered on sand
            const numTubes = 3 + Math.floor(Math.random() * 4);
            for (let i = 0; i < numTubes; i++) {
                const offsetX = (Math.random() - 0.5) * 80;
                this.createSingleCoral(centerX + offsetX, this.gameHeight - 10, 'sand_dweller');
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    createSingleCoral(x: number, y: number, habitat: Habitat): void {
        let type: Coral['type'];

        if (habitat === 'sand_dweller') {
            type = 'tubes';
        } else {
            // rock dweller: fan / staghorn / brain
            const r = Math.random();
            type = r < 0.4 ? 'fan' : r < 0.75 ? 'staghorn' : 'brain';
        }

        const size = CORAL_SIZES[type];

        const coral: Coral = {
            type,
            x,
            y,
            swayOffset: Math.random() * 100,
            scale:      1.0 + Math.random() * 0.5,
            drawW:      size.w,
            drawH:      size.h,
        };

        this.corals.push(coral);
    }

    // ─────────────────────────────────────────────────────────────────────
    update(): void {
        this.corals.forEach(item => { item.x -= 2; });

        for (let i = this.corals.length - 1; i >= 0; i--) {
            if (this.corals[i].x < -200) this.corals.splice(i, 1);
        }

        if (this.corals.length < 5) this.spawnCluster(this.gameWidth + 100);
    }

    // ─────────────────────────────────────────────────────────────────────
    draw(ctx: CanvasRenderingContext2D, nightFactor: number): void {
        const time = Date.now() * 0.0008;

        this.corals.forEach(item => {
            ctx.save();
            ctx.translate(item.x, item.y);

            // ── Rock pile — unchanged procedural drawing ──────────────────
            if (item.type === 'rock_pile') {
                ctx.save();
                ctx.scale(item.scale, item.scale);

                item.boulders.forEach(boulder => {
                    ctx.beginPath();
                    ctx.arc(boulder.relX, boulder.relY, boulder.r, 0, Math.PI * 2);

                    const grad = ctx.createRadialGradient(
                        boulder.relX - 10, boulder.relY - 10, 5,
                        boulder.relX,      boulder.relY,      boulder.r
                    );
                    grad.addColorStop(0, '#8daab9');
                    grad.addColorStop(1, '#2f4f4f');
                    ctx.fillStyle   = grad;
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                    ctx.lineWidth   = 2;
                    ctx.stroke();
                });

                ctx.restore();

            // ── SVG coral ────────────────────────────────────────────────
            } else {
                const coral = item as Coral;
                const img   = this.imgs[coral.type];

                if (!this.imgsReady[coral.type]) {
                    ctx.restore();
                    return; // skip until image is loaded
                }

                const w = coral.drawW * coral.scale;
                const h = coral.drawH * coral.scale;

                // Gentle whole-image sway — mimics v1 branch sway
                const swayAngle =
                    Math.sin(time + coral.swayOffset)         * 0.06 +
                    Math.sin(time * 1.5 + coral.swayOffset + 1) * 0.025;

                // Night glow: faint shadow in the colour of the coral type
                if (nightFactor > 0.1) {
                    const glowColour: Record<Coral['type'], string> = {
                        fan:      'rgba(218,112,214,0.55)',  // orchid — matches v1 purple
                        staghorn: 'rgba(127,255,212,0.55)',  // aquamarine — matches v1 teal
                        tubes:    'rgba(127,255,212,0.45)',
                        brain:    'rgba(218,112,214,0.45)',
                    };
                    ctx.shadowBlur  = 15 * nightFactor;
                    ctx.shadowColor = glowColour[coral.type];
                }

                ctx.scale(1, 1); // ensure clean transform before rotate
                ctx.rotate(swayAngle);

                // Draw SVG anchored at its bottom-centre  (matching v1 where y=base)
                ctx.drawImage(img, -w / 2, -h, w, h);

                ctx.shadowBlur = 0;
            }

            ctx.restore();
        });
    }
}