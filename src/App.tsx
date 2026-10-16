/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameWorldState,
  MapData,
  NPC,
  Particle,
  FloatingText,
  EndingOutcome,
} from './game/types';
import { createWorldMaps } from './game/world/maps';
import { createInitialNPCs } from './game/dialogue/dialogueData';
import { createInitialEnemies, updateEnemies, PlasmaProjectile } from './game/entities/enemy';
import { CanvasRenderer, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './game/render/canvasRenderer';
import { inputManager } from './game/engine/input';
import { checkTileCollision, calculatePlayerAttackHit, addItemToInventory } from './game/engine/rules';
import { distance, distanceSq } from './game/engine/math';
import { audio } from './game/engine/audio';
import { initWasmMath } from './game/wasm/fixedPointWasm';
import { saveGameState, loadGameState, hasSavedGame } from './game/engine/saveLoad';
import { ITEMS } from './game/items';

// UI Components
import { HUD } from './game/ui/HUD';
import { VirtualJoystick } from './game/ui/VirtualJoystick';
import { TitleScreen } from './game/ui/TitleScreen';
import { DialogueModal } from './game/ui/DialogueModal';
import { InventoryModal } from './game/ui/InventoryModal';
import { EndingModal } from './game/ui/EndingModal';
import { PauseMenuModal } from './game/ui/PauseMenuModal';
import { ControlsTutorialModal } from './game/ui/ControlsTutorialModal';
import { DebugOverlay } from './game/ui/DebugOverlay';

export type GameScreenState = 'title' | 'playing' | 'paused' | 'gameover' | 'ending';

function createFreshWorldState(): GameWorldState {
  return {
    player: {
      x: 10 * 16,
      y: 8 * 16,
      vx: 0,
      vy: 0,
      dir: 'right',
      moving: false,
      hp: 100,
      maxHp: 100,
      oxygen: 85,
      maxOxygen: 100,
      credits: 65,
      debt: 120,
      isAttacking: false,
      attackCooldown: 0,
      attackDuration: 0,
      invulnerableTime: 0,
      currentMapId: 'customs_dock',
    },
    inventory: [
      { item: ITEMS.medkit_stim, quantity: 2 },
      { item: ITEMS.oxygen_tank, quantity: 1 },
      { item: ITEMS.scrap_metal, quantity: 4 },
    ],
    maxInventorySlots: 12,
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
    npcs: createInitialNPCs(),
    enemies: createInitialEnemies(),
    containers: {},
    terminals: {},
    flags: {},
    gameTime: 0,
  };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  // Check ?autostart=1
  const isAutostart = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autostart') === '1';

  // Game UI screens
  const [screen, setScreen] = useState<GameScreenState>(isAutostart ? 'playing' : 'title');
  const [showInventory, setShowInventory] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isVendorActive, setIsVendorActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Active dialogue target
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [activeDialogueNodeId, setActiveDialogueNodeId] = useState<string>('clerk_greeting');

  // Interaction prompt displayed on screen
  const [interactionPrompt, setInteractionPrompt] = useState<string | null>(null);

  // World maps and dynamic simulation state
  const mapsRef = useRef<Record<string, MapData>>(createWorldMaps());
  const stateRef = useRef<GameWorldState>(createFreshWorldState());
  const projectilesRef = useRef<PlasmaProjectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // Telemetry for F3 overlay
  const [debugFps, setDebugFps] = useState(60);
  const [debugFrameTime, setDebugFrameTime] = useState(16.6);
  const [debugVisibleEntities, setDebugVisibleEntities] = useState(0);

  // Force React render for HUD updates
  const [, setHudTick] = useState(0);

  // Sync state to body dataset
  useEffect(() => {
    document.body.dataset.state = screen;
  }, [screen]);

  // Initialize WebAssembly math
  useEffect(() => {
    initWasmMath().catch(() => {});
  }, []);

  // Initialize Canvas Renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        rendererRef.current = new CanvasRenderer(ctx);
      }
    }
  });

  // Global shortcuts for F3 and Escape
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        e.preventDefault();
        setShowDebug((prev) => !prev);
      }
      if (e.code === 'Escape') {
        if (showInventory) {
          setShowInventory(false);
        } else if (showTutorial) {
          setShowTutorial(false);
        } else if (showDebug) {
          setShowDebug(false);
        } else if (activeNPC) {
          setActiveNPC(null);
        } else if (screen === 'paused') {
          setScreen('playing');
        } else if (screen === 'playing') {
          setScreen('paused');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [showInventory, showTutorial, showDebug, activeNPC, screen]);

  // Main 60 FPS Simulation & Rendering Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let stepAccumulator = 0;
    let fpsFrames = 0;
    let fpsLastSample = performance.now();
    let walkTimer = 0;
    let stepSoundTimer = 0;

    const gameLoop = (currentTime: number) => {
      const rawDt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent tunnelling

      // Measure FPS
      fpsFrames++;
      if (currentTime - fpsLastSample >= 500) {
        setDebugFps(Math.round((fpsFrames * 1000) / (currentTime - fpsLastSample)));
        setDebugFrameTime(dt * 1000);
        fpsFrames = 0;
        fpsLastSample = currentTime;
      }

      const state = stateRef.current;
      const currentMap = mapsRef.current[state.currentMapId] || mapsRef.current['customs_dock'];

      // Check if paused or in dialogue or gameover
      const isSimRunning =
        screen === 'playing' &&
        !showInventory &&
        !showTutorial &&
        !activeNPC &&
        !state.quests.ending;

      if (isSimRunning) {
        state.gameTime += dt;

        // 1. Process F3 debug toggle
        if (inputManager.isF3Pressed()) {
          setShowDebug((prev) => !prev);
        }

        // 2. Process Menu / Esc toggle
        if (inputManager.isMenuPressed()) {
          if (showInventory) {
            setShowInventory(false);
          } else if (showTutorial) {
            setShowTutorial(false);
          } else if (showDebug) {
            setShowDebug(false);
          } else if (activeNPC) {
            setActiveNPC(null);
          } else {
            setScreen('paused');
          }
        }

        // 3. Process Inventory [I] toggle
        if (inputManager.isInventoryPressed()) {
          setIsVendorActive(false);
          setShowInventory(true);
        }

        // 4. Update Player Movement & Collision
        const moveVec = inputManager.getMovementVector();
        const player = state.player;
        const playerSpeed = 70; // pixels per second

        player.moving = moveVec.x !== 0 || moveVec.y !== 0;

        if (player.moving) {
          walkTimer += dt;
          stepSoundTimer += dt;
          if (stepSoundTimer > 0.32) {
            audio.playStep();
            stepSoundTimer = 0;
          }

          // Determine cardinal direction for sprite facing
          if (Math.abs(moveVec.x) > Math.abs(moveVec.y)) {
            player.dir = moveVec.x > 0 ? 'right' : 'left';
          } else {
            player.dir = moveVec.y > 0 ? 'down' : 'up';
          }

          // Axis-separated movement for smooth wall sliding
          const dx = moveVec.x * playerSpeed * dt;
          const dy = moveVec.y * playerSpeed * dt;

          const playerW = 12;
          const playerH = 12;

          // Horizontal test
          const nextBoxX = {
            x: player.x + dx,
            y: player.y,
            w: playerW,
            h: playerH,
          };
          if (!checkTileCollision(nextBoxX, currentMap)) {
            player.x += dx;
          }

          // Vertical test
          const nextBoxY = {
            x: player.x,
            y: player.y + dy,
            w: playerW,
            h: playerH,
          };
          if (!checkTileCollision(nextBoxY, currentMap)) {
            player.y += dy;
          }
        }

        // 5. Update Player Attack
        if (player.attackCooldown > 0) {
          player.attackCooldown -= dt;
        }

        if (inputManager.isAttackPressed() && player.attackCooldown <= 0) {
          player.isAttacking = true;
          player.attackCooldown = 0.38;
          player.attackDuration = 0.16;
          audio.playAttack();

          // Check hit against enemies
          const playerBox = { x: player.x, y: player.y, w: 12, h: 12 };
          for (const enemy of state.enemies) {
            if (enemy.mapId !== currentMap.id || enemy.state === 'dead') continue;
            const hit = calculatePlayerAttackHit(playerBox, player.dir, enemy);
            if (hit.isHit) {
              enemy.hp -= hit.damage;
              enemy.hitFlashTime = 0.12;
              enemy.knockbackVx = hit.knockbackX;
              enemy.knockbackVy = hit.knockbackY;
              audio.playHit();
              rendererRef.current?.setShake(4, 0.15);

              // Floating damage text
              floatingTextsRef.current.push({
                id: 'dmg_' + Math.random(),
                x: enemy.x + 8,
                y: enemy.y - 4,
                text: `-${hit.damage}`,
                color: '#38bdf8',
                life: 0.6,
                maxLife: 0.6,
              });

              // Sparks
              for (let s = 0; s < 6; s++) {
                particlesRef.current.push({
                  x: enemy.x + 8,
                  y: enemy.y + 8,
                  vx: (Math.random() - 0.5) * 60,
                  vy: (Math.random() - 0.5) * 60,
                  life: 0.25,
                  maxLife: 0.25,
                  color: '#38bdf8',
                  size: 2,
                  type: 'spark',
                });
              }
            }
          }
        }

        if (player.isAttacking) {
          player.attackDuration -= dt;
          if (player.attackDuration <= 0) {
            player.isAttacking = false;
          }
        }

        if (player.invulnerableTime > 0) {
          player.invulnerableTime -= dt;
        }

        // 6. Oxygen Simulation & Atmospheric Hazards
        const oxygenDrainRate = currentMap.isHazardAtmosphere ? 1.4 : 0.4;
        player.oxygen = Math.max(0, player.oxygen - oxygenDrainRate * dt);

        if (player.oxygen <= 0) {
          // Oxygen debt penalty
          player.debt += Math.round(5 * dt);
          // Suffocation damage
          player.hp = Math.max(0, player.hp - 6 * dt);
          if (player.hp <= 0) {
            setScreen('gameover');
          }
        }

        // 7. Context-sensitive Interaction Queries
        let promptText: string | null = null;
        const interactRadius = 38;

        // Check NPCs
        for (const npc of Object.values(state.npcs)) {
          if (npc.mapId !== currentMap.id) continue;
          if (distance(player.x, player.y, npc.x, npc.y) < interactRadius) {
            promptText = `[E] Поговорити з ${npc.name}`;
            if (inputManager.isInteractPressed()) {
              audio.playDialogBeep();
              setActiveNPC(npc);
              setActiveDialogueNodeId(npc.dialogueRoot);
              setInteractionPrompt(null);
              break;
            }
          }
        }

        // Check Containers
        if (!promptText) {
          for (const crate of currentMap.containers) {
            if (distance(player.x, player.y, crate.x, crate.y) < interactRadius) {
              if (crate.opened) {
                promptText = `${crate.name} (Порожньо)`;
              } else {
                promptText = `[E] Відкрити ${crate.name}`;
                if (inputManager.isInteractPressed()) {
                  crate.opened = true;
                  audio.playPickup();
                  player.credits += crate.credits;
                  for (const it of crate.items) {
                    const itemObj = ITEMS[it.itemId];
                    if (itemObj) {
                      addItemToInventory(state.inventory, itemObj, it.quantity);
                    }
                  }
                  floatingTextsRef.current.push({
                    id: 'crate_' + Math.random(),
                    x: crate.x + 8,
                    y: crate.y - 6,
                    text: `+${crate.credits} CR`,
                    color: '#fbbf24',
                    life: 0.8,
                    maxLife: 0.8,
                  });
                }
              }
              break;
            }
          }
        }

        // Check Terminals
        if (!promptText) {
          for (const term of currentMap.terminals) {
            if (distance(player.x, player.y, term.x, term.y) < interactRadius) {
              promptText = `[E] Активувати: ${term.name}`;
              if (inputManager.isInteractPressed()) {
                audio.playTerminal();
                if (term.actionId === 'interact_recycler') {
                  const neosNPC = state.npcs['neos_core'];
                  if (neosNPC) {
                    setActiveNPC(neosNPC);
                    setActiveDialogueNodeId('neos_greeting');
                  }
                } else if (term.actionId === 'download_corp_telemetry') {
                  if (!state.inventory.some((s) => s.item.id === 'encrypted_drive' || s.item.id === 'decrypted_evidence')) {
                    addItemToInventory(state.inventory, ITEMS.encrypted_drive, 1);
                    floatingTextsRef.current.push({
                      id: 'dl_' + Math.random(),
                      x: term.x + 8,
                      y: term.y - 6,
                      text: 'Накопичувач завантажено!',
                      color: '#00f0ff',
                      life: 1.0,
                      maxLife: 1.0,
                    });
                  }
                } else if (term.actionId === 'read_market_news') {
                  floatingTextsRef.current.push({
                    id: 'news_' + Math.random(),
                    x: term.x + 8,
                    y: term.y - 6,
                    text: '«Новина: Тарифи на O2 зросли на 40%»',
                    color: '#e2e8f0',
                    life: 1.2,
                    maxLife: 1.2,
                  });
                }
              }
              break;
            }
          }
        }

        // Check Doors (map transitions)
        if (!promptText) {
          for (const door of currentMap.doors) {
            if (distance(player.x, player.y, door.x, door.y) < 18) {
              if (door.locked) {
                const hasKey = door.requiredKeyItemId
                  ? state.inventory.some((s) => s.item.id === door.requiredKeyItemId)
                  : false;

                if (hasKey) {
                  promptText = `[E] Відімкнути двері ключем`;
                  if (inputManager.isInteractPressed()) {
                    door.locked = false;
                    audio.playDoor();
                  }
                } else {
                  promptText = `${door.name} (Заблоковано)`;
                }
              } else {
                promptText = `[E] Перейти: ${door.name}`;
                if (inputManager.isInteractPressed()) {
                  audio.playDoor();
                  state.currentMapId = door.targetMapId;
                  player.currentMapId = door.targetMapId;
                  player.x = door.targetX;
                  player.y = door.targetY;
                  // Center camera immediately
                  rendererRef.current?.updateCamera(player.x, player.y, mapsRef.current[door.targetMapId], 1.0);
                  break;
                }
              }
              break;
            }
          }
        }

        setInteractionPrompt(promptText);

        // 8. Update Enemies
        updateEnemies(state.enemies, projectilesRef.current, state, currentMap, dt);

        // 9. Update Floating Texts & Particles
        for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
          const ft = floatingTextsRef.current[i];
          ft.life -= dt;
          ft.y -= 12 * dt;
          if (ft.life <= 0) floatingTextsRef.current.splice(i, 1);
        }

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const pt = particlesRef.current[i];
          pt.life -= dt;
          pt.x += pt.vx * dt;
          pt.y += pt.vy * dt;
          if (pt.life <= 0) particlesRef.current.splice(i, 1);
        }

        // Check if trade flag raised by NPC
        if (state.flags['open_trade_zoryana']) {
          state.flags['open_trade_zoryana'] = false;
          setIsVendorActive(true);
          setShowInventory(true);
          setActiveNPC(null);
        }

        // Check if game reached one of the endings
        if (state.quests.ending && screen !== 'ending') {
          setScreen('ending');
        }

        // Update camera position
        rendererRef.current?.updateCamera(player.x + 6, player.y + 6, currentMap, dt);

        // Periodically refresh HUD
        stepAccumulator += dt;
        if (stepAccumulator > 0.1) {
          stepAccumulator = 0;
          setHudTick((t) => t + 1);
        }
      }

      // Render frame
      if (rendererRef.current) {
        rendererRef.current.render(
          state,
          currentMap,
          projectilesRef.current,
          particlesRef.current,
          floatingTextsRef.current,
          walkTimer
        );

        setDebugVisibleEntities(
          state.enemies.filter((e) => e.mapId === currentMap.id && e.state !== 'dead').length +
            Object.values(state.npcs).filter((n) => n.mapId === currentMap.id).length +
            projectilesRef.current.length
        );
      }

      inputManager.updateEndOfFrame();
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [screen, showInventory, showTutorial, activeNPC]);

  // Handle choice selection in dialogue
  const handleSelectChoice = useCallback((nextNodeId?: string) => {
    if (nextNodeId) {
      setActiveDialogueNodeId(nextNodeId);
    } else {
      setActiveNPC(null);
    }
  }, []);

  const handleStartNewGame = useCallback(() => {
    stateRef.current = createFreshWorldState();
    mapsRef.current = createWorldMaps();
    projectilesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    setScreen('playing');
    audio.startAmbience();
  }, []);

  const handleContinueSaved = useCallback(() => {
    const loaded = loadGameState();
    if (loaded) {
      stateRef.current = {
        ...createFreshWorldState(),
        ...loaded,
      };
      setScreen('playing');
      audio.startAmbience();
    } else {
      handleStartNewGame();
    }
  }, [handleStartNewGame]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !rendererRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = VIEWPORT_WIDTH / rect.width;
    const scaleY = VIEWPORT_HEIGHT / rect.height;
    const worldX = (e.clientX - rect.left) * scaleX + rendererRef.current.camera.x;
    const worldY = (e.clientY - rect.top) * scaleY + rendererRef.current.camera.y;

    const state = stateRef.current;
    const currentMap = mapsRef.current[state.currentMapId];
    if (!currentMap) return;

    // Check tapped NPC
    for (const npc of Object.values(state.npcs)) {
      if (npc.mapId !== currentMap.id) continue;
      if (distance(worldX, worldY, npc.x + 8, npc.y + 8) < 32) {
        if (distance(state.player.x, state.player.y, npc.x, npc.y) < 65) {
          audio.playDialogBeep();
          setActiveNPC(npc);
          setActiveDialogueNodeId(npc.dialogueRoot);
          return;
        }
      }
    }
  };

  return (
    <div
      data-testid="game-root"
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-mono select-none"
    >
      {/* 2D Pixel Canvas Surface */}
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          data-testid="game-canvas"
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          onPointerDown={handleCanvasPointerDown}
          className="w-full h-full object-contain image-rendering-pixelated cursor-crosshair"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Retro CRT Scanline Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          background:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
          backgroundSize: '100% 3px, 6px 100%',
        }}
      />

      {/* Screen 1: Title Screen */}
      {screen === 'title' && (
        <TitleScreen
          onStartGame={handleStartNewGame}
          onOpenTutorial={() => setShowTutorial(true)}
          hasSave={hasSavedGame()}
          onContinue={handleContinueSaved}
        />
      )}

      {/* Screen 2: HUD & Mobile Controls (when in playing / dialogue / inventory) */}
      {(screen === 'playing' || screen === 'paused') && (
        <>
          <HUD
            state={stateRef.current}
            activeInteractionPrompt={interactionPrompt}
            onOpenInventory={() => {
              setIsVendorActive(false);
              setShowInventory(true);
            }}
            onOpenMenu={() => setScreen('paused')}
            onOpenTutorial={() => setShowTutorial(true)}
            onToggleDebug={() => setShowDebug((prev) => !prev)}
            isMuted={isMuted}
            onToggleMute={() => {
              const muted = audio.toggleMute();
              setIsMuted(muted);
            }}
          />
          <VirtualJoystick />
        </>
      )}

      {/* Dialogue Modal */}
      {activeNPC && (
        <DialogueModal
          npc={activeNPC}
          currentNodeId={activeDialogueNodeId}
          worldState={stateRef.current}
          onSelectChoice={handleSelectChoice}
          onClose={() => setActiveNPC(null)}
        />
      )}

      {/* Inventory & Trade Modal */}
      {showInventory && (
        <InventoryModal
          worldState={stateRef.current}
          isVendorMode={isVendorActive}
          onClose={() => setShowInventory(false)}
          onStateChanged={() => setHudTick((t) => t + 1)}
        />
      )}

      {/* Pause Menu */}
      {screen === 'paused' && (
        <PauseMenuModal
          state={stateRef.current}
          onResume={() => setScreen('playing')}
          onRestart={handleStartNewGame}
          onOpenTutorial={() => setShowTutorial(true)}
          onLoadSaved={(loaded) => {
            stateRef.current = {
              ...createFreshWorldState(),
              ...loaded,
            };
            setScreen('playing');
          }}
        />
      )}

      {/* Game Over Modal */}
      {screen === 'gameover' && (
        <PauseMenuModal
          isGameOver
          state={stateRef.current}
          onResume={() => {}}
          onRestart={handleStartNewGame}
          onOpenTutorial={() => setShowTutorial(true)}
          onLoadSaved={(loaded) => {
            stateRef.current = {
              ...createFreshWorldState(),
              ...loaded,
            };
            setScreen('playing');
          }}
        />
      )}

      {/* Ending Epilogue Modal */}
      {screen === 'ending' && stateRef.current.quests.ending && (
        <EndingModal
          outcome={stateRef.current.quests.ending}
          state={stateRef.current}
          onRestart={handleStartNewGame}
          onContinueExploring={() => {
            setScreen('playing');
          }}
        />
      )}

      {/* Controls Tutorial Modal */}
      {showTutorial && (
        <ControlsTutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {/* Developer F3 Diagnostics Overlay */}
      {showDebug && (
        <DebugOverlay
          fps={debugFps}
          frameTimeMs={debugFrameTime}
          visibleEntityCount={debugVisibleEntities}
          state={stateRef.current}
          onClose={() => setShowDebug(false)}
        />
      )}
    </div>
  );
}
