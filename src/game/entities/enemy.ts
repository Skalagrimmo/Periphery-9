/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Enemy, GameWorldState, MapData } from '../types';
import { distance, distanceSq, clamp } from '../engine/math';
import { checkTileCollision } from '../engine/rules';
import { audio } from '../engine/audio';

export interface PlasmaProjectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  maxLife: number;
  mapId: string;
}

export function createInitialEnemies(): Enemy[] {
  return [
    // Scrap Drone 1 in underdeck corridor
    {
      id: 'drone_corridor_1',
      type: 'drone',
      name: 'Дрон-утилізатор #1',
      x: 10 * 16,
      y: 4 * 16,
      vx: 0,
      vy: 0,
      w: 14,
      h: 14,
      hp: 45,
      maxHp: 45,
      speed: 42,
      dir: 'down',
      state: 'patrol',
      stateTimer: 2.0,
      telegraphTimer: 0,
      attackCooldown: 1.2,
      patrolPoints: [
        { x: 8 * 16, y: 4 * 16 },
        { x: 18 * 16, y: 4 * 16 },
      ],
      currentPatrolIdx: 0,
      hitFlashTime: 0,
      knockbackVx: 0,
      knockbackVy: 0,
      mapId: 'underdeck_sublevel',
    },
    // Scrap Drone 2 near bottom vents
    {
      id: 'drone_corridor_2',
      type: 'drone',
      name: 'Дрон-утилізатор #2',
      x: 8 * 16,
      y: 19 * 16,
      vx: 0,
      vy: 0,
      w: 14,
      h: 14,
      hp: 45,
      maxHp: 45,
      speed: 42,
      dir: 'right',
      state: 'patrol',
      stateTimer: 2.5,
      telegraphTimer: 0,
      attackCooldown: 1.5,
      patrolPoints: [
        { x: 8 * 16, y: 19 * 16 },
        { x: 16 * 16, y: 19 * 16 },
      ],
      currentPatrolIdx: 0,
      hitFlashTime: 0,
      knockbackVx: 0,
      knockbackVy: 0,
      mapId: 'underdeck_sublevel',
    },
    // Sentry Bot guarding the corporate server room
    {
      id: 'sentry_server_guard',
      type: 'sentry',
      name: 'Охоронний автоматонець',
      x: 23 * 16,
      y: 8 * 16,
      vx: 0,
      vy: 0,
      w: 16,
      h: 16,
      hp: 75,
      maxHp: 75,
      speed: 18,
      dir: 'left',
      state: 'idle',
      stateTimer: 1.0,
      telegraphTimer: 0,
      attackCooldown: 2.2,
      hitFlashTime: 0,
      knockbackVx: 0,
      knockbackVy: 0,
      mapId: 'underdeck_sublevel',
    },
    // Hazard Spider in the lower machinery hall
    {
      id: 'spider_machinery',
      type: 'hazard_spider',
      name: 'Технічний павук-зварювальник',
      x: 18 * 16,
      y: 17 * 16,
      vx: 0,
      vy: 0,
      w: 16,
      h: 16,
      hp: 65,
      maxHp: 65,
      speed: 55,
      dir: 'left',
      state: 'patrol',
      stateTimer: 3.0,
      telegraphTimer: 0,
      attackCooldown: 2.0,
      patrolPoints: [
        { x: 18 * 16, y: 17 * 16 },
        { x: 25 * 16, y: 17 * 16 },
      ],
      currentPatrolIdx: 0,
      hitFlashTime: 0,
      knockbackVx: 0,
      knockbackVy: 0,
      mapId: 'underdeck_sublevel',
    },
  ];
}

