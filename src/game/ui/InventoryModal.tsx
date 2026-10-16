/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameWorldState, Item } from '../types';
import { ITEMS } from '../items';
import {
  useInventoryItem,
  removeItemFromInventory,
  addItemToInventory,
  calculateVendorPrice,
} from '../engine/rules';
import { audio } from '../engine/audio';
import { Package, ShoppingBag, X, Zap } from 'lucide-react';

interface InventoryModalProps {
  worldState: GameWorldState;
  isVendorMode?: boolean;
  onClose: () => void;
  onStateChanged: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  worldState,
  isVendorMode = false,
  onClose,
  onStateChanged,
}) => {
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'inventory' | 'vendor'>(
    isVendorMode ? 'vendor' : 'inventory'
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedSlot =
    selectedSlotIdx !== null ? worldState.inventory[selectedSlotIdx] : null;

  const handleUse = (idx: number) => {
    const res = useInventoryItem(worldState, idx);
    setStatusMessage(res.message);
    if (res.success) {
      audio.playPickup();
      onStateChanged();
    }
  };

  const handleDrop = (idx: number) => {
    const slot = worldState.inventory[idx];
    if (!slot) return;
    if (slot.item.category === 'quest') {
      setStatusMessage('Квестовий предмет не можна викинути!');
      return;
    }
    removeItemFromInventory(worldState.inventory, slot.item.id, 1);
    setStatusMessage(`Викинуто: ${slot.item.name}`);
    onStateChanged();
  };

  const handleBuy = (itemId: string, basePrice: number) => {
    const price = calculateVendorPrice(
      basePrice,
      worldState.reputation.corp,
      worldState.reputation.syndicate
    );
    if (worldState.player.credits < price) {
      setStatusMessage('Недостатньо кредитів!');
      return;
    }

    const item = ITEMS[itemId];
    if (!item) return;

    const ok = addItemToInventory(worldState.inventory, item, 1);
    if (!ok) {
      setStatusMessage('Інвентар заповнений!');
      return;
    }

    worldState.player.credits -= price;
    audio.playPickup();
    setStatusMessage(`Придбано: ${item.name} (-${price} CR)`);
    onStateChanged();
  };

  const handleSell = (idx: number) => {
    const slot = worldState.inventory[idx];
    if (!slot) return;
    if (slot.item.category === 'quest') {
      setStatusMessage('Квестові предмети не підлягають перепродажу!');
      return;
    }

    const sellPrice = Math.max(1, Math.round(slot.item.value * 0.7));
    worldState.player.credits += sellPrice;
    removeItemFromInventory(worldState.inventory, slot.item.id, 1);
    audio.playPickup();
    setStatusMessage(`Продано: ${slot.item.name} (+${sellPrice} CR)`);
    onStateChanged();
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-2 sm:p-6 bg-black/70 pointer-events-auto backdrop-blur-none font-mono">
      <div className="w-full max-w-2xl bg-slate-950 border-2 border-cyan-500 rounded-lg shadow-2xl overflow-hidden flex flex-col text-slate-200 max-h-[92vh]">
        {/* Header Tabs */}
        <div className="bg-cyan-950/80 border-b border-cyan-600/70 px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold transition ${
                activeTab === 'inventory'
                  ? 'bg-cyan-600 text-white'
                  : 'text-cyan-300 hover:bg-cyan-900/40'
              }`}
            >
              <Package size={16} />
              <span>Інвентар ({worldState.inventory.length}/12)</span>
            </button>
            {isVendorMode && (
              <button
                onClick={() => setActiveTab('vendor')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold transition ${
                  activeTab === 'vendor'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-300 hover:bg-amber-900/40'
                }`}
              >
                <ShoppingBag size={16} />
                <span>Товари Зоряни</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-amber-300 font-bold tabular-nums">
              Баланс: {worldState.player.credits} CR
            </span>
            <button
              onClick={onClose}
              className="text-cyan-400 hover:text-white p-1 rounded transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div className="bg-cyan-900/60 border-b border-cyan-700/50 px-4 py-1.5 text-xs text-cyan-200 flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab 1: Inventory View */}
        {activeTab === 'inventory' && (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto">
            {/* Left: 12-Slot Grid */}
            <div className="grid grid-cols-4 gap-2 bg-slate-900/80 p-3 rounded border border-cyan-950">
              {Array.from({ length: 12 }).map((_, idx) => {
                const slot = worldState.inventory[idx];
                const isSelected = selectedSlotIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedSlotIdx(idx)}
                    className={`aspect-square rounded border-2 p-1 flex flex-col items-center justify-center relative transition ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/80'
                        : 'border-cyan-900/50 bg-slate-950/60 hover:border-cyan-700'
                    }`}
                  >
                    {slot ? (
                      <>
                        <span className="text-[10px] text-center font-bold text-cyan-200 line-clamp-1 leading-tight">
                          {slot.item.name}
                        </span>
                        {slot.quantity > 1 && (
                          <span className="absolute bottom-1 right-1 bg-cyan-700 text-white text-[9px] px-1 rounded font-bold">
                            x{slot.quantity}
                          </span>
                        )}
                        {slot.item.category === 'quest' && (
                          <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-amber-400" />
                        )}
                      </>
                    ) : (
                      <span className="text-slate-700 text-xs">—</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right: Selected Item Details & Actions */}
            <div className="flex flex-col justify-between bg-slate-900/80 p-4 rounded border border-cyan-950">
              {selectedSlot ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-cyan-300 text-base">
                      {selectedSlot.item.name}
                    </h3>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 uppercase">
                      {selectedSlot.item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed min-h-[50px]">
                    {selectedSlot.item.description}
                  </p>
                  <div className="text-xs text-amber-300 pt-2 border-t border-cyan-900/40">
                    Базова вартість: {selectedSlot.item.value} CR
                  </div>

                  <div className="flex gap-2 pt-4">
                    {selectedSlot.item.category === 'consumable' ||
                    selectedSlot.item.id === 'encrypted_drive' ? (
                      <button
                        onClick={() => handleUse(selectedSlotIdx!)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold text-white transition active:scale-95"
                      >
                        Застосувати
                      </button>
                    ) : null}

                    {isVendorMode && (
                      <button
                        onClick={() => handleSell(selectedSlotIdx!)}
                        className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 rounded text-xs font-bold text-white transition active:scale-95"
                      >
                        Продати ({Math.round(selectedSlot.item.value * 0.7)} CR)
                      </button>
                    )}

                    <button
                      onClick={() => handleDrop(selectedSlotIdx!)}
                      className="py-2 px-3 bg-rose-950 hover:bg-rose-900 border border-rose-700 rounded text-xs text-rose-300 transition active:scale-95"
                    >
                      Викинути
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Виберіть предмет для огляду
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Vendor Shop View */}
        {activeTab === 'vendor' && (
          <div className="p-4 flex flex-col gap-3 overflow-y-auto">
            <div className="text-xs text-amber-200 bg-amber-950/40 border border-amber-800/60 p-2.5 rounded">
              Зоряна: «Тільки перевірений хабар. Знижка діє, якщо ти в добрих стосунках із синдикатом або корпорацією».
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'medkit_stim', basePrice: 40 },
                { id: 'oxygen_tank', basePrice: 30 },
                { id: 'bypass_keycard', basePrice: 80 },
                { id: 'scrubber_filter', basePrice: 110 },
              ].map((shopItem) => {
                const item = ITEMS[shopItem.id];
                if (!item) return null;
                const price = calculateVendorPrice(
                  shopItem.basePrice,
                  worldState.reputation.corp,
                  worldState.reputation.syndicate
                );

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-900 border border-cyan-900/60 rounded flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-200 text-xs sm:text-sm">
                          {item.name}
                        </span>
                        <span className="font-bold text-amber-300 text-xs tabular-nums">
                          {price} CR
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleBuy(item.id, shopItem.basePrice)}
                      className="w-full py-1.5 bg-cyan-700 hover:bg-cyan-600 rounded text-xs font-bold text-white transition active:scale-95"
                    >
                      Купити
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
