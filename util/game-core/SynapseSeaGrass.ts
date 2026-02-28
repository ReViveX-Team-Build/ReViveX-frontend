// ─── Core Types ────────────────────────────────────────────────────────────
// Defines the visual styles available for our sea flora
export type GrassType = 'blade' | 'silhouette' | 'anemone' | 'branch' | 'kelp';

// Represents a single strand, tentacle, or kelp frond
interface Stem {
  relX:       number;  // Position relative to the cluster's center
  height:     number;
  width:      number;
  swaySpeed:  number;  // Base speed for the sine wave animation
  swayOffset: number;  // Phase shift so they don't sway in perfect unison
  lean:       number;  // Interactive bend caused by the player
  depth:      number;  // Used for parallax or shadow intensity
  angle:      number;  // Natural resting angle
  hue:        number;  // Slight color variation per stem
}

// A logical grouping of stems that share a base position
interface Cluster {
  x:         number;
  baseY:     number;
  stems:     Stem[];
  type:      GrassType;
  baseWidth: number;
  scale:     number;
}

export class SeaGrass {
  gameWidth:  number;
  gameHeight: number;
  clusters:   Cluster[] = [];

  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth  = gameWidth;
    this.gameHeight = gameHeight;
    this.init();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Initial scene seeding. Adjust counts here to change overall density.
  private init(): void {
    const plan: { type: GrassType; count: number }[] = [
      { type: 'silhouette', count: 4 },   // Fewer, shorter background elements
      { type: 'kelp',       count: 4 },
      { type: 'branch',     count: 5 },   // More but much smaller/darker shadows
      { type: 'anemone',    count: 3 },
      { type: 'blade',      count: 6 },
    ];
    
    plan.forEach(({ type, count }) => {
      for (let i = 0; i < count; i++) {
        this.addCluster(Math.random() * this.gameWidth, type);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Generates a new grouping of flora at a specific X coordinate
  addCluster(x: number, type?: GrassType): void {
    const types: GrassType[] = ['blade','silhouette','anemone','branch','kelp'];
    const t = type ?? types[Math.floor(Math.random() * types.length)];

    const stemCount = this.stemCount(t);
    const stems: Stem[] = [];
    for (let j = 0; j < stemCount; j++) {
      stems.push(this.makeStem(t, j, stemCount));
    }

    this.clusters.push({
      x, 
      baseY: this.gameHeight,
      stems, 
      type: t,
      baseWidth: this.clusterWidth(t),
      // Specific scaling rules: Branches are kept small to act as subtle shadows
      scale: t === 'branch'
        ? 0.35 + Math.random() * 0.30   // 0.35–0.65 range
        : t === 'silhouette'
          ? 0.55 + Math.random() * 0.35  // 0.55–0.90 range
          : 0.80 + Math.random() * 0.45, // other types
    });
  }

  // Helper to determine the density of a cluster based on its type
  private stemCount(t: GrassType): number {
    switch (t) {
      case 'blade':      return 4 + Math.floor(Math.random() * 5);   // 4–8
      case 'silhouette': return 3 + Math.floor(Math.random() * 3);   // 3–5
      case 'anemone':    return 6 + Math.floor(Math.random() * 6);   // 6-11
      case 'branch':     return 1;                                   // Single distinct shape
      case 'kelp':       return 2 + Math.floor(Math.random() * 2);   // 2–3
    }
  }

  private clusterWidth(t: GrassType): number {
    switch (t) {
      case 'blade':      return 32 + Math.random() * 22;
      case 'silhouette': return 45 + Math.random() * 35;
      case 'anemone':    return 38 + Math.random() * 28;
      case 'branch':     return 30;
      case 'kelp':       return 38 + Math.random() * 28;
    }
  }

  // Constructs the individual properties for a single stem/frond
  private makeStem(t: GrassType, idx: number, total: number): Stem {
    const spread = this.clusterWidth(t);
    
    // Distribute stems evenly across the cluster's width with a slight random jitter
    const relX = total > 1
      ? (idx / (total - 1) - 0.5) * spread + (Math.random() - 0.5) * 14
      : 0;

    const base: Stem = {
      relX,
      height:     1,
      width:      1,
      swaySpeed:  0.0015 + Math.random() * 0.0022,
      swayOffset: Math.random() * Math.PI * 2,
      lean:       0,
      depth:      Math.random(),
      angle:      (Math.random() - 0.5) * 0.18,
      hue:        Math.random(),
    };

    // Apply type-specific dimensions and animation overrides
    switch (t) {
      case 'blade':
        base.height = 40 + Math.random() * 120;
        base.width  = 5  + Math.random() * 8;
        base.angle  = (Math.random() - 0.5) * 0.30;
        break;
      case 'silhouette':
        base.height = 60 + Math.random() * 70;
        base.width  = 5  + Math.random() * 4;
        base.swaySpeed *= 0.65; // Moves slower in the background
        break;
      case 'anemone':
        base.height = 28 + Math.random() * 36;
        base.width  = 4  + Math.random() * 5;
        base.swaySpeed *= 1.20; // Tentacles are more active
        break;
      case 'branch':
        base.height = 40 + Math.random() * 50;
        base.width  = 3;
        base.swaySpeed *= 0.50;
        break;
      case 'kelp':
        base.height = 130 + Math.random() * 140;
        base.width  = 18  + Math.random() * 16;
        break;
    }

    return base;
  }