/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, X, Crosshair, Hand, Shield, Wind } from 'lucide-react';

interface ControlsTutorialModalProps {
  onClose: () => void;
}

export const ControlsTutorialModal: React.FC<ControlsTutorialModalProps> = ({
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-none font-mono pointer-events-auto">
      <div className="w-full max-w-xl bg-slate-950 border-2 border-cyan-500 rounded-lg shadow-2xl p-5 sm:p-6 flex flex-col text-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-900/60">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-cyan-400" />
            <h2 className="font-bold text-sm sm:text-base text-cyan-200">
              ДОВІДКА ВИЖИВАННЯ: «ПЕРИФЕРІЯ-9»
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-white p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 py-4 text-xs sm:text-sm">
          {/* Controls Section */}
          <div className="bg-slate-900/80 p-3 rounded border border-cyan-950 flex flex-col gap-2">
            <h3 className="font-bold text-cyan-300 flex items-center gap-1.5">
              <span>🎮 Керування:</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] sm:text-xs text-slate-300">
              <div>
                <span className="text-cyan-400 font-bold">WASD / Стрілки:</span> Рух у 8 напрямках
              </div>
              <div>
                <span className="text-cyan-400 font-bold">Пробіл / Кнопка «Різак»:</span> Удар плазмовим різаком
              </div>
              <div>
                <span className="text-cyan-400 font-bold">[E] / Кнопка «Дія»:</span> Взаємодія (НПС, ящики, термінали)
              </div>
              <div>
                <span className="text-cyan-400 font-bold">[I] / Кнопка «Рюкзак»:</span> Інвентар та торгівля
              </div>
              <div>
                <span className="text-cyan-400 font-bold">[Esc] / Меню:</span> Пауза, збереження та перезапуск
              </div>
              <div>
                <span className="text-cyan-400 font-bold">[F3]:</span> Діагностичний оверлей інженера
              </div>
            </div>
            <p className="text-[10px] text-slate-400 pt-1 italic">
              * На сенсорних екранах доступний віртуальний джойстик ліворуч і кнопки дій праворуч.
            </p>
          </div>

          {/* Atmosphere & Debt */}
          <div className="bg-slate-900/80 p-3 rounded border border-cyan-950 flex flex-col gap-2">
            <h3 className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Wind size={16} className="text-cyan-400" />
              <span>Кисень у кредит:</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              На орбітальній станції все приватизовано. Кожен вдих тарифікується згідно з поправками Консорціуму О2. Якщо шкала кисню опускається до нуля або ви знаходитесь в аварійній підпалубі, лічильник боргу зростає вдвічі швидше. Використовуйте балони O2, щоб відновити запаси.
            </p>
          </div>

          {/* Quests & Consequences */}
          <div className="bg-slate-900/80 p-3 rounded border border-cyan-950 flex flex-col gap-2">
            <h3 className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Shield size={16} className="text-amber-400" />
              <span>Фракції та роздоріжжя:</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              Дослідіть Доки, Базар та Підпалубу. Знайдіть деталі рециркулятора та викрадіть телеметрію штучного перекриття клапанів. Тільки ви вирішуєте, кому дістанеться правда: корпоративним клеркам, повсталим докерам чи вільним контрабандистам.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 rounded text-xs sm:text-sm font-bold text-white transition active:scale-95"
        >
          Зрозуміло, до гри!
        </button>
      </div>
    </div>
  );
};
