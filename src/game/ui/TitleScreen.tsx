/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Play, Sparkles, BookOpen } from 'lucide-react';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenTutorial: () => void;
  hasSave: boolean;
  onContinue: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenTutorial,
  hasSave,
  onContinue,
}) => {
  // Key listener for Space/Enter to start game
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStartGame]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-12 bg-slate-950 font-mono text-slate-100 select-none overflow-hidden">
      {/* Background Starfield and Station Silhouette */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-cyan-600/20 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-rose-600/15 blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(56, 189, 248, 0.12) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Top Header / Kicker */}
      <div className="relative z-10 flex flex-col items-center gap-1 text-center pt-4">
        <div className="text-[10px] sm:text-xs uppercase tracking-widest text-cyan-400 font-bold border border-cyan-800/60 px-3 py-1 rounded bg-slate-900/80">
          Орбітальний сектор 9 · Консорціум Життєзабезпечення
        </div>
      </div>

      {/* Center Lockup: Title & Emblem */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center max-w-xl">
        {/* Bespoke Sci-Fi Orbital Station Emblem */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 text-cyan-400 animate-pulse">
          <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="#0ea5e9"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <circle cx="40" cy="40" r="22" stroke="#38bdf8" strokeWidth="1.5" />
            <polygon
              points="40,16 48,34 32,34"
              fill="#38bdf8"
              opacity="0.9"
            />
            <rect x="37" y="34" width="6" height="24" fill="#38bdf8" />
            <circle cx="40" cy="40" r="5" fill="#f43f5e" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-100 to-cyan-400 drop-shadow-[0_2px_10px_rgba(6,182,212,0.5)]">
          ПЕРИФЕРІЯ-9
        </h1>
        <div className="text-sm sm:text-base text-rose-400 font-bold tracking-widest uppercase">
          КИСЕНЬ У КРЕДИТ
        </div>

        <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed px-2">
          ШІ контролює атмосферу. Корпоративні алгоритми тарифікують кожен подих. Зламаний оксигенератор загрожує життю докерів, а в надрах станції приховано докази штучного дефіциту.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm pt-4">
          {hasSave && (
            <button
              onClick={onContinue}
              className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 rounded text-xs sm:text-sm font-bold text-white transition active:scale-95 border border-cyan-400 shadow-lg"
            >
              Продовжити збережену гру
            </button>
          )}

          <button
            onClick={onStartGame}
            data-start="true"
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 rounded text-xs sm:text-sm font-bold text-slate-950 transition active:scale-95 shadow-cyan-500/30 shadow-lg flex items-center justify-center gap-2"
          >
            <Play size={16} />
            <span>{hasSave ? 'Почати нову гру' : 'Почати гру [Пробіл / Enter]'}</span>
          </button>
        </div>

        <button
          onClick={onOpenTutorial}
          className="text-xs text-cyan-400 hover:text-cyan-200 transition underline underline-offset-4 pt-1 flex items-center gap-1.5"
        >
          <BookOpen size={14} />
          <span>Довідка керування та лор</span>
        </button>
      </div>

      {/* Bottom Safe Margin Control Hint */}
      <div className="relative z-10 text-[11px] sm:text-xs text-slate-400 text-center tracking-wide">
        WASD Рух · Пробіл Різак · [E] Дія · [I] Інвентар · [Esc] Меню · [F3] Діагностика
      </div>
    </div>
  );
};
