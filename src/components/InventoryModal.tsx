import React from 'react';
import { InventoryItem } from '../types/game';
import { X, Sparkles, Shield, Flashlight, Camera, Key, HeartPulse, Hammer, Sword, BatteryCharging, Pickaxe } from 'lucide-react';

interface InventoryModalProps {
  inventory: InventoryItem[];
  selectedSlot: number;
  onSelectSlot: (slot: number) => void;
  onUseItem: (itemId: string) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventory,
  selectedSlot,
  onSelectSlot,
  onUseItem,
  onClose,
}) => {
  const selectedItem = inventory[selectedSlot];

  const getItemIcon = (iconName: string) => {
    switch (iconName) {
      case 'flashlight':
        return <Flashlight className="w-5 h-5 text-amber-400" />;
      case 'camera':
        return <Camera className="w-5 h-5 text-indigo-400" />;
      case 'key':
        return <Key className="w-5 h-5 text-yellow-500" />;
      case 'heart-pulse':
        return <HeartPulse className="w-5 h-5 text-red-500" />;
      case 'hammer':
        return <Hammer className="w-5 h-5 text-amber-600" />;
      case 'sword':
        return <Sword className="w-5 h-5 text-cyan-400" />;
      case 'pickaxe':
        return <Pickaxe className="w-5 h-5 text-emerald-400" />;
      case 'battery-charging':
        return <BatteryCharging className="w-5 h-5 text-lime-400" />;
      default:
        return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  const getItemTypeRussian = (type: string) => {
    switch (type) {
      case 'weapon': return 'ОРУЖИЕ';
      case 'tool': return 'ИНСТРУМЕНТ';
      case 'key': return 'КЛЮЧ';
      case 'consumable': return 'РАСХОДНИК';
      case 'clue': return 'УЛИКА';
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#140f0d] border-4 border-[#3d271d] shadow-2xl p-6 text-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#3d271d] mb-5">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold tracking-widest text-amber-100 title-font uppercase">
              СНАРЯЖЕНИЕ ДЕТЕКТИВА
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-amber-400 hover:text-white border border-amber-900/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inventory Layout */}
        <div className="flex gap-6">
          
          {/* Slots Grid */}
          <div className="w-1/2">
            <h3 className="text-xs font-mono uppercase text-gray-400 mb-2 tracking-wider">
              Ячейки быстрого доступа (1 - 8)
            </h3>
            <div className="grid grid-cols-4 gap-2.5">
              {Array.from({ length: 8 }).map((_, idx) => {
                const item = inventory[idx];
                const isSelected = selectedSlot === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => onSelectSlot(idx)}
                    className={`relative w-16 h-16 border-2 flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-[#2b1b14] shadow-lg ring-1 ring-amber-500/50'
                        : 'border-[#38261e] bg-[#1a1411] hover:border-amber-700/60'
                    }`}
                  >
                    {item ? (
                      <>
                        {getItemIcon(item.icon)}
                        <span className="absolute bottom-1 right-1.5 text-[10px] font-mono text-amber-200 font-bold">
                          {item.quantity ? `x${item.quantity}` : ''}
                        </span>
                        <span className="absolute top-1 left-1.5 text-[10px] font-mono text-gray-500">
                          {idx + 1}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] font-mono text-gray-700">ПУСТО</span>
                        <span className="absolute top-1 left-1.5 text-[10px] font-mono text-gray-500">
                          {idx + 1}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 p-3 bg-[#17110e] border border-[#2e1d16] text-xs font-mono text-gray-400 space-y-1">
              <div>• Нажмите <span className="text-amber-300">[F]</span> — включить/выключить фонарь</div>
              <div>• Нажмите <span className="text-amber-300">[C]</span> — сделать снимок Polaroid</div>
              <div>• Нажмите <span className="text-amber-300">[Пробел / ЛКМ]</span> — удар оружием</div>
            </div>
          </div>

          {/* Item Inspector */}
          <div className="w-1/2 bg-[#17120f] border-2 border-[#3d271d] p-5 flex flex-col justify-between">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 border-b border-[#3d271d] pb-3">
                  <div className="p-3 bg-[#231914] border border-[#482d21]">
                    {getItemIcon(selectedItem.icon)}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 block">
                      КАТЕГОРИЯ: {getItemTypeRussian(selectedItem.type)}
                    </span>
                    <h3 className="text-lg font-bold text-amber-100">
                      {selectedItem.name}
                    </h3>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs uppercase font-mono text-gray-400 tracking-wider">Описание</h4>
                  <p className="text-sm text-gray-300 font-mono mt-1 leading-relaxed bg-[#120d0b] p-3 border border-[#2b1c15]">
                    {selectedItem.description}
                  </p>
                </div>

                {selectedItem.quantity && (
                  <div className="text-xs font-mono text-amber-400">
                    Осталось в наличии: {selectedItem.quantity}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 font-mono text-sm">
                Выберите предмет для осмотра.
              </div>
            )}

            {selectedItem && selectedItem.type === 'consumable' && (
              <button
                onClick={() => onUseItem(selectedItem.id)}
                className="w-full mt-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-bold uppercase tracking-wider text-sm border border-amber-400 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Использовать сейчас
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
