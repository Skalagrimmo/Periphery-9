/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural 16-bit Pixel Art Generator
// Pre-bakes crisp pixel art sprites onto offscreen canvases once at startup.
// Fast, offline, zero network requests, lightweight memory footprint.

export interface SpriteAtlas {
  tiles: Record<string, HTMLCanvasElement>;
  characters: Record<string, HTMLCanvasElement>;
  enemies: Record<string, HTMLCanvasElement>;
  effects: Record<string, HTMLCanvasElement>;
  props: Record<string, HTMLCanvasElement>;
}

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

export function generateSpriteAtlas(): SpriteAtlas {
  const tiles: Record<string, HTMLCanvasElement> = {};
  const characters: Record<string, HTMLCanvasElement> = {};
  const enemies: Record<string, HTMLCanvasElement> = {};
  const effects: Record<string, HTMLCanvasElement> = {};
  const props: Record<string, HTMLCanvasElement> = {};

  // Helper for drawing 16x16 pixel grids
  const draw16x16 = (renderFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement => {
    const [c, ctx] = createCanvas(16, 16);
    renderFn(ctx);
    return c;
  };

  // --- TILES ---
  // Floor: standard steel floor
  tiles['floor_steel'] = draw16x16((ctx) => {
    ctx.fillStyle = '#1e2430';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#2b3445';
    ctx.fillRect(1, 1, 14, 14);
    ctx.fillStyle = '#181d26';
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(15, 0, 1, 16);
    // Rivets in corners
    ctx.fillStyle = '#3f4d66';
    ctx.fillRect(2, 2, 1, 1);
    ctx.fillRect(13, 2, 1, 1);
    ctx.fillRect(2, 13, 1, 1);
    ctx.fillRect(13, 13, 1, 1);
  });

  // Floor: grated catwalk
  tiles['floor_grate'] = draw16x16((ctx) => {
    ctx.fillStyle = '#111620';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#323c4e';
    for (let x = 1; x < 15; x += 3) {
      ctx.fillRect(x, 0, 1, 16);
    }
    for (let y = 1; y < 15; y += 3) {
      ctx.fillRect(0, y, 16, 1);
    }
    // Deep pit underneath
    ctx.fillStyle = '#080b10';
    ctx.fillRect(2, 2, 2, 2);
    ctx.fillRect(8, 2, 2, 2);
    ctx.fillRect(2, 8, 2, 2);
    ctx.fillRect(8, 8, 2, 2);
  });

  // Floor: hazard warning stripes
  tiles['floor_hazard'] = draw16x16((ctx) => {
    ctx.fillStyle = '#26241a';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#d49b22';
    // Diagonal yellow stripes
    for (let i = -16; i < 32; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 4, 0);
      ctx.lineTo(i + 4 - 16, 16);
      ctx.lineTo(i - 16, 16);
      ctx.fill();
    }
    // Border
    ctx.fillStyle = '#16150f';
    ctx.strokeRect(0.5, 0.5, 15, 15);
  });

  // Wall: heavy bulkhead
  tiles['wall_bulkhead'] = draw16x16((ctx) => {
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(1, 1, 14, 10);
    // Lower shadow
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 11, 16, 5);
    // Conduits / rivets
    ctx.fillStyle = '#718096';
    ctx.fillRect(3, 4, 10, 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(4, 5, 2, 1); // Neon status pip
    ctx.fillRect(10, 5, 2, 1);
  });

  // Wall: market stall neon wall
  tiles['wall_market'] = draw16x16((ctx) => {
    ctx.fillStyle = '#1f1d2b';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#2f2b42';
    ctx.fillRect(1, 1, 14, 12);
    // Neon signage strip (cyan/magenta)
    ctx.fillStyle = '#e94560';
    ctx.fillRect(2, 3, 12, 2);
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(2, 8, 12, 4);
    ctx.fillStyle = '#ff2e93';
    ctx.fillRect(4, 9, 3, 2);
    ctx.fillStyle = '#00fff5';
    ctx.fillRect(9, 9, 3, 2);
    ctx.fillStyle = '#12111a';
    ctx.fillRect(0, 13, 16, 3);
  });

  // Wall: underdeck dark corroded pipe wall
  tiles['wall_underdeck'] = draw16x16((ctx) => {
    ctx.fillStyle = '#14171d';
    ctx.fillRect(0, 0, 16, 16);
    // Heavy rusted pipes running across
    ctx.fillStyle = '#5c4033';
    ctx.fillRect(0, 3, 16, 4);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(0, 4, 16, 2);
    ctx.fillStyle = '#3a271d';
    ctx.fillRect(4, 2, 2, 6);
    ctx.fillRect(11, 2, 2, 6);
    // Rust corrosion spots
    ctx.fillStyle = '#8a4b2d';
    ctx.fillRect(2, 9, 3, 2);
    ctx.fillRect(9, 10, 4, 2);
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(0, 12, 16, 4);
  });

  // Hazard steam vent
  tiles['hazard_steam'] = draw16x16((ctx) => {
    ctx.fillStyle = '#181822';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(2, 2, 12, 12);
    ctx.fillStyle = '#220000';
    ctx.fillRect(4, 4, 8, 8);
    // Steam puff
    ctx.fillStyle = 'rgba(255, 200, 200, 0.7)';
    ctx.fillRect(6, 6, 4, 4);
  });

  // --- INTERACTIVE PROPS ---
  // Terminal
  props['terminal'] = draw16x16((ctx) => {
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(2, 2, 12, 13);
    // Screen (luminescent cyan)
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(4, 4, 8, 6);
    ctx.fillStyle = '#005577';
    ctx.fillRect(5, 5, 6, 1);
    ctx.fillRect(5, 7, 4, 1);
    // Keyboard / pedestal
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(3, 11, 10, 4);
    ctx.fillStyle = '#a0aec0';
    ctx.fillRect(5, 12, 6, 1);
  });

  // Container / Crate
  props['crate'] = draw16x16((ctx) => {
    ctx.fillStyle = '#1b3a4b';
    ctx.fillRect(2, 2, 12, 12);
    ctx.fillStyle = '#277da1';
    ctx.fillRect(3, 3, 10, 10);
    // Corporate stencil cross
    ctx.fillStyle = '#4d908e';
    ctx.fillRect(4, 7, 8, 2);
    ctx.fillRect(7, 4, 2, 8);
    // Latches
    ctx.fillStyle = '#f9c74f';
    ctx.fillRect(7, 10, 2, 2);
  });

  // Air Recycler (Main central machine 32x32)
  const [recCanvas, recCtx] = createCanvas(32, 32);
  recCtx.fillStyle = '#1a202c';
  recCtx.fillRect(0, 0, 32, 32);
  recCtx.fillStyle = '#2d3748';
  recCtx.fillRect(2, 2, 28, 28);
  // Center turbine core
  recCtx.fillStyle = '#0f172a';
  recCtx.beginPath();
  recCtx.arc(16, 16, 10, 0, Math.PI * 2);
  recCtx.fill();
  // Glowing turbine blades
  recCtx.fillStyle = '#00f0ff';
  recCtx.fillRect(14, 8, 4, 16);
  recCtx.fillRect(8, 14, 16, 4);
  recCtx.fillStyle = '#e2e8f0';
  recCtx.beginPath();
  recCtx.arc(16, 16, 4, 0, Math.PI * 2);
  recCtx.fill();
  // Warning stripes on base
  recCtx.fillStyle = '#eab308';
  recCtx.fillRect(4, 26, 24, 4);
  recCtx.fillStyle = '#1e293b';
  for (let x = 4; x < 28; x += 6) {
    recCtx.fillRect(x, 26, 3, 4);
  }
  props['recycler'] = recCanvas;

  // Door
  props['door_vertical'] = draw16x16((ctx) => {
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(2, 1, 12, 14);
    // Hazard neon center
    ctx.fillStyle = '#10b981';
    ctx.fillRect(7, 4, 2, 8);
  });

  // --- CHARACTERS ---
  // Helper to draw humanoid sprites (16x18)
  const drawHumanoid = (
    skinColor: string,
    suitColor: string,
    accentColor: string,
    headExtra?: (ctx: CanvasRenderingContext2D) => void
  ): HTMLCanvasElement => {
    const [c, ctx] = createCanvas(16, 18);
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(8, 16, 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#111827';
    ctx.fillRect(5, 11, 2, 5);
    ctx.fillRect(9, 11, 2, 5);

    // Torso / Suit
    ctx.fillStyle = suitColor;
    ctx.fillRect(4, 6, 8, 6);

    // Belt / Accent
    ctx.fillStyle = accentColor;
    ctx.fillRect(4, 10, 8, 1);

    // Head / Helmet
    ctx.fillStyle = skinColor;
    ctx.fillRect(5, 1, 6, 5);

    if (headExtra) {
      headExtra(ctx);
    }

    return c;
  };

  // Player: Scavenger suit with glowing visor
  characters['player'] = drawHumanoid('#475569', '#334155', '#38bdf8', (ctx) => {
    // Visor
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(6, 3, 4, 2);
  });

  // Player walk frames
  characters['player_walk'] = drawHumanoid('#475569', '#334155', '#38bdf8', (ctx) => {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(6, 3, 4, 2);
    // Stride legs
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, 11, 2, 5);
    ctx.fillRect(10, 11, 2, 5);
  });

  // Clerk Korniyenko: Corporate grey suit, neat hair, golden earpiece
  characters['clerk'] = drawHumanoid('#e2e8f0', '#1e293b', '#fbbf24', (ctx) => {
    // Golden monocle / AR lens
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(8, 3, 2, 2);
    // Corporate necktie
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(7, 6, 2, 4);
  });

  // Foreman Taras: Heavy work rig, orange vest, yellow hardhat
  characters['foreman'] = drawHumanoid('#d97706', '#ea580c', '#facc15', (ctx) => {
    // Hardhat
    ctx.fillStyle = '#facc15';
    ctx.fillRect(4, 0, 8, 3);
    // Visor
    ctx.fillStyle = '#000000';
    ctx.fillRect(6, 3, 4, 1);
  });

  // Zoryana: Smuggler with tech cloak and cyan cyber-eye
  characters['smuggler'] = drawHumanoid('#6b21a8', '#3b0764', '#06b6d4', (ctx) => {
    // Cloak hood
    ctx.fillStyle = '#581c87';
    ctx.fillRect(4, 1, 8, 3);
    // Cyber eye
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(6, 3, 2, 2);
  });

  // Nestor: Worn overalls, head lamp
  characters['technician'] = drawHumanoid('#78350f', '#451a03', '#ef4444', (ctx) => {
    // Headlamp
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 1, 2, 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(5, 7, 6, 2);
  });

  // Station Core Terminal Avatar
  characters['core_ai'] = drawHumanoid('#0f172a', '#0284c7', '#38bdf8', (ctx) => {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(6, 2, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 3, 2, 2);
  });

  // --- ENEMIES ---
  // Drone: Flying scrapper
  enemies['drone'] = draw16x16((ctx) => {
    // Rotors
    ctx.fillStyle = '#64748b';
    ctx.fillRect(1, 4, 5, 1);
    ctx.fillRect(10, 4, 5, 1);
    // Body
    ctx.fillStyle = '#334155';
    ctx.fillRect(4, 5, 8, 7);
    // Red glowing sensor eye
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(6, 7, 4, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7, 8, 2, 1);
    // Spark claw
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(5, 12, 2, 3);
    ctx.fillRect(9, 12, 2, 3);
  });

  // Sentry Bot: Security turret
  enemies['sentry'] = draw16x16((ctx) => {
    // Tripod base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, 12, 10, 4);
    // Torso armor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(4, 5, 8, 7);
    // Plasma cannon barrel
    ctx.fillStyle = '#475569';
    ctx.fillRect(11, 7, 5, 2);
    // Blue targeting scanner
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(5, 6, 6, 2);
  });

  // Hazard Spider
  enemies['hazard_spider'] = draw16x16((ctx) => {
    // Legs
    ctx.fillStyle = '#451a03';
    ctx.fillRect(1, 2, 2, 4);
    ctx.fillRect(13, 2, 2, 4);
    ctx.fillRect(1, 10, 2, 4);
    ctx.fillRect(13, 10, 2, 4);
    // Carapace
    ctx.fillStyle = '#78350f';
    ctx.fillRect(4, 4, 8, 8);
    // Welder torch
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(7, 1, 2, 3);
    // Eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(5, 5, 2, 2);
    ctx.fillRect(9, 5, 2, 2);
  });

  // --- EFFECTS ---
  // Attack Swing Slice
  const [slashC, slashCtx] = createCanvas(24, 24);
  slashCtx.strokeStyle = '#38bdf8';
  slashCtx.lineWidth = 3;
  slashCtx.beginPath();
  slashCtx.arc(12, 12, 10, -Math.PI / 4, Math.PI / 2);
  slashCtx.stroke();
  slashCtx.strokeStyle = '#ffffff';
  slashCtx.lineWidth = 1;
  slashCtx.stroke();
  effects['slash'] = slashC;

  return { tiles, characters, enemies, effects, props };
}

let cachedAtlas: SpriteAtlas | null = null;

export function getSpriteAtlas(): SpriteAtlas {
  if (!cachedAtlas && typeof document !== 'undefined') {
    cachedAtlas = generateSpriteAtlas();
  }
  return cachedAtlas!;
}
