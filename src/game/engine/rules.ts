/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  GameWorldState,
  InventorySlot,
  Item,
  MapData,
  EndingOutcome,
  Enemy,
  EntityBox,
} from '../types';
import { ITEMS } from '../items';
import { runPascalScript } from '../polyglot/pascal/pascalInterpreter';
import { STATION_ECONOMY_PAS, QUEST_BRANCHING_PAS } from '../polyglot/pascal/scripts/stationEconomy';
import { checkAABB } from './math';

export const TILE_SIZE = 16;
export const MAX_INVENTORY_SLOTS = 12;

/**
 * Checks if a bounding box collides with solid tiles (collision value === 1) or barriers.
 */
export function checkTileCollision(
  box: EntityBox,
  map: MapData
): boolean {
  const minTileX = Math.floor(box.x / map.tileSize);
  const maxTileX = Math.floor((box.x + box.w - 1) / map.tileSize);
  const minTileY = Math.floor(box.y / map.tileSize);
  const maxTileY = Math.floor((box.y + box.h - 1) / map.tileSize);

  for (let ty = minTileY; ty <= maxTileY; ty++) {
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) {
        return true; // Out of bounds is solid
      }
      const tileType = map.collision[ty]?.[tx];
      if (tileType === 1 || tileType === 3) {
        return true; // 1 = solid wall, 3 = barrier/locked door
      }
    }
  }
  return false;
}

/**
 * Adds an item to the player's inventory, respecting stack limits and max slots.
 * Returns true if added, false if inventory was full.
 */
export function addItemToInventory(
  inventory: InventorySlot[],
  item: Item,
  quantity = 1,
  maxSlots = MAX_INVENTORY_SLOTS
): boolean {
  if (quantity <= 0) return false;

  // 1. Try stacking if stackable
  if (item.stackable) {
    const existing = inventory.find((slot) => slot.item.id === item.id);
    if (existing) {
      const maxStack = item.maxStack ?? 99;
      const canAdd = maxStack - existing.quantity;
      if (canAdd >= quantity) {
        existing.quantity += quantity;
        return true;
      } else if (canAdd > 0) {
        existing.quantity = maxStack;
        quantity -= canAdd;
      }
    }
  }

  // 2. Add to new slot if space available
  if (inventory.length < maxSlots) {
    inventory.push({ item, quantity });
    return true;
  }

  return false;
}

/**
 * Removes an item or stack portion from the inventory.
 */
export function removeItemFromInventory(
  inventory: InventorySlot[],
  itemId: string,
  quantity = 1
): boolean {
  const index = inventory.findIndex((slot) => slot.item.id === itemId);
  if (index === -1) return false;

  const slot = inventory[index];
  if (slot.quantity > quantity) {
    slot.quantity -= quantity;
    return true;
  } else if (slot.quantity === quantity) {
    inventory.splice(index, 1);
    return true;
  }

  return false;
}

/**
 * Uses a consumable or usable item.
 */
export function useInventoryItem(
  state: GameWorldState,
  slotIndex: number
): { success: boolean; message: string } {
  const slot = state.inventory[slotIndex];
  if (!slot) return { success: false, message: 'Предмет не знайдено' };

  const item = slot.item;

  if (item.effectType === 'heal') {
    if (state.player.hp >= state.player.maxHp) {
      return { success: false, message: 'Здоров’я вже на максимумі' };
    }
    const healAmount = item.effectValue ?? 30;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount);
    removeItemFromInventory(state.inventory, item.id, 1);
    return { success: true, message: `Відновлено ${healAmount} HP` };
  }

  if (item.effectType === 'oxygen') {
    if (state.player.oxygen >= state.player.maxOxygen) {
      return { success: false, message: 'Резервуар кисню повний' };
    }
    const oxyAmount = item.effectValue ?? 50;
    state.player.oxygen = Math.min(state.player.maxOxygen, state.player.oxygen + oxyAmount);
    removeItemFromInventory(state.inventory, item.id, 1);
    return { success: true, message: `Поповнено ${oxyAmount}% запасу O2` };
  }

  if (item.id === 'encrypted_drive') {
    if (!state.quests.evidenceDecrypted) {
      state.quests.evidenceDecrypted = true;
      removeItemFromInventory(state.inventory, item.id, 1);
      addItemToInventory(state.inventory, ITEMS.decrypted_evidence, 1);
      state.quests.stage = 'evidence_found';
      return {
        success: true,
        message: 'Накопичувач розшифровано! Отримано докази маніпуляцій Консорціуму.',
      };
    }
  }

  return { success: false, message: `${item.name} не має прямого ефекту застосування` };
}

