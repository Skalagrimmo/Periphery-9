/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MapData } from '../types';

export function createWorldMaps(): Record<string, MapData> {
  // Helper to create grid
  const makeGrid = (w: number, h: number, fill = 0): number[][] => {
    const grid: number[][] = [];
    for (let y = 0; y < h; y++) {
      grid.push(new Array(w).fill(fill));
    }
    return grid;
  };

  // -------------------------------------------------------------
  // MAP 1: CUSTOMS DOCK (Митно-шлюзовий док) - 24 x 18 tiles
  // -------------------------------------------------------------
  const dockW = 24;
  const dockH = 18;
  const dockCollision = makeGrid(dockW, dockH, 0);
  const dockFloor = makeGrid(dockW, dockH, 0);
  const dockWall = makeGrid(dockW, dockH, 0);

  // Outer perimeter walls
  for (let x = 0; x < dockW; x++) {
    dockCollision[0][x] = 1;
    dockCollision[dockH - 1][x] = 1;
  }
  for (let y = 0; y < dockH; y++) {
    dockCollision[y][0] = 1;
    dockCollision[y][dockW - 1] = 1;
  }

  // Checkpoint security barrier dividing shuttle arrival (left) and station entry (right)
  for (let y = 3; y < dockH - 3; y++) {
    dockCollision[y][12] = 1; // barrier wall
  }
  // Checkpoint gate at (12, 8) and (12, 9)
  dockCollision[8][12] = 0; // Passage opening
  dockCollision[9][12] = 0;

  // Shuttle docking clamps decoration
  for (let y = 4; y <= 7; y++) {
    dockCollision[y][3] = 1;
  }

  const customsDock: MapData = {
    id: 'customs_dock',
    name: 'Митно-шлюзовий док №4',
    width: dockW,
    height: dockH,
    tileSize: 16,
    collision: dockCollision,
    floorTiles: dockFloor,
    wallTiles: dockWall,
    spawnX: 10 * 16,
    spawnY: 8 * 16,
    ambientLight: '#161b26',
    isHazardAtmosphere: false,
    doors: [
      {
        id: 'door_to_market',
        x: 22 * 16,
        y: 8 * 16,
        targetMapId: 'industrial_market',
        targetX: 2 * 16,
        targetY: 10 * 16,
        locked: false,
        name: 'Шлюз до Індустріального базару',
      },
    ],
    terminals: [
      {
        id: 'term_customs',
        x: 11 * 16,
        y: 6 * 16,
        mapId: 'customs_dock',
        name: 'Термінал митного контролю',
        actionId: 'check_citizen_status',
        isHacked: false,
      },
    ],
    containers: [
      {
        id: 'crate_dock_supplies',
        x: 6 * 16,
        y: 2 * 16,
        mapId: 'customs_dock',
        opened: false,
        name: 'Контейнер контрабанди',
        items: [
          { itemId: 'oxygen_tank', quantity: 1 },
          { itemId: 'scrap_metal', quantity: 3 },
        ],
        credits: 40,
      },
    ],
  };

  // -------------------------------------------------------------
  // MAP 2: INDUSTRIAL MARKET (Індустріальний базар) - 28 x 22 tiles
  // -------------------------------------------------------------
  const mktW = 28;
  const mktH = 22;
  const mktCollision = makeGrid(mktW, mktH, 0);
  const mktFloor = makeGrid(mktW, mktH, 1);
  const mktWall = makeGrid(mktW, mktH, 1);

  // Outer walls
  for (let x = 0; x < mktW; x++) {
    mktCollision[0][x] = 1;
    mktCollision[mktH - 1][x] = 1;
  }
  for (let y = 0; y < mktH; y++) {
    mktCollision[y][0] = 1;
    mktCollision[y][mktW - 1] = 1;
  }

  // Market stalls / shop booths
  // Stall 1 (Top Left: Zoryana's Black Market)
  for (let x = 4; x <= 9; x++) {
    mktCollision[4][x] = 1;
  }
  mktCollision[5][4] = 1;
  mktCollision[6][4] = 1;

  // Stall 2 (Workers Union Plaza - Center)
  for (let y = 8; y <= 12; y++) {
    mktCollision[y][14] = 1;
  }

  // Stall 3 (Bottom Right - Info Kiosk & Vent)
  for (let x = 18; x <= 23; x++) {
    mktCollision[15][x] = 1;
  }

  const industrialMarket: MapData = {
    id: 'industrial_market',
    name: 'Індустріальний базар «Іскра»',
    width: mktW,
    height: mktH,
    tileSize: 16,
    collision: mktCollision,
    floorTiles: mktFloor,
    wallTiles: mktWall,
    spawnX: 3 * 16,
    spawnY: 10 * 16,
    ambientLight: '#231826',
    isHazardAtmosphere: false,
    doors: [
      {
        id: 'door_to_dock',
        x: 1 * 16,
        y: 10 * 16,
        targetMapId: 'customs_dock',
        targetX: 21 * 16,
        targetY: 8 * 16,
        locked: false,
        name: 'Шлюз назад до Доку',
      },
      {
        id: 'door_to_underdeck_main',
        x: 14 * 16,
        y: 20 * 16,
        targetMapId: 'underdeck_sublevel',
        targetX: 14 * 16,
        targetY: 2 * 16,
        locked: true,
        requiredKeyItemId: 'bypass_keycard',
        name: 'Люк технічного рівня (Потрібен ключ доступу)',
      },
      {
        id: 'secret_vent_to_underdeck',
        x: 25 * 16,
        y: 3 * 16,
        targetMapId: 'underdeck_sublevel',
        targetX: 25 * 16,
        targetY: 5 * 16,
        locked: false,
        name: 'Прихована вентиляційна шахта до Серверної',
      },
    ],
    terminals: [
      {
        id: 'term_market_news',
        x: 16 * 16,
        y: 8 * 16,
        mapId: 'industrial_market',
        name: 'Громадський інфо-термінал',
        actionId: 'read_market_news',
        isHacked: false,
      },
    ],
    containers: [
      {
        id: 'crate_market_scraps',
        x: 23 * 16,
        y: 17 * 16,
        mapId: 'industrial_market',
        opened: false,
        name: 'Схованка контрабандистів',
        items: [
          { itemId: 'medkit_stim', quantity: 1 },
          { itemId: 'bypass_keycard', quantity: 1 },
        ],
        credits: 75,
      },
    ],
  };

  // -------------------------------------------------------------
  // MAP 3: UNDERDECK SUBLEVEL (Технічний палубний рівень) - 30 x 24 tiles
  // -------------------------------------------------------------
  const undW = 30;
  const undH = 24;
  const undCollision = makeGrid(undW, undH, 0);
  const undFloor = makeGrid(undW, undH, 2);
  const undWall = makeGrid(undW, undH, 2);

  // Outer walls
  for (let x = 0; x < undW; x++) {
    undCollision[0][x] = 1;
    undCollision[undH - 1][x] = 1;
  }
  for (let y = 0; y < undH; y++) {
    undCollision[y][0] = 1;
    undCollision[y][undW - 1] = 1;
  }

  // Central Recycler Machine chamber walls & corridors
  // Machinery block in center (12, 10) to (17, 14)
  for (let y = 10; y <= 13; y++) {
    for (let x = 13; x <= 16; x++) {
      undCollision[y][x] = 1; // Solid recycler housing
    }
  }

  // Internal corridors and steam vents
  for (let x = 4; x <= 10; x++) {
    undCollision[6][x] = 1;
    undCollision[16][x] = 1;
  }
  for (let x = 19; x <= 25; x++) {
    undCollision[6][x] = 1;
    undCollision[16][x] = 1;
  }

  // Steam hazards (collision = 2, causes continuous oxygen/heat damage)
  undCollision[9][6] = 2;
  undCollision[10][6] = 2;
  undCollision[12][22] = 2;
  undCollision[13][22] = 2;

  const underdeckSublevel: MapData = {
    id: 'underdeck_sublevel',
    name: 'Аварійний підпалубний сектор №9',
    width: undW,
    height: undH,
    tileSize: 16,
    collision: undCollision,
    floorTiles: undFloor,
    wallTiles: undWall,
    spawnX: 14 * 16,
    spawnY: 3 * 16,
    ambientLight: '#0d1512',
    isHazardAtmosphere: true, // Thinned oxygen drains meter!
    doors: [
      {
        id: 'door_back_to_market',
        x: 14 * 16,
        y: 1 * 16,
        targetMapId: 'industrial_market',
        targetX: 14 * 16,
        targetY: 19 * 16,
        locked: false,
        name: 'Люк нагору до Базару',
      },
    ],
    terminals: [
      {
        id: 'term_recycler_control',
        x: 14 * 16,
        y: 9 * 16,
        mapId: 'underdeck_sublevel',
        name: 'Консоль управління Оксигенератором',
        actionId: 'interact_recycler',
        isHacked: false,
      },
      {
        id: 'term_corp_server',
        x: 25 * 16,
        y: 8 * 16,
        mapId: 'underdeck_sublevel',
        name: 'Секретний сервер Консорціуму',
        actionId: 'download_corp_telemetry',
        isHacked: false,
      },
    ],
    containers: [
      {
        id: 'crate_parts_stash',
        x: 5 * 16,
        y: 18 * 16,
        mapId: 'underdeck_sublevel',
        opened: false,
        name: 'Забутий ремонтний ящик',
        items: [
          { itemId: 'scrubber_filter', quantity: 1 },
          { itemId: 'cryo_coolant', quantity: 1 },
          { itemId: 'medkit_stim', quantity: 1 },
        ],
        credits: 90,
      },
      {
        id: 'crate_secret_stash',
        x: 26 * 16,
        y: 19 * 16,
        mapId: 'underdeck_sublevel',
        opened: false,
        name: 'Сейф саботажника (Секрет)',
        items: [
          { itemId: 'subcore_board', quantity: 1 },
          { itemId: 'oxygen_tank', quantity: 2 },
        ],
        credits: 150,
      },
    ],
  };

  return {
    customs_dock: customsDock,
    industrial_market: industrialMarket,
    underdeck_sublevel: underdeckSublevel,
  };
}
