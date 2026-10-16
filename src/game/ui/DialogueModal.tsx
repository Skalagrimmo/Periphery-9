/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DialogueNode, GameWorldState, NPC } from '../types';
import { getDialogueNodes } from '../dialogue/dialogueData';
import { audio } from '../engine/audio';

interface DialogueModalProps {
  npc: NPC;
  currentNodeId: string;
  worldState: GameWorldState;
  onSelectChoice: (nodeId?: string) => void;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  currentNodeId,
  worldState,
  onSelectChoice,
  onClose,
}) => {
  const dialogueNodes = getDialogueNodes();
  const node: DialogueNode | undefined = dialogueNodes[currentNodeId];

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Typewriter effect
  useEffect(() => {
    if (!node) return;
    setDisplayedText('');
    setIsTyping(true);

    let charIdx = 0;
    const fullText = node.text;

    const interval = setInterval(() => {
      if (charIdx < fullText.length) {
        setDisplayedText((prev) => prev + fullText[charIdx]);
        if (charIdx % 3 === 0) {
          audio.playDialogBeep();
        }
        charIdx++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [currentNodeId, node]);

  if (!node) return null;

  // Filter choices by condition
  const availableChoices = node.choices.filter((choice) => {
    if (!choice.condition) return true;
    return choice.condition(worldState);
  });

  const handleChoiceClick = (choiceIdx: number) => {
    const choice = availableChoices[choiceIdx];
    if (!choice) return;

    if (choice.action) {
      choice.action(worldState);
    }

    if (choice.nextNodeId) {
      onSelectChoice(choice.nextNodeId);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center p-2 sm:p-6 bg-black/60 pointer-events-auto backdrop-blur-none font-mono">
      <div className="w-full max-w-2xl bg-slate-950 border-2 border-cyan-500 rounded-lg shadow-2xl overflow-hidden flex flex-col relative text-slate-200">
        {/* Terminal Header */}
        <div className="bg-cyan-950/80 border-b border-cyan-600/70 px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold text-cyan-300 uppercase tracking-wider">{npc.name}</span>
            <span className="text-cyan-600">|</span>
            <span className="text-slate-400 text-[11px]">{npc.role}</span>
          </div>
          <button
            onClick={onClose}
            className="text-cyan-400 hover:text-white px-2 py-0.5 border border-cyan-700/50 rounded text-xs transition"
          >
            [Esc] Закрити
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex flex-col gap-4">
          {/* Text panel with retro terminal styling */}
          <div
            onClick={() => {
              if (isTyping) {
                setDisplayedText(node.text);
                setIsTyping(false);
              }
            }}
            className="min-h-[70px] sm:min-h-[85px] bg-slate-900/90 border border-cyan-900 p-3 sm:p-4 rounded text-sm sm:text-base leading-relaxed text-cyan-100 cursor-pointer select-none"
          >
            {displayedText}
            {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse" />}
          </div>

          {/* Choice Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            {availableChoices.length === 0 ? (
              <button
                onClick={onClose}
                className="w-full text-left p-3 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800 hover:border-cyan-400 rounded text-cyan-300 text-xs sm:text-sm font-semibold transition flex items-center justify-between"
              >
                <span>[1] Завершити розмову</span>
                <span className="text-[10px] text-cyan-500">▶</span>
              </button>
            ) : (
              availableChoices.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoiceClick(idx)}
                  className={`w-full text-left p-3 border rounded text-xs sm:text-sm font-semibold transition flex items-center justify-between active:scale-[0.99] ${
                    c.outcomeEnding
                      ? 'bg-rose-950/60 border-rose-500/80 text-rose-200 hover:bg-rose-900/60'
                      : 'bg-slate-900 hover:bg-cyan-950/60 border-cyan-800 hover:border-cyan-400 text-cyan-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">[{idx + 1}]</span>
                    <span>{c.text}</span>
                  </div>
                  <span className="text-[10px] text-cyan-500">▶</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
