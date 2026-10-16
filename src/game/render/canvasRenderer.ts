/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Low-Resolution Canvas 2D Rendering Engine
// Native 384x216 pixel viewport, depth-sorted entities, camera lerp with shake, zero-allocation loops.

import {
  GameWorldState,
  MapData,
  Enemy,
  NPC,
  Particle,
  FloatingText,
} from '../types';
import { getSpriteAtlas, SpriteAtlas } from '../world/sprites';
import { PlasmaProjectile } from '../entities/enemy';

export const VIEWPORT_WIDTH = 384;
export const VIEWPORT_HEIGHT = 216;

export interface Camera {
  x: number;
  y: number;
  shakeTime: number;
  shakeIntensity: number;
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private atlas: SpriteAtlas;
  public camera: Camera = { x: 0, y: 0, shakeTime: 0, shakeIntensity: 0 };

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this.atlas = getSpriteAtlas();
  }

  public setShake(intensity: number, duration: number) {
    this.camera.shakeIntensity = intensity;
    this.camera.shakeTime = duration;
  }

  public updateCamera(targetX: number, targetY: number, map: MapData, dt: number) {
    // Lerp camera towards player center
    const desiredX = targetX - VIEWPORT_WIDTH / 2;
    const desiredY = targetY - VIEWPORT_HEIGHT / 2;

    const mapPixelW = map.width * map.tileSize;
    const mapPixelH = map.height * map.tileSize;

    const minX = 0;
    const maxX = Math.max(0, mapPixelW - VIEWPORT_WIDTH);
    const minY = 0;
    const maxY = Math.max(0, mapPixelH - VIEWPORT_HEIGHT);

    const clampedX = Math.max(minX, Math.min(maxX, desiredX));
    const clampedY = Math.max(minY, Math.min(maxY, desiredY));

    this.camera.x += (clampedX - this.camera.x) * 0.15;
    this.camera.y += (clampedY - this.camera.y) * 0.15;

    if (this.camera.shakeTime > 0) {
      this.camera.shakeTime -= dt;
    }
  }

  public render(
    state: GameWorldState,
    map: MapData,
    projectiles: PlasmaProjectile[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    walkAnimTimer: number
  ) {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    // Apply camera shake if active
    let camOffsetX = Math.round(this.camera.x);
    let camOffsetY = Math.round(this.camera.y);

    if (this.camera.shakeTime > 0) {
      const shakeAmt = this.camera.shakeIntensity * (this.camera.shakeTime / 0.3);
      camOffsetX += Math.round((Math.random() - 0.5) * shakeAmt * 2);
      camOffsetY += Math.round((Math.random() - 0.5) * shakeAmt * 2);
    }

    // Clear background
    ctx.fillStyle = '#080b12';
    ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

    // Visible tile boundaries
    const startTileX = Math.max(0, Math.floor(camOffsetX / map.tileSize));
    const endTileX = Math.min(map.width - 1, Math.ceil((camOffsetX + VIEWPORT_WIDTH) / map.tileSize));
    const startTileY = Math.max(0, Math.floor(camOffsetY / map.tileSize));
    const endTileY = Math.min(map.height - 1, Math.ceil((camOffsetY + VIEWPORT_HEIGHT) / map.tileSize));

    // 1. Draw floor tiles
    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const screenX = tx * map.tileSize - camOffsetX;
        const screenY = ty * map.tileSize - camOffsetY;
        const colVal = map.collision[ty]?.[tx];

        let floorImg = this.atlas.tiles['floor_steel'];
        if (map.id === 'industrial_market') {
          floorImg = this.atlas.tiles['floor_grate'];
        } else if (map.id === 'underdeck_sublevel') {
          floorImg = (tx + ty) % 2 === 0 ? this.atlas.tiles['floor_steel'] : this.atlas.tiles['floor_hazard'];
        }

        if (floorImg) {
          ctx.drawImage(floorImg, screenX, screenY);
        }

        // Draw hazard steam overlay
        if (colVal === 2) {
          const steamImg = this.atlas.tiles['hazard_steam'];
          if (steamImg) ctx.drawImage(steamImg, screenX, screenY);
        }
      }
    }

    // 2. Draw wall tiles & static obstacles
    for (let ty = startTileY; ty <= endTileY; ty++) {
      for (let tx = startTileX; tx <= endTileX; tx++) {
        const colVal = map.collision[ty]?.[tx];
        if (colVal === 1) {
          const screenX = tx * map.tileSize - camOffsetX;
          const screenY = ty * map.tileSize - camOffsetY;

          let wallImg = this.atlas.tiles['wall_bulkhead'];
          if (map.id === 'industrial_market') {
            wallImg = this.atlas.tiles['wall_market'];
          } else if (map.id === 'underdeck_sublevel') {
            wallImg = this.atlas.tiles['wall_underdeck'];
          }

          if (wallImg) {
            ctx.drawImage(wallImg, screenX, screenY);
          }
        }
      }
    }

    // 3. Draw static props (doors, terminals, containers, recycler)
    // Recycler in underdeck
    if (map.id === 'underdeck_sublevel') {
      const recX = 13 * 16 - camOffsetX;
      const recY = 10 * 16 - camOffsetY;
      const recImg = this.atlas.props['recycler'];
      if (recImg) {
        ctx.drawImage(recImg, recX, recY);
      }
    }

    // Terminals
    for (const term of map.terminals) {
      const scrX = term.x - camOffsetX;
      const scrY = term.y - camOffsetY;
      if (scrX > -20 && scrX < VIEWPORT_WIDTH + 20 && scrY > -20 && scrY < VIEWPORT_HEIGHT + 20) {
        const termImg = this.atlas.props['terminal'];
        if (termImg) ctx.drawImage(termImg, scrX, scrY);
        // Prompt indicator
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(scrX + 6, scrY - 4, 4, 2);
      }
    }

    // Containers
    for (const cont of map.containers) {
      const scrX = cont.x - camOffsetX;
      const scrY = cont.y - camOffsetY;
      if (scrX > -20 && scrX < VIEWPORT_WIDTH + 20 && scrY > -20 && scrY < VIEWPORT_HEIGHT + 20) {
        const crateImg = this.atlas.props['crate'];
        if (crateImg) {
          ctx.drawImage(crateImg, scrX, scrY);
          if (cont.opened) {
            ctx.fillStyle = 'rgba(0, 255, 100, 0.4)';
            ctx.fillRect(scrX + 3, scrY + 3, 10, 10);
          }
        }
      }
    }

    // Doors
    for (const door of map.doors) {
      const scrX = door.x - camOffsetX;
      const scrY = door.y - camOffsetY;
      if (scrX > -20 && scrX < VIEWPORT_WIDTH + 20 && scrY > -20 && scrY < VIEWPORT_HEIGHT + 20) {
        const doorImg = this.atlas.props['door_vertical'];
        if (doorImg) ctx.drawImage(doorImg, scrX, scrY);
      }
    }

    // 4. Collect depth-sorted renderables (Player, NPCs, Enemies)
    interface Renderable {
      y: number;
      draw: () => void;
    }
    const renderList: Renderable[] = [];

    // Player
    const player = state.player;
    renderList.push({
      y: player.y + 16,
      draw: () => {
        const px = Math.round(player.x - camOffsetX);
        const py = Math.round(player.y - camOffsetY);

        // Flash white when invulnerable
        if (player.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
          ctx.globalAlpha = 0.5;
        }

        const isWalkFrame = player.moving && Math.floor(walkAnimTimer * 8) % 2 === 1;
        const playerSprite = isWalkFrame
          ? this.atlas.characters['player_walk']
          : this.atlas.characters['player'];

        if (playerSprite) {
          // Flip sprite if facing left
          if (player.dir === 'left') {
            ctx.save();
            ctx.translate(px + 16, py);
            ctx.scale(-1, 1);
            ctx.drawImage(playerSprite, 0, 0);
            ctx.restore();
          } else {
            ctx.drawImage(playerSprite, px, py);
          }
        }

        // Draw attack swing arc
        if (player.isAttacking) {
          const slash = this.atlas.effects['slash'];
          if (slash) {
            ctx.save();
            let sx = px;
            let sy = py;
            if (player.dir === 'right') sx += 12;
            if (player.dir === 'left') sx -= 16;
            if (player.dir === 'up') sy -= 16;
            if (player.dir === 'down') sy += 12;
            ctx.drawImage(slash, sx, sy);
            ctx.restore();
          }
        }

        ctx.globalAlpha = 1.0;
      },
    });

    // NPCs on current map
    for (const npc of Object.values(state.npcs)) {
      if (npc.mapId !== map.id) continue;
      const scrX = Math.round(npc.x - camOffsetX);
      const scrY = Math.round(npc.y - camOffsetY);

      // Viewport culling
      if (scrX < -30 || scrX > VIEWPORT_WIDTH + 30 || scrY < -30 || scrY > VIEWPORT_HEIGHT + 30) {
        continue;
      }

      renderList.push({
        y: npc.y + 16,
        draw: () => {
          const sprite = this.atlas.characters[npc.portrait] || this.atlas.characters['player'];
          if (sprite) {
            if (npc.dir === 'left') {
              ctx.save();
              ctx.translate(scrX + 16, scrY);
              ctx.scale(-1, 1);
              ctx.drawImage(sprite, 0, 0);
              ctx.restore();
            } else {
              ctx.drawImage(sprite, scrX, scrY);
            }
          }
          // Name tag & talk icon
          ctx.font = '7px monospace';
          ctx.fillStyle = '#00f0ff';
          ctx.textAlign = 'center';
          ctx.fillText(npc.name, scrX + 8, scrY - 2);
        },
      });
    }

    // Enemies on current map
    for (const enemy of state.enemies) {
      if (enemy.mapId !== map.id) continue;
      const scrX = Math.round(enemy.x - camOffsetX);
      const scrY = Math.round(enemy.y - camOffsetY);

      if (scrX < -30 || scrX > VIEWPORT_WIDTH + 30 || scrY < -30 || scrY > VIEWPORT_HEIGHT + 30) {
        continue;
      }

      renderList.push({
        y: enemy.y + enemy.h,
        draw: () => {
          // Death dissolve
          if (enemy.state === 'dead') {
            ctx.globalAlpha = Math.max(0, enemy.stateTimer / 0.45);
          }

          // Hit flash
          if (enemy.hitFlashTime > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(scrX, scrY, enemy.w, enemy.h);
          } else {
            const enemySprite = this.atlas.enemies[enemy.type];
            if (enemySprite) {
              ctx.drawImage(enemySprite, scrX, scrY);
            }
          }

          // Attack telegraphs
          if (enemy.state === 'windup') {
            if (enemy.type === 'drone') {
              // Pulsing red danger circle
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(scrX + enemy.w / 2, scrY + enemy.h / 2, 16, 0, Math.PI * 2);
              ctx.stroke();
            } else if (enemy.type === 'sentry') {
              // Red targeting laser line to target
              if (enemy.targetX !== undefined && enemy.targetY !== undefined) {
                const targetScrX = enemy.targetX - camOffsetX;
                const targetScrY = enemy.targetY - camOffsetY;
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 2]);
                ctx.beginPath();
                ctx.moveTo(scrX + enemy.w / 2, scrY + enemy.h / 2);
                ctx.lineTo(targetScrX, targetScrY);
                ctx.stroke();
                ctx.setLineDash([]);
              }
            } else if (enemy.type === 'hazard_spider') {
              // Yellow warning flash
              ctx.strokeStyle = '#f59e0b';
              ctx.strokeRect(scrX - 2, scrY - 2, enemy.w + 4, enemy.h + 4);
            }
          }

          // Enemy health bar
          if (enemy.hp < enemy.maxHp && enemy.state !== 'dead') {
            const barW = 14;
            const barH = 2;
            const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(scrX + (enemy.w - barW) / 2, scrY - 5, barW, barH);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(scrX + (enemy.w - barW) / 2, scrY - 5, barW * hpRatio, barH);
          }

          ctx.globalAlpha = 1.0;
        },
      });
    }

    // Sort by y position and draw
    renderList.sort((a, b) => a.y - b.y);
    for (let i = 0; i < renderList.length; i++) {
      renderList[i].draw();
    }

    // 5. Draw Projectiles
    for (const p of projectiles) {
      const px = Math.round(p.x - camOffsetX);
      const py = Math.round(p.y - camOffsetY);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Draw Particles
    for (let pIdx = 0; pIdx < particles.length; pIdx++) {
      const pt = particles[pIdx];
      const px = Math.round(pt.x - camOffsetX);
      const py = Math.round(pt.y - camOffsetY);
      const alpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(px, py, pt.size, pt.size);
    }
    ctx.globalAlpha = 1.0;

    // 7. Floating Texts (damage numbers, item notifications)
    for (let fIdx = 0; fIdx < floatingTexts.length; fIdx++) {
      const ft = floatingTexts[fIdx];
      const fx = Math.round(ft.x - camOffsetX);
      const fy = Math.round(ft.y - camOffsetY);
      ctx.font = '8px monospace';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, fx, fy);
    }

    // 8. Atmospheric ambient vignette
    if (map.isHazardAtmosphere) {
      // Subdeck hazard red-tinted vignette
      ctx.fillStyle = 'rgba(255, 50, 20, 0.06)';
      ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    }
  }
}
