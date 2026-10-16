/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameWorldState } from '../types';
import { Volume2, VolumeX, BookOpen, Package, Menu, Activity } from 'lucide-react';
import { audio } from '../engine/audio';

interface HUDProps {
  state: GameWorldState;
  activeInteractionPrompt: string | null;
  onOpenInventory: () => void;
  onOpenMenu: () => void;
  onOpenTutorial: () => void;
  onToggleDebug: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  state,
  activeInteractionPrompt,
  onOpenInventory,
  onOpenMenu,
  onOpenTutorial,
  onToggleDebug,
  isMuted,
  onToggleMute,
}) => {
  const { player, quests } = state;
  const hpRatio = Math.max(0, player.hp / player.maxHp);
  const oxygenRatio = Math.max(0, player.oxygen / player.maxOxygen);
  const isOxygenLow = player.oxygen < 25;

  // Format quest stage description
  const getQuestLabel = (): string => {
    switch (quests.stage) {
      case 'not_started':
      case 'talk_to_clerk':
        return 'Поговоріть з інспектором Корнієнком біля КПП';
      case 'find_technician':
        return 'Знайдіть техніка Нестора на підпалубі';
      case 'gather_parts':
        return 'Зберіть деталі: Фільтр, Холодоагент, Плату';
      case 'repair_subcore':
        return 'Полагодьте оксигенератор або зламайте байпас';
      case 'evidence_found':
        return 'Вирішіть долю компромату (Корпорація / Докери / Контрабандисти)';
      case 'completed_corp':
        return 'Фінал: Угода з Консорціумом укладена';
      case 'completed_syndicate':
        return 'Фінал: Повстання Докерів перемогло';
      case 'completed_smugglers':
        return 'Фінал: Сліди стерто, борги обнулено';
      default:
        return 'Дослідіть сектор станції';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-2 sm:p-4 font-mono">
      {/* Top Bar: Vitals & Utility Controls */}
      <div className="flex items-start justify-between gap-2">
        {/* Left cluster: HP, Oxygen, Credits */}
        <div className="flex flex-col gap-1.5 bg-slate-950/85 border border-cyan-900/60 p-2 sm:p-3 rounded backdrop-blur-none pointer-events-auto shadow-lg max-w-[280px] sm:max-w-xs">
          {/* Health Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-red-400 w-7">HP</span>
            <div className="flex-1 h-3 bg-red-950/70 border border-red-800/80 rounded-sm overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 transition-all duration-150"
                style={{ width: `${hpRatio * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-red-300 tabular-nums">
              {Math.round(player.hp)}/{player.maxHp}
            </span>
          </div>

          {/* Oxygen Reserve Bar */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] sm:text-xs font-bold w-7 ${
                isOxygenLow ? 'text-amber-400 animate-pulse' : 'text-cyan-400'
              }`}
            >
              O2
            </span>
            <div className="flex-1 h-3 bg-cyan-950/70 border border-cyan-800/80 rounded-sm overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  isOxygenLow
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-gradient-to-r from-cyan-600 to-sky-300'
                }`}
                style={{ width: `${oxygenRatio * 100}%` }}
              />
            </div>
            <span
              className={`text-[10px] tabular-nums ${
                isOxygenLow ? 'text-amber-300 font-bold' : 'text-cyan-300'
              }`}
            >
              {Math.round(player.oxygen)}%
            </span>
          </div>

          {/* Credits and Oxygen Debt */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-cyan-900/40 text-slate-300">
            <div>
              <span className="text-amber-400">CR: </span>
              <span className="tabular-nums font-bold text-amber-200">{player.credits}</span>
            </div>
            <div>
              <span className="text-rose-400">Борг O2: </span>
              <span className="tabular-nums font-bold text-rose-300">{player.debt}</span>
            </div>
          </div>
        </div>

        {/* Right cluster: Fast utility buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Вимкнути звук' : 'Увімкнути звук'}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900/90 border border-cyan-800/80 rounded flex items-center justify-center text-cyan-300 hover:bg-cyan-900/40 transition active:scale-95"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button
            onClick={onOpenTutorial}
            aria-label="Довідка керування"
            className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900/90 border border-cyan-800/80 rounded flex items-center justify-center text-cyan-300 hover:bg-cyan-900/40 transition active:scale-95"
          >
            <BookOpen size={18} />
          </button>
          <button
            onClick={onOpenInventory}
            aria-label="Інвентар [I]"
            className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900/90 border border-cyan-800/80 rounded flex items-center justify-center text-cyan-300 hover:bg-cyan-900/40 transition active:scale-95"
          >
            <Package size={18} />
          </button>
          <button
            onClick={onToggleDebug}
            aria-label="Діагностика інженера [F3]"
            className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900/90 border border-cyan-800/80 rounded flex items-center justify-center text-cyan-300 hover:bg-cyan-900/40 transition active:scale-95"
          >
            <Activity size={18} />
          </button>
          <button
            onClick={onOpenMenu}
            aria-label="Меню гри [Esc]"
            className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900/90 border border-cyan-800/80 rounded flex items-center justify-center text-cyan-300 hover:bg-cyan-900/40 transition active:scale-95"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Middle: Active Interaction Prompt (if player stands near terminal/NPC/container) */}
      {activeInteractionPrompt && (
        <button
          onClick={() => inputManager.triggerVirtualButton('interact')}
          className="self-center bg-slate-950/90 border border-cyan-400 px-4 py-2 rounded shadow-cyan-500/20 shadow-lg text-cyan-300 text-xs sm:text-sm font-semibold tracking-wide animate-pulse pointer-events-auto active:scale-95 transition cursor-pointer"
        >
          {activeInteractionPrompt}
        </button>
      )}

      {/* Bottom Area: Quest Tracker Pill */}
      <div className="flex flex-col items-center gap-1 mb-20 sm:mb-2 pointer-events-none">
        <div className="bg-slate-950/80 border border-cyan-900/80 px-3 py-1 rounded text-center text-[11px] sm:text-xs text-slate-200 shadow-md">
          <span className="text-cyan-400 font-bold uppercase tracking-wider">Ціль: </span>
          <span>{getQuestLabel()}</span>
        </div>
        {isOxygenLow && (
          <div className="bg-red-950/90 border border-red-500 text-red-200 px-3 py-0.5 rounded text-[10px] sm:text-xs font-bold animate-bounce">
            УВАГА: КРИТИЧНИЙ ЗАПАС O2! ТАРИФ КРЕДИТУ ПІДВИЩЕНО
          </div>
        )}
      </div>
    </div>
  );
};
