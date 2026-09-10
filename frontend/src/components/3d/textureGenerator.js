import * as THREE from 'three';

/**
 * Procedural PBR Architectural Textures for Three.js
 * Generates natural canvas-based textures with zero external asset loading lag.
 */

// 1. Natural Warm Oak Hardwood Parquet Plank Texture
export function createOakWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base wood color
  ctx.fillStyle = '#c89d7c';
  ctx.fillRect(0, 0, 512, 512);

  // Planks
  const plankHeight = 32;
  const plankWidth = 128;

  for (let y = 0; y < 512; y += plankHeight) {
    const rowOffset = (Math.floor(y / plankHeight) % 2) * 64;
    for (let x = -64; x < 512; x += plankWidth) {
      const px = x + rowOffset;
      // Slight tone variation per plank
      const toneVariance = (Math.random() - 0.5) * 20;
      ctx.fillStyle = `rgb(${195 + toneVariance}, ${145 + toneVariance}, ${105 + toneVariance})`;
      ctx.fillRect(px + 1, y + 1, plankWidth - 2, plankHeight - 2);

      // Fine wood grain lines inside plank
      ctx.fillStyle = 'rgba(120, 80, 50, 0.12)';
      for (let g = 0; g < 6; g++) {
        const gy = y + Math.random() * plankHeight;
        ctx.fillRect(px + 1, gy, plankWidth - 2, 1 + Math.random());
      }

      // Plank bevel edge / shadow
      ctx.strokeStyle = '#8c5e3c';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, y + 0.5, plankWidth - 1, plankHeight - 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

// 2. Travertine / Italian Marble Ceramic Tiles
export function createCeramicTileTexture(baseColor = '#f3ede2', groutColor = '#b8af9f', tileSize = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Grout background
  ctx.fillStyle = groutColor;
  ctx.fillRect(0, 0, 512, 512);

  // Tiles
  for (let y = 0; y < 512; y += tileSize) {
    for (let x = 0; x < 512; x += tileSize) {
      ctx.fillStyle = baseColor;
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

      // Marble vein / subtle specular noise
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x + 4, y + 4, tileSize - 8, 4);

      // Subtle diagonal vein
      ctx.strokeStyle = 'rgba(160, 150, 140, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 8);
      ctx.bezierCurveTo(x + tileSize * 0.3, y + tileSize * 0.6, x + tileSize * 0.7, y + tileSize * 0.4, x + tileSize - 8, y + tileSize - 8);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 3. Bathroom Non-Slip Mosaic Floor Tile Texture
export function createMosaicTileTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#64748b'; // Dark grout
  ctx.fillRect(0, 0, 256, 256);

  const tileSize = 32;
  const colors = ['#e2e8f0', '#cbd5e1', '#94a3b8', '#dbeafe', '#cbd5e1'];

  for (let y = 0; y < 256; y += tileSize) {
    for (let x = 0; x < 256; x += tileSize) {
      const c = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillStyle = c;
      ctx.fillRect(x + 1.5, y + 1.5, tileSize - 3, tileSize - 3);

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x + 3, y + 3, tileSize - 6, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 4. Clean Architectural Stucco / Plaster Wall Texture
export function createStuccoWallTexture(colorHex = '#f1eee9') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle plaster grain noise
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const alpha = Math.random() * 0.08;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha * 0.6})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

// 5. Polished Concrete Plinth / Slab Texture
export function createConcreteTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 256, 256);

  // Aggregate specks
  for (let i = 0; i < 2500; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(51, 65, 85, 0.15)';
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

// 6. Natural Green Grass Lawn Texture for Landscape Site Base
export function createGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Rich green base
  ctx.fillStyle = '#4d7c38';
  ctx.fillRect(0, 0, 512, 512);

  // Grass blades / texture spots
  const greens = ['#5a8e42', '#3f672d', '#689d4d', '#365825', '#76a858'];
  for (let i = 0; i < 20000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = greens[Math.floor(Math.random() * greens.length)];
    ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

// 7. Natural Teak / Walnut Door Woodgrain Texture
export function createTeakWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#5c3317';
  ctx.fillRect(0, 0, 256, 512);

  // Vertical wood grains
  for (let x = 0; x < 256; x += 4) {
    const tone = (Math.random() - 0.5) * 30;
    ctx.fillStyle = `rgb(${90 + tone}, ${50 + tone * 0.7}, ${25 + tone * 0.4})`;
    ctx.fillRect(x, 0, 3, 512);
  }

  // Wood panel bevel frame
  ctx.strokeStyle = '#3d1e0a';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 236, 492);
  ctx.strokeRect(20, 20, 216, 220);
  ctx.strokeRect(20, 260, 216, 230);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 8. Terracotta / AAC Brick Masonry Texture for Structural Mode
export function createBrickWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Mortar joints
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, 512, 512);

  const brickH = 24;
  const brickW = 64;

  for (let y = 0; y < 512; y += brickH) {
    const offset = (Math.floor(y / brickH) % 2) * (brickW / 2);
    for (let x = -brickW; x < 512 + brickW; x += brickW) {
      const bx = x + offset;
      // Terracotta brick variation
      const r = 180 + Math.floor(Math.random() * 30);
      const g = 75 + Math.floor(Math.random() * 20);
      const b = 55 + Math.floor(Math.random() * 15);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(bx + 2, y + 2, brickW - 4, brickH - 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}
