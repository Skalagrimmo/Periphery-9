/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameWorldState } from '../types';
import { getWasmModuleStatus } from '../wasm/fixedPointWasm';
import { rustBridgeStatus } from '../polyglot/rust/rustBridge';

interface DebugOverlayProps {
  fps: number;
  frameTimeMs: number;
  visibleEntityCount: number;
  state: GameWorldState;
  onClose: () => void;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  fps,
  frameTimeMs,
  visibleEntityCount,
  state,
  onClose,
}) => {
  const wasmStatus = getWasmModuleStatus();

  return (
    <div className="fixed top-12 left-2 sm:left-4 z-40 bg-black/90 border border-green-500/80 p-3 rounded font-mono text-[10px] sm:text-xs text-green-400 max-w-sm pointer-events-auto shadow-2xl select-none leading-relaxed">
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-green-800 text-green-300 font-bold">
        <span>[F3] ДІАГНОСТИКА ІНЖЕНЕРА</span>
        <button
          onClick={onClose}
          className="hover:text-white px-1 border border-green-800 rounded"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        <div>FPS: <span className="text-white font-bold">{fps}</span></div>
        <div>Час кадру: <span className="text-white">{frameTimeMs.toFixed(1)} мс</span></div>
        <div>Видимих сутностей: <span className="text-white">{visibleEntityCount}</span></div>
        <div>Карта: <span className="text-white">{state.currentMapId}</span></div>
        <div>Координати гравця: <span className="text-white">X:{Math.round(state.player.x)} Y:{Math.round(state.player.y)}</span></div>
        <div>Здоров’я / Кисень: <span className="text-white">{Math.round(state.player.hp)} / {Math.round(state.player.oxygen)}%</span></div>
        <div>Кредити / Борг: <span className="text-white">{state.player.credits} / {state.player.debt}</span></div>
        <div>Стадія квесту: <span className="text-white">{state.quests.stage}</span></div>
      </div>

      <div className="mt-2 pt-1 border-t border-green-800 flex flex-col gap-1">
        <div className="text-amber-300 font-bold">ПОЛІГЛОТНІ ПІДСИСТЕМИ:</div>

        {/* 1. Low-Level WebAssembly Core */}
        <div className="text-[9px]">
          <span className="text-cyan-300 font-bold">1. WAT/WASM Core: </span>
          <span className={wasmStatus.isWasmActive ? 'text-green-300' : 'text-amber-300'}>
            {wasmStatus.statusText}
          </span>
        </div>

        {/* 2. Pascal Scripting Layer */}
        <div className="text-[9px]">
          <span className="text-cyan-300 font-bold">2. Pascal Subsystem: </span>
          <span className="text-green-300">
            Вбудований інтерпретатор Pascal AST (парсить та виконує scripts/stationEconomy.pas)
          </span>
        </div>

        {/* 3. Rust Module */}
        <div className="text-[9px]">
          <span className="text-cyan-300 font-bold">3. Rust Module: </span>
          <span className="text-amber-300">
            {rustBridgeStatus.toolchainStatus}
          </span>
        </div>
      </div>

      <div className="mt-2 pt-1 border-t border-green-800 text-[9px] text-green-500">
        Натисніть F3, щоб сховати цей оверлей.
      </div>
    </div>
  );
};
