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