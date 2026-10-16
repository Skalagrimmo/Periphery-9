/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { inputManager } from '../engine/input';
import { Crosshair, Hand, Package } from 'lucide-react';

export const VirtualJoystick: React.FC = () => {
  const stickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const activePointerId = useRef<number | null>(null);

  const maxRadius = 42; // Joystick base radius

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (activePointerId.current !== null) return;
    activePointerId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);

    if (stickRef.current) {
      const rect = stickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, maxRadius);

      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      setKnobPos({ x: kx, y: ky });
      inputManager.setVirtualJoystick(kx / maxRadius, ky / maxRadius);
    }
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== activePointerId.current) return;
    e.preventDefault();

    if (stickRef.current) {
      const rect = stickRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const clampedDist = Math.min(dist, maxRadius);

      const kx = Math.cos(angle) * clampedDist;
      const ky = Math.sin(angle) * clampedDist;

      setKnobPos({ x: kx, y: ky });
      inputManager.setVirtualJoystick(kx / maxRadius, ky / maxRadius);
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerId !== activePointerId.current) return;
    e.preventDefault();
    activePointerId.current = null;
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    inputManager.setVirtualJoystick(0, 0);
  }, []);

  useEffect(() => {
    const handleGlobalUp = () => {
      activePointerId.current = null;
      setIsDragging(false);
      setKnobPos({ x: 0, y: 0 });
      inputManager.setVirtualJoystick(0, 0);
    };
    window.addEventListener('pointerup', handleGlobalUp);
    window.addEventListener('pointercancel', handleGlobalUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalUp);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 bottom-0 pointer-events-none select-none z-20 flex justify-between items-end p-3 sm:p-6 pb-6 touch-none">
      {/* Lower Left: Virtual Analog Joystick */}
      <div
        ref={stickRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-950/70 border-2 border-cyan-500/40 pointer-events-auto flex items-center justify-center relative touch-none shadow-2xl backdrop-blur-none"
      >
        {/* Direction indicators */}
        <div className="absolute top-1 text-[9px] text-cyan-600 font-mono">▲</div>
        <div className="absolute bottom-1 text-[9px] text-cyan-600 font-mono">▼</div>
        <div className="absolute left-1 text-[9px] text-cyan-600 font-mono">◀</div>
        <div className="absolute right-1 text-[9px] text-cyan-600 font-mono">▶</div>

        {/* Center Knob */}
        <div
          className={`w-12 h-12 rounded-full border-2 border-cyan-300 pointer-events-none transition-transform duration-75 ${
            isDragging
              ? 'bg-cyan-500/60 scale-105 shadow-cyan-400/50 shadow-md'
              : 'bg-cyan-800/40'
          }`}
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Lower Right: Big Action Buttons */}
      <div className="flex items-end gap-3 pointer-events-auto touch-none">
        {/* Interact Button [E] */}
        <button
          type="button"
          aria-label="Взаємодія [E]"
          onPointerDown={(e) => {
            e.preventDefault();
            inputManager.triggerVirtualButton('interact');
          }}
          onClick={() => {
            inputManager.triggerVirtualButton('interact');
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 flex flex-col items-center justify-center text-emerald-300 font-mono font-bold active:scale-90 active:bg-emerald-600/50 shadow-lg transition"
        >
          <Hand size={20} />
          <span className="text-[10px] tracking-tight mt-0.5">[E] Дія</span>
        </button>

        {/* Attack Button [Space] */}
        <button
          type="button"
          aria-label="Атака [Пробіл]"
          onPointerDown={(e) => {
            e.preventDefault();
            inputManager.triggerVirtualButton('attack');
          }}
          onClick={() => {
            inputManager.triggerVirtualButton('attack');
          }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-950/85 border-2 border-rose-400 flex flex-col items-center justify-center text-rose-200 font-mono font-bold active:scale-90 active:bg-rose-600/50 shadow-xl transition"
        >
          <Crosshair size={24} />
          <span className="text-[10px] tracking-tight mt-0.5">Різак</span>
        </button>
      </div>
    </div>
  );
};
