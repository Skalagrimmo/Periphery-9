/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkTileCollision,
  addItemToInventory,
  removeItemFromInventory,
  useInventoryItem,
  calculateVendorPrice,
  applyQuestEndingOutcome,
  calculatePlayerAttackHit,
} from './rules.ts';
import { ITEMS } from '../items.ts';
import { GameWorldState, MapData, Enemy } from '../types.ts';

function createMockMap(): MapData {
  return {
    id: 'test_map',
    name: 'Тестова палуба',
    width: 5,
    height: 5,
    tileSize: 16,
    collision: [
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1], // (2, 2) is a solid wall
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ],
    floorTiles: [],
    wallTiles: [],
    doors: [],
    terminals: [],
    containers: [],
    spawnX: 1,
    spawnY: 1,
    ambientLight: '#111',
  };
}

function createInitialState(): GameWorldState {
  return {
    player: {
      x: 20,
      y: 20,
      vx: 0,
      vy: 0,
      dir: 'right',
      moving: false,
      hp: 60,
      maxHp: 100,
      oxygen: 40,
      maxOxygen: 100,
      credits: 100,
      debt: 250,
      isAttacking: false,
      attackCooldown: 0,
      attackDuration: 0,
      invulnerableTime: 0,
      currentMapId: 'customs_dock',
    },
    inventory: [],
    maxInventorySlots: 6,
    currentMapId: 'customs_dock',
    quests: {
      stage: 'talk_to_clerk',
      objectives: {},
      ending: null,
      evidenceDecrypted: false,
      recyclerRepaired: false,
      valveOverridden: false,
      foundSecretStash: false,
    },
    reputation: {
      corp: 0,
      syndicate: 0,
      smugglers: 0,
    },
    npcs: {},
    enemies: [],
    containers: {},
    terminals: {},
    flags: {},
    gameTime: 0,
  };
}

test('1. Collision test: Impassable tile blocks movement, open tile passes', () => {
  const map = createMockMap();

  // (x: 20, y: 20) -> tile (1, 1) is open (0)
  const openBox = { x: 20, y: 20, w: 10, h: 10 };
  assert.equal(checkTileCollision(openBox, map), false, 'Open tile should not collide');

  // (x: 32, y: 32) -> tile (2, 2) is a wall (1)
  const wallBox = { x: 32, y: 32, w: 10, h: 10 };
  assert.equal(checkTileCollision(wallBox, map), true, 'Solid wall tile must collide');

  // Out of bounds
  const oobBox = { x: -5, y: 20, w: 10, h: 10 };
  assert.equal(checkTileCollision(oobBox, map), true, 'Out of bounds must collide');
});

test('2. Inventory test: Adding, stacking, capacity limits, and using items', () => {
  const inventory: any[] = [];
  const state = createInitialState();
  state.inventory = inventory;

  // Add medkit (stackable)
  const ok1 = addItemToInventory(inventory, ITEMS.medkit_stim, 2, 3);
  assert.equal(ok1, true);
  assert.equal(inventory.length, 1);
  assert.equal(inventory[0].quantity, 2);

  // Stack more
  const ok2 = addItemToInventory(inventory, ITEMS.medkit_stim, 3, 3);
  assert.equal(ok2, true);
  assert.equal(inventory.length, 1);
  assert.equal(inventory[0].quantity, 5);

  // Add non-stackable quest item
  const ok3 = addItemToInventory(inventory, ITEMS.scrubber_filter, 1, 3);
  assert.equal(ok3, true);
  assert.equal(inventory.length, 2);

  // Fill capacity
  const ok4 = addItemToInventory(inventory, ITEMS.cryo_coolant, 1, 3);
  assert.equal(ok4, true);
  assert.equal(inventory.length, 3);

  // Attempt overflow when slots are full
  const ok5 = addItemToInventory(inventory, ITEMS.subcore_board, 1, 3);
  assert.equal(ok5, false, 'Inventory at max capacity must reject new slot');

  // Use consumable item (medkit heals 40 HP from 60 to 100)
  assert.equal(state.player.hp, 60);
  const useRes = useInventoryItem(state, 0);
  assert.equal(useRes.success, true);
  assert.equal(state.player.hp, 100);
  assert.equal(inventory[0].quantity, 4);

  // Remove item
  const remOk = removeItemFromInventory(inventory, ITEMS.scrubber_filter.id, 1);
  assert.equal(remOk, true);
  assert.equal(inventory.length, 2);
});

test('3. Economy & Pascal script test: Prices scale with faction reputation', () => {
  const basePrice = 100;

  // Neutral standing
  const neutralPrice = calculateVendorPrice(basePrice, 0, 0);
  assert.equal(neutralPrice, 100);

  // Syndicate friendly (>30 rep gives 20% discount)
  const syndicateDiscountPrice = calculateVendorPrice(basePrice, 0, 40);
  assert.equal(syndicateDiscountPrice, 80);

  // Corporate friendly (>40 rep gives 15% discount)
  const corpDiscountPrice = calculateVendorPrice(basePrice, 50, 0);
  assert.equal(corpDiscountPrice, 85);
});

test('4. Mutually exclusive quest outcomes test', () => {
  // Test Corporate outcome
  const corpState = createInitialState();
  applyQuestEndingOutcome(corpState, 'corp');
  assert.equal(corpState.quests.ending, 'corp');
  assert.equal(corpState.quests.stage, 'completed_corp');
  assert.equal(corpState.reputation.corp > 50, true);
  assert.equal(corpState.reputation.syndicate < -50, true);
  assert.equal(corpState.inventory.some((s) => s.item.id === 'vip_clearance_card'), true);

  // Test Syndicate outcome
  const syndState = createInitialState();
  applyQuestEndingOutcome(syndState, 'syndicate');
  assert.equal(syndState.quests.ending, 'syndicate');
  assert.equal(syndState.quests.stage, 'completed_syndicate');
  assert.equal(syndState.reputation.syndicate > 50, true);
  assert.equal(syndState.reputation.corp < -50, true);
  assert.equal(syndState.quests.valveOverridden, true);
  assert.equal(syndState.player.debt, 0, 'Worker commune abolishes oxygen debt');

  // Test Smugglers outcome
  const smugState = createInitialState();
  applyQuestEndingOutcome(smugState, 'smugglers');
  assert.equal(smugState.quests.ending, 'smugglers');
  assert.equal(smugState.quests.stage, 'completed_smugglers');
  assert.equal(smugState.reputation.smugglers > 50, true);
});

test('5. Combat math test: Attack hitbox collision and knockback impulse', () => {
  const playerBox = { x: 50, y: 50, w: 16, h: 16 };
  const enemyInFront: Enemy = {
    id: 'drone1',
    type: 'drone',
    name: 'Тестовий дрон',
    x: 68,
    y: 50,
    vx: 0,
    vy: 0,
    w: 16,
    h: 16,
    hp: 50,
    maxHp: 50,
    speed: 30,
    dir: 'left',
    state: 'idle',
    stateTimer: 0,
    telegraphTimer: 0,
    attackCooldown: 0,
    hitFlashTime: 0,
    knockbackVx: 0,
    knockbackVy: 0,
    mapId: 'test_map',
  };

  // Facing right towards enemy
  const hitRes = calculatePlayerAttackHit(playerBox, 'right', enemyInFront);
  assert.equal(hitRes.isHit, true);
  assert.equal(hitRes.damage > 0, true);
  assert.equal(hitRes.knockbackX > 0, true);

  // Facing opposite (left) should miss
  const missRes = calculatePlayerAttackHit(playerBox, 'left', enemyInFront);
  assert.equal(missRes.isHit, false);
});
