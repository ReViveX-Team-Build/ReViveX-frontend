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