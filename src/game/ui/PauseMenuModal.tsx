/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameWorldState } from '../types';
import { saveGameState, loadGameState, hasSavedGame } from '../engine/saveLoad';
import { Play, Save, Download, RefreshCw, BookOpen, Skull } from 'lucide-react';

interface PauseMenuModalProps {
  isGameOver?: boolean;
  state: GameWorldState;
  onResume: () => void;
  onRestart: () => void;
  onOpenTutorial: () => void;
  onLoadSaved: (loadedState: Partial<GameWorldState>) => void;
}

export const PauseMenuModal: React.FC<PauseMenuModalProps> = ({
  isGameOver = false,
  state,
  onResume,
  onRestart,
  onOpenTutorial,
  onLoadSaved,
}) => {
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const handleSave = () => {
    const ok = saveGameState(state);
    if (ok) {
      setSaveNotice('Гру успішно збережено в пам’яті браузера!');
    } else {
      setSaveNotice('Помилка збереження.');
    }
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleLoad = () => {
    const loaded = loadGameState();
    if (loaded) {
      onLoadSaved(loaded);
      setSaveNotice('Гру завантажено!');
      setTimeout(() => setSaveNotice(null), 2000);
    } else {
      setSaveNotice('Збережень не виявлено.');
      setTimeout(() => setSaveNotice(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-none font-mono pointer-events-auto">
      <div className="w-full max-w-md bg-slate-950 border-2 border-cyan-500 rounded-lg shadow-2xl p-6 flex flex-col items-center text-center gap-4 text-slate-200">
        {isGameOver ? (
          <>
            <div className="p-3 bg-red-950/80 border border-red-500 rounded-full animate-bounce">
              <Skull size={36} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-red-400 tracking-wider">
              БІО-СИГНАЛ ВТРАЧЕНО
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ваш скафандр розгерметизовано в коридорах Периферії-9. Консорціум уже списав залишок ваших кредитів на поховальний збір.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-cyan-300 tracking-wider">
              ПАУЗА — ПЕРИФЕРІЯ-9
            </h2>
            <p className="text-xs text-slate-400">
              Орбітальна станція: Сектор {state.currentMapId}
            </p>
          </>
        )}

        {saveNotice && (
          <div className="w-full bg-cyan-950/90 border border-cyan-500 py-1.5 px-3 rounded text-xs text-cyan-200 animate-pulse">
            {saveNotice}
          </div>
        )}

        <div className="flex flex-col gap-2.5 w-full pt-2">
          {!isGameOver && (
            <button
              onClick={onResume}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Play size={16} />
              <span>[Esc] Продовжити</span>
            </button>
          )}

          {!isGameOver && (
            <button
              onClick={handleSave}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-cyan-800 rounded text-xs sm:text-sm font-bold text-cyan-200 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Save size={16} />
              <span>Зберегти прогрес</span>
            </button>
          )}

          {hasSavedGame() && (
            <button
              onClick={handleLoad}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-cyan-800 rounded text-xs sm:text-sm font-bold text-cyan-200 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Download size={16} />
              <span>Завантажити останнє збереження</span>
            </button>
          )}

          <button
            onClick={onOpenTutorial}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs sm:text-sm text-slate-300 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <BookOpen size={16} />
            <span>Довідка керування</span>
          </button>

          <button
            onClick={onRestart}
            data-start="true"
            className="w-full py-2.5 bg-rose-950 hover:bg-rose-900 border border-rose-700 rounded text-xs sm:text-sm font-bold text-rose-300 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <RefreshCw size={16} />
            <span>Почати заново</span>
          </button>
        </div>
      </div>
    </div>
  );
};
