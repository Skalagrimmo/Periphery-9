/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameWorldState } from '../types';

const SAVE_KEY = 'PERIPHERY9_SAVE_DATA_V1';

export function saveGameState(state: GameWorldState): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const serialized = JSON.stringify({
      version: 1,
      savedAt: Date.now(),
      player: state.player,
      inventory: state.inventory,
      currentMapId: state.currentMapId,
      quests: state.quests,
      reputation: state.reputation,
      flags: state.flags,
      containers: state.containers,
      terminals: state.terminals,
      gameTime: state.gameTime,
    });
    localStorage.setItem(SAVE_KEY, serialized);
    return true;
  } catch (err) {
    console.error('Failed to save Periphery-9 game state:', err);
    return false;
  }
}

export function loadGameState(): Partial<GameWorldState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== 1) return null;
    return {
      player: data.player,
      inventory: data.inventory,
      currentMapId: data.currentMapId,
      quests: data.quests,
      reputation: data.reputation,
      flags: data.flags,
      containers: data.containers,
      terminals: data.terminals,
      gameTime: data.gameTime,
    };
  } catch (err) {
    console.error('Failed to parse saved game state:', err);
    return null;
  }
}

export function hasSavedGame(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(SAVE_KEY));
}

export function deleteSavedGame(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SAVE_KEY);
}