/**
 * Calculates vendor price based on Pascal script economy simulation.
 */
export function calculateVendorPrice(
  basePrice: number,
  repCorp: number,
  repSyndicate: number,
  hasVIP = false
): number {
  try {
    const res = runPascalScript(STATION_ECONOMY_PAS, {
      reputationcorp: repCorp,
      reputationsyndicate: repSyndicate,
      baseprice: basePrice,
      hasvipaccess: hasVIP,
    });
    return Number(res.vendorprice) || basePrice;
  } catch {
    // Graceful fallback
    let mult = 1.0;
    if (repSyndicate > 30) mult -= 0.2;
    if (repCorp > 40) mult -= 0.15;
    return Math.max(1, Math.round(basePrice * mult));
  }
}

/**
 * Executes quest outcome and mutates faction reputation and station state via Pascal rules.
 */
export function applyQuestEndingOutcome(
  state: GameWorldState,
  outcome: EndingOutcome
): void {
  if (!outcome) return;

  try {
    const scriptResult = runPascalScript(QUEST_BRANCHING_PAS, {
      chosenoutcome: outcome,
    });

    state.reputation.corp += Number(scriptResult.corprepdelta) || 0;
    state.reputation.syndicate += Number(scriptResult.syndicaterepdelta) || 0;
    state.reputation.smugglers += Number(scriptResult.smugglerrepdelta) || 0;
  } catch {
    if (outcome === 'corp') {
      state.reputation.corp += 60;
      state.reputation.syndicate -= 80;
    } else if (outcome === 'syndicate') {
      state.reputation.corp -= 90;
      state.reputation.syndicate += 80;
    } else {
      state.reputation.smugglers += 75;
      state.reputation.syndicate += 20;
    }
  }

  state.quests.ending = outcome;
  if (outcome === 'corp') {
    state.quests.stage = 'completed_corp';
    state.player.credits += 1000;
    addItemToInventory(state.inventory, ITEMS.vip_clearance_card, 1);
  } else if (outcome === 'syndicate') {
    state.quests.stage = 'completed_syndicate';
    state.quests.valveOverridden = true;
    state.player.debt = 0; // Debt abolished by workers
  } else if (outcome === 'smugglers') {
    state.quests.stage = 'completed_smugglers';
    state.player.credits += 600;
    state.player.debt = Math.floor(state.player.debt / 2);
  }
}

/**
 * Evaluates player melee attack hit against an enemy.
 */
export function calculatePlayerAttackHit(
  playerBox: EntityBox,
  playerDir: 'up' | 'down' | 'left' | 'right',
  enemy: Enemy
): { isHit: boolean; damage: number; knockbackX: number; knockbackY: number } {
  // Compute weapon swing arc box
  let attackBox: EntityBox;
  const reach = 22;

  switch (playerDir) {
    case 'up':
      attackBox = { x: playerBox.x - 4, y: playerBox.y - reach, w: playerBox.w + 8, h: reach };
      break;
    case 'down':
      attackBox = { x: playerBox.x - 4, y: playerBox.y + playerBox.h, w: playerBox.w + 8, h: reach };
      break;
    case 'left':
      attackBox = { x: playerBox.x - reach, y: playerBox.y - 4, w: reach, h: playerBox.h + 8 };
      break;
    case 'right':
      attackBox = { x: playerBox.x + playerBox.w, y: playerBox.y - 4, w: reach, h: playerBox.h + 8 };
      break;
  }

  const enemyBox: EntityBox = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
  if (!checkAABB(attackBox, enemyBox)) {
    return { isHit: false, damage: 0, knockbackX: 0, knockbackY: 0 };
  }

  // Knockback direction
  let kx = 0;
  let ky = 0;
  const impulse = 80;
  if (playerDir === 'up') ky = -impulse;
  if (playerDir === 'down') ky = impulse;
  if (playerDir === 'left') kx = -impulse;
  if (playerDir === 'right') kx = impulse;

  return {
    isHit: true,
    damage: 25,
    knockbackX: kx,
    knockbackY: ky,
  };
}