export function updateEnemies(
  enemies: Enemy[],
  projectiles: PlasmaProjectile[],
  state: GameWorldState,
  currentMap: MapData,
  dt: number
): void {
  const player = state.player;

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.mapId !== currentMap.id) continue;

    // Decay knockback
    if (Math.abs(e.knockbackVx) > 1 || Math.abs(e.knockbackVy) > 1) {
      e.x += e.knockbackVx * dt;
      e.y += e.knockbackVy * dt;
      e.knockbackVx *= 0.82;
      e.knockbackVy *= 0.82;
    }

    if (e.hitFlashTime > 0) {
      e.hitFlashTime -= dt;
    }

    if (e.attackCooldown > 0) {
      e.attackCooldown -= dt;
    }

    // Dead entity dissolve timer
    if (e.state === 'dead') {
      e.stateTimer -= dt;
      continue;
    }

    if (e.hp <= 0 && e.state !== 'dead') {
      e.state = 'dead';
      e.stateTimer = 0.45; // 0.45s death dissolve
      audio.playHit();
      // Drop scrap
      state.player.credits += 15;
      continue;
    }

    const distToPlayer = distance(e.x + e.w / 2, e.y + e.h / 2, player.x + 8, player.y + 8);

    // ==========================================
    // POLICY 1: SCRAP DRONE (Fast Swarmer)
    // ==========================================
    if (e.type === 'drone') {
      const aggroRange = 100;
      if (distToPlayer < aggroRange) {
        // Face player
        const dx = player.x + 8 - (e.x + e.w / 2);
        const dy = player.y + 8 - (e.y + e.h / 2);

        if (distToPlayer > 20 && e.state !== 'windup') {
          // Chase
          e.state = 'chase';
          const nx = dx / (distToPlayer || 1);
          const ny = dy / (distToPlayer || 1);
          const nextBox = {
            x: e.x + nx * e.speed * dt,
            y: e.y + ny * e.speed * dt,
            w: e.w,
            h: e.h,
          };
          if (!checkTileCollision(nextBox, currentMap)) {
            e.x = nextBox.x;
            e.y = nextBox.y;
          }
        } else if (distToPlayer <= 22 && e.attackCooldown <= 0 && e.state !== 'windup') {
          // Enter attack windup telegraph
          e.state = 'windup';
          e.telegraphTimer = 0.35; // 350ms red alert pulse
        }

        if (e.state === 'windup') {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            // Execute attack!
            e.state = 'idle';
            e.attackCooldown = 1.4;
            if (distToPlayer <= 26 && player.invulnerableTime <= 0) {
              player.hp = Math.max(0, player.hp - 15);
              player.invulnerableTime = 0.6;
              audio.playDamage();
            }
          }
        }
      } else {
        // Patrol points
        e.state = 'patrol';
        if (e.patrolPoints && e.patrolPoints.length > 0) {
          const pt = e.patrolPoints[e.currentPatrolIdx ?? 0];
          const pd = distance(e.x, e.y, pt.x, pt.y);
          if (pd < 4) {
            e.currentPatrolIdx = ((e.currentPatrolIdx ?? 0) + 1) % e.patrolPoints.length;
          } else {
            const pdx = (pt.x - e.x) / pd;
            const pdy = (pt.y - e.y) / pd;
            e.x += pdx * (e.speed * 0.6) * dt;
            e.y += pdy * (e.speed * 0.6) * dt;
          }
        }
      }
    }

    // ==========================================
    // POLICY 2: SENTRY BOT (Ranged Laser Telegraph Turret)
    // ==========================================
    if (e.type === 'sentry') {
      const sentryRange = 140;
      if (distToPlayer < sentryRange) {
        // Aim at player
        e.targetX = player.x + 8;
        e.targetY = player.y + 8;

        if (e.attackCooldown <= 0 && e.state !== 'windup') {
          e.state = 'windup';
          e.telegraphTimer = 0.6; // 600ms visible laser line telegraph
        }

        if (e.state === 'windup') {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            // Fire plasma projectile!
            e.state = 'idle';
            e.attackCooldown = 2.4;
            const dx = (e.targetX ?? player.x) - (e.x + e.w / 2);
            const dy = (e.targetY ?? player.y) - (e.y + e.h / 2);
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const projSpeed = 120;

            projectiles.push({
              id: 'proj_' + Math.random().toString(36).slice(2, 7),
              x: e.x + e.w / 2,
              y: e.y + e.h / 2,
              vx: (dx / len) * projSpeed,
              vy: (dy / len) * projSpeed,
              damage: 20,
              life: 1.8,
              maxLife: 1.8,
              mapId: e.mapId,
            });
            audio.playAttack();
          }
        }
      } else {
        e.state = 'idle';
      }
    }

    // ==========================================
    // POLICY 3: HAZARD SPIDER (Line-of-Sight Charger)
    // ==========================================
    if (e.type === 'hazard_spider') {
      const chargeRange = 90;
      if (distToPlayer < chargeRange && e.state !== 'attack' && e.state !== 'windup') {
        if (e.attackCooldown <= 0) {
          e.state = 'windup';
          e.telegraphTimer = 0.5; // Crouch & sparks
          e.targetX = player.x;
          e.targetY = player.y;
        }
      }

      if (e.state === 'windup') {
        e.telegraphTimer -= dt;
        if (e.telegraphTimer <= 0) {
          e.state = 'attack';
          e.stateTimer = 0.4; // 0.4s charge dash
          const dx = (e.targetX ?? player.x) - e.x;
          const dy = (e.targetY ?? player.y) - e.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          e.vx = (dx / len) * 110;
          e.vy = (dy / len) * 110;
        }
      } else if (e.state === 'attack') {
        e.stateTimer -= dt;
        const nextBox = { x: e.x + e.vx * dt, y: e.y + e.vy * dt, w: e.w, h: e.h };
        if (!checkTileCollision(nextBox, currentMap)) {
          e.x = nextBox.x;
          e.y = nextBox.y;
        }
        if (distToPlayer < 18 && player.invulnerableTime <= 0) {
          player.hp = Math.max(0, player.hp - 22);
          player.invulnerableTime = 0.6;
          audio.playDamage();
        }
        if (e.stateTimer <= 0) {
          e.state = 'idle';
          e.attackCooldown = 2.0;
          e.vx = 0;
          e.vy = 0;
        }
      }
    }
  }

  // Update projectiles
  for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
    const p = projectiles[pIdx];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Check hit player
    const distToPl = distance(p.x, p.y, player.x + 8, player.y + 8);
    if (distToPl < 12 && player.invulnerableTime <= 0) {
      player.hp = Math.max(0, player.hp - p.damage);
      player.invulnerableTime = 0.6;
      audio.playDamage();
      projectiles.splice(pIdx, 1);
      continue;
    }

    // Check wall collision
    const tileX = Math.floor(p.x / currentMap.tileSize);
    const tileY = Math.floor(p.y / currentMap.tileSize);
    if (
      p.life <= 0 ||
      tileX < 0 ||
      tileX >= currentMap.width ||
      tileY < 0 ||
      tileY >= currentMap.height ||
      currentMap.collision[tileY]?.[tileX] === 1
    ) {
      projectiles.splice(pIdx, 1);
    }
  }
}
