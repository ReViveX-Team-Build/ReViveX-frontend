// ─── What are we drawing? ──────────────────────────────────────────────────

// Just the names of our SVG files so we don't typo them later
type CoralSVG = 'fan' | 'orange' | 'pipu' | 'purple' | 'pur1' | 'red' | 'tubes';
type StarfishSVG = 'starfish';
type AssetKey = CoralSVG | StarfishSVG;

// 0 is way in the back, 2 is right in your face
type DepthLayer = 0 | 1 | 2;

// How big are these things naturally? 
const ASSET_SIZE: Record<AssetKey, { w: number; h: number }> = {
  fan:      { w: 200, h: 360 },
  orange:   { w: 310, h: 510 },
  pipu:     { w: 265, h: 300 },
  purple:   { w: 255, h: 315 },
  pur1:     { w: 250, h: 320 },
  red:      { w: 255, h: 295 },
  tubes:    { w: 200, h: 340 },
  starfish: { w: 200, h: 200 },
};

// How much should they sway? (Starfish don't wiggle, obviously)
const ASSET_SWAY: Record<AssetKey, number> = {
  fan:      0.080,
  orange:   0.045,
  pipu:     0.055,
  purple:   0.048,
  pur1:     0.050,
  red:      0.042,
  tubes:    0.095,
  starfish: 0.000,
};

// The "neon" look for when the sun goes down
const ASSET_GLOW: Record<AssetKey, string> = {
  fan:      'rgba(218,112,214,0.55)',
  orange:   'rgba(255,160,80,0.50)',
  pipu:     'rgba(255,100,180,0.55)',
  purple:   'rgba(200,100,255,0.55)',
  pur1:     'rgba(190,90,255,0.58)',
  red:      'rgba(255,80,80,0.52)',
  tubes:    'rgba(127,255,212,0.45)',
  starfish: 'rgba(255,180,60,0.40)',
};

const ASSET_SRC: Record<AssetKey, string> = {
  fan:      '/images/fan_coral.svg',
  orange:   '/images/coral_or.svg',
  pipu:     '/images/coral_pipu.svg',
  purple:   '/images/coral_pur.svg',
  pur1:     '/images/coral_pur1.svg',
  red:      '/images/coral_red.svg',
  tubes:    '/images/coral_tube.svg',
  starfish: '/images/starfish.svg',
};

// Rules for the layers: back layers are small, faint, and blue-ish
const LAYER_PROPS: Record<DepthLayer, {
  scaleRange:   [number, number];
  opacityRange: [number, number];
  blueTint:     number;
  yOffset:      number;
}> = {
  0: { scaleRange: [0.10, 0.28], opacityRange: [0.25, 0.45], blueTint: 0.70, yOffset: 18 },
  1: { scaleRange: [0.25, 0.48], opacityRange: [0.60, 0.80], blueTint: 0.28, yOffset: 5  },
  2: { scaleRange: [0.40, 0.75], opacityRange: [0.90, 1.00], blueTint: 0.00, yOffset: 0  },
};

// ─── Data structures for our underwater world ──────────────────────────────

interface CoralSprite {
  kind:    'sprite';
  asset:   AssetKey;
  x:       number;
  y:       number; // Anchored at the bottom
  scale:   number;
  layer:   DepthLayer;
  swayOff: number; // Random offset so they don't all sway in sync like a cult
  opacity: number;
}

interface Boulder {
  x: number; y: number;
  rx: number; ry: number; // Basically how wide/tall the rock is
  rot: number;
}

interface ReefGroup {
  kind:     'reef';
  x:        number;
  y:        number;
  layer:    DepthLayer;
  boulders: Boulder[];
  corals:   CoralSprite[];
  pebbles:  { x: number; y: number; r: number }[];
}

type SceneItem = CoralSprite | ReefGroup;

// Don't let things bunch up too much
const LANE_MIN_DIST: Record<DepthLayer, number> = {
  0: 160,
  1: 240,
  2: 320,
};

export class SynapseCorals {
  gameWidth:  number;
  gameHeight: number;

  private items: SceneItem[] = [];
  private imgs:  Record<AssetKey, HTMLImageElement>;
  private ready: Record<AssetKey, boolean>;
  private lanePositions: Record<DepthLayer, number[]> = { 0: [], 1: [], 2: [] };
  private scrollX = 0;

  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth  = gameWidth;
    this.gameHeight = gameHeight;
    this.ready = {} as Record<AssetKey, boolean>;

    // Quick helper to suck in the images
    const load = (src: string, key: AssetKey): HTMLImageElement => {
      const img  = new Image();
      this.ready[key] = false;
      img.onload = () => { this.ready[key] = true; };
      img.src    = src;
      return img;
    };

    this.imgs = Object.fromEntries(
      (Object.keys(ASSET_SRC) as AssetKey[]).map(k => [k, load(ASSET_SRC[k], k)])
    ) as Record<AssetKey, HTMLImageElement>;

    this.init();
  }

  private init(): void {
    // Break the screen into 6 segments so we can spread stuff out evenly-ish
    const W   = this.gameWidth;
    const seg = W / 6;

    // Plop down some background clusters
    this.addBackgroundCluster(seg * 0.4);
    this.addBackgroundCluster(seg * 1.8);
    this.addBackgroundCluster(seg * 3.5);
    this.addBackgroundCluster(seg * 5.2);

    // Some midground solo performers
    this.addMidgroundSolo(seg * 0.9);
    this.addMidgroundSolo(seg * 2.6);
    this.addMidgroundSolo(seg * 4.4);

    // The "Hero" reefs in the front
    this.addReefGroup(seg * 0.2, 2);
    this.addReefGroup(seg * 1.5, 2);
    this.addReefGroup(seg * 2.9, 2);
    this.addReefGroup(seg * 4.2, 2);
    this.addReefGroup(seg * 5.6, 2);

    // Scatter some pebbles so the floor isn't boring
    this.addPebblePatch(seg * 0.7, 2);
    this.addPebblePatch(seg * 2.2, 2);
    this.addPebblePatch(seg * 3.8, 2);
    this.addPebblePatch(seg * 5.1, 2);

    // Some extra flair
    this.addSoloFeature(seg * 1.1, 2, 'tubes');
    this.addSoloFeature(seg * 3.3, 2, 'fan');
    this.addSoloFeature(seg * 5.8, 2, 'tubes');
  }