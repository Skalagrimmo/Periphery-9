/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EndingOutcome, GameWorldState } from '../types';
import { Award, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface EndingModalProps {
  outcome: EndingOutcome;
  state: GameWorldState;
  onRestart: () => void;
  onContinueExploring: () => void;
}

export const EndingModal: React.FC<EndingModalProps> = ({
  outcome,
  state,
  onRestart,
  onContinueExploring,
}) => {
  if (!outcome) return null;

  const getContent = () => {
    switch (outcome) {
      case 'corp':
        return {
          title: 'ФІНАЛ I: КОРПОРАТИВНИЙ КОНТРАКТ',
          icon: <Award size={36} className="text-amber-400" />,
          color: 'border-amber-500 text-amber-200',
          desc: 'Ви передали компромат інспектору Корнієнку. Керівництво Консорціуму О2 знищило первинні логи, а інженера Нестора офіційно визнано єдиним винуватцем аварії. Ваша нагорода — 1000 кредитів та персональний сертифікат необмеженого дихання. Докери продовжують працювати у дві зміни, сплачуючи потрійний відсоток за кожен подих.',
          moral: '«На Периферії-9 немає справедливості. Є лише баланс на рахунку».',
        };
      case 'syndicate':
        return {
          title: 'ФІНАЛ II: ПОВСТАННЯ СИНДИКАТУ',
          icon: <ShieldAlert size={36} className="text-rose-500" />,
          color: 'border-rose-500 text-rose-200',
          desc: 'Бригадир Тарас транслював викрадені записи дирекції на всі екрани станції. Докери перекрили головні шлюзи, заблокували сили безпеки й оголосили станцію самоврядною комуною. Кисневий борг анульовано для всіх жителів, рециркулятор переведено в спільне управління. Корпоративний флот уже оголосив блокаду сектора, але цієї ночі станція дихає на повні груди.',
          moral: '«Повітря належить тим, хто тримає станцію на плаву».',
        };
      case 'smugglers':
        return {
          title: 'ФІНАЛ III: ТІНЬОВИЙ КОМПРОМІС',
          icon: <Sparkles size={36} className="text-cyan-400" />,
          color: 'border-cyan-500 text-cyan-200',
          desc: 'Разом із Нестором та Зоряною ви завантажили вірус-чистильник у центральний вузол зв’язку. Логи знищено, Нестор зник на контрабандному човнику, а в системі бухгалтерського обліку стався критичний збій, що списав половину боргів населення. Консорціум не може довести саботаж, докери не мають доказів для війни. Хитка рівновага збережена.',
          moral: '«Найкраща угода — та, про яку ніхто так і не дізнався».',
        };
      default:
        return {
          title: 'ЕПІЛОГ',
          icon: null,
          color: 'border-slate-500 text-slate-200',
          desc: '',
          moral: '',
        };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-none font-mono pointer-events-auto">
      <div
        className={`w-full max-w-xl bg-slate-950 border-2 ${content.color} rounded-lg shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-5`}
      >
        <div className="p-3 rounded-full bg-slate-900 border border-slate-700">
          {content.icon}
        </div>

        <h2 className="text-xl sm:text-2xl font-bold tracking-wider">{content.title}</h2>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-left bg-slate-900/80 p-4 rounded border border-slate-800">
          {content.desc}
        </p>

        <p className="text-xs italic text-cyan-400 font-semibold">{content.moral}</p>

        {/* Run Stats */}
        <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-slate-800 text-xs">
          <div className="bg-slate-900 p-2 rounded">
            <div className="text-slate-400 text-[10px]">Фінальні кредити</div>
            <div className="text-amber-300 font-bold tabular-nums text-sm">
              {state.player.credits} CR
            </div>
          </div>
          <div className="bg-slate-900 p-2 rounded">
            <div className="text-slate-400 text-[10px]">Залишок боргу</div>
            <div className="text-rose-400 font-bold tabular-nums text-sm">
              {state.player.debt} CR
            </div>
          </div>
          <div className="bg-slate-900 p-2 rounded">
            <div className="text-slate-400 text-[10px]">Час у грі</div>
            <div className="text-cyan-300 font-bold tabular-nums text-sm">
              {Math.round(state.gameTime)} с
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full pt-3">
          <button
            onClick={onRestart}
            data-start="true"
            className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-500 rounded text-xs sm:text-sm font-bold text-white transition flex items-center justify-center gap-2 active:scale-95"
          >
            <RefreshCw size={16} />
            <span>Грати спочатку</span>
          </button>
          <button
            onClick={onContinueExploring}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs sm:text-sm font-bold text-slate-200 transition active:scale-95"
          >
            Продовжити дослідження
          </button>
        </div>
      </div>
    </div>
  );
};
