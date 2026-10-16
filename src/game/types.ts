/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FactionId = 'corp' | 'syndicate' | 'smugglers';

export type QuestId = 'repair_recycler' | 'investigate_manipulation' | 'station_fate';

export type QuestStage =
  | 'not_started'
  | 'talk_to_clerk'
  | 'find_technician'
  | 'gather_parts'
  | 'repair_subcore'
  | 'evidence_found'
  | 'choose_fate'
  | 'completed_corp'
  | 'completed_syndicate'
  | 'completed_smugglers';

export type EndingOutcome = 'corp' | 'syndicate' | 'smugglers' | null;

export interface Item {
  id: string;
  name: string;
  description: string;
  category: 'consumable' | 'quest' | 'scrap' | 'key';
  value: number; // in credits
  stackable: boolean;
  maxStack?: number;
  effectType?: 'heal' | 'oxygen' | 'bypass' | 'cipher' | 'none';
  effectValue?: number;
  icon: string;
}

export interface InventorySlot {
  item: Item;
  quantity: number;
}

export interface EntityBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dir: 'up' | 'down' | 'left' | 'right';
  moving: boolean;
  hp: number;
  maxHp: number;
  oxygen: number; // 0..100
  maxOxygen: number;
  credits: number;
  debt: number; // Oxygen debt in credits
  isAttacking: boolean;
  attackCooldown: number;
  attackDuration: number;
  invulnerableTime: number;
  currentMapId: string;
}

export interface NPC {
  id: string;
  name: string;
  role: string;
  faction: FactionId;
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  dialogueRoot: string;
  attitude: number; // -100 to +100
  mapId: string;
  isVendor?: boolean;
  vendorInventory?: { itemId: string; price: number; stock: number }[];
  portrait: string; // procedural sprite key
}

export interface Enemy {
  id: string;
  type: 'drone' | 'sentry' | 'hazard_spider';
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  speed: number;
  dir: 'up' | 'down' | 'left' | 'right';
  state: 'idle' | 'patrol' | 'chase' | 'windup' | 'attack' | 'cooldown' | 'dead';
  stateTimer: number;
  telegraphTimer: number;
  attackCooldown: number;
  targetX?: number;
  targetY?: number;
  patrolPoints?: { x: number; y: number }[];
  currentPatrolIdx?: number;
  hitFlashTime: number;
  knockbackVx: number;
  knockbackVy: number;
  mapId: string;
}

export interface LootContainer {
  id: string;
  x: number;
  y: number;
  mapId: string;
  opened: boolean;
  items: { itemId: string; quantity: number }[];
  credits: number;
  requiresKey?: string;
  name: string;
}

export interface Terminal {
  id: string;
  x: number;
  y: number;
  mapId: string;
  name: string;
  requiredQuestStage?: string;
  actionId: string;
  isHacked: boolean;
}

export interface InteractiveDoor {
  id: string;
  x: number;
  y: number;
  targetMapId: string;
  targetX: number;
  targetY: number;
  locked: boolean;
  requiredKeyItemId?: string;
  name: string;
}

export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  collision: number[][]; // 0: passable, 1: wall/solid, 2: hazard/steam, 3: barrier
  floorTiles: number[][];
  wallTiles: number[][];
  doors: InteractiveDoor[];
  terminals: Terminal[];
  containers: LootContainer[];
  spawnX: number;
  spawnY: number;
  ambientLight: string;
  isHazardAtmosphere?: boolean; // oxygen drains faster here!
}

export interface DialogueChoice {
  text: string;
  nextNodeId?: string;
  condition?: (state: GameWorldState) => boolean;
  action?: (state: GameWorldState) => void;
  outcomeEnding?: EndingOutcome;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
}

export interface GameWorldState {
  player: PlayerState;
  inventory: InventorySlot[];
  maxInventorySlots: number;
  currentMapId: string;
  quests: {
    stage: QuestStage;
    objectives: Record<string, boolean>;
    ending: EndingOutcome;
    evidenceDecrypted: boolean;
    recyclerRepaired: boolean;
    valveOverridden: boolean;
    foundSecretStash: boolean;
  };
  reputation: {
    corp: number;      // -100 to 100
    syndicate: number; // -100 to 100
    smugglers: number; // -100 to 100
  };
  npcs: Record<string, NPC>;
  enemies: Enemy[];
  containers: Record<string, LootContainer>;
  terminals: Record<string, Terminal>;
  flags: Record<string, boolean | number | string>;
  gameTime: number; // elapsed seconds
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'spark' | 'smoke' | 'plasma' | 'steam' | 'blood';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}
