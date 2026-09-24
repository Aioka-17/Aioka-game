import React, { useState } from 'react';
import { X, Save, Upload, RotateCcw, Volume2, VolumeX, Keyboard, Music } from 'lucide-react';
import { sound } from '../game/audio';

interface PauseMenuProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onSave: () => void;
  onLoad: () => void;
  onNewGame: () => void;
  onClose: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isMuted: _isMuted,
  onToggleMute: _onToggleMute,
  onSave,
  onLoad,
  onNewGame,
  onClose,
}) => {
  const [musicMuted, setMusicMuted] = useState<boolean>(sound.getMusicMuted());
  const [musicVolume, setMusicVolume] = useState<number>(sound.getMusicVolume());
  const [sfxMuted, setSfxMuted] = useState<boolean>(sound.getSfxMuted());
  const [sfxVolume, setSfxVolume] = useState<number>(sound.getSfxVolume());

  const handleToggleMusic = () => {
    const next = sound.toggleMusicMute();
    setMusicMuted(next);
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    sound.setMusicVolume(val);
    setMusicVolume(val);
    if (musicMuted && val > 0) {
      sound.setMusicMuted(false);
      setMusicMuted(false);
    }
  };

  const handleToggleSfx = () => {
    const next = sound.toggleSfxMute();
    setSfxMuted(next);
  };

  const handleSfxVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    sound.setSfxVolume(val);
    setSfxVolume(val);
    if (sfxMuted && val > 0) {
      sound.setSfxMuted(false);
      setSfxMuted(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#140f0d] border-4 border-[#3d271d] shadow-2xl p-6 text-gray-200 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#3d271d] mb-4">
          <h2 className="text-xl font-bold tracking-widest text-amber-100 title-font uppercase">
            СИСТЕМНОЕ МЕНЮ
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-amber-400 hover:text-white border border-amber-900/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Settings Panel */}
        <div className="bg-[#1a120f] border border-[#3d271d] p-4 mb-4 space-y-3.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#2e1d16]">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
              <Music className="w-4 h-4 text-amber-500" />
              <span>Настройки фоновой музыки</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 italic">
              "Being Watched by Aioka"
            </span>
          </div>

          {/* Music Toggle & Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <button
                onClick={handleToggleMusic}
                className={`flex items-center space-x-1.5 px-2.5 py-1 border text-xs font-mono font-bold transition-colors ${
                  musicMuted
                    ? 'bg-red-950/60 border-red-700/70 text-red-300'
                    : 'bg-emerald-950/60 border-emerald-700/70 text-emerald-300'
                }`}
              >
                {musicMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{musicMuted ? 'МУЗЫКА ВЫКЛ' : 'МУЗЫКА ВКЛ'}</span>
              </button>
              <span className="text-amber-200 font-mono">
                {musicMuted ? 'ОТКЛЮЧЕНО' : `${Math.round(musicVolume * 100)}%`}
              </span>
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <span className="text-[11px] text-gray-400 font-mono">Громкость музыки:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={musicMuted ? 0 : musicVolume}
                onChange={handleMusicVolumeChange}
                className="w-full h-1.5 bg-[#2a1a14] rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* SFX / Ambient Sound Controls */}
          <div className="pt-2 border-t border-[#2e1d16] space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <button
                onClick={handleToggleSfx}
                className={`flex items-center space-x-1.5 px-2.5 py-1 border text-xs font-mono font-bold transition-colors ${
                  sfxMuted
                    ? 'bg-red-950/60 border-red-700/70 text-red-300'
                    : 'bg-[#261b16] border-[#482d21] text-gray-300'
                }`}
              >
                {sfxMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{sfxMuted ? 'ЗВУКИ ВЫКЛ' : 'ЗВУКИ ВКЛ'}</span>
              </button>
              <span className="text-gray-300 font-mono">
                {sfxMuted ? 'ОТКЛЮЧЕНО' : `${Math.round(sfxVolume * 100)}%`}
              </span>
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <span className="text-[11px] text-gray-400 font-mono">Громкость эффектов:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sfxMuted ? 0 : sfxVolume}
                onChange={handleSfxVolumeChange}
                className="w-full h-1.5 bg-[#2a1a14] rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 mb-5">
          <button
            onClick={() => {
              onSave();
            }}
            className="w-full py-2.5 bg-[#1e293b] hover:bg-[#2b3a52] border border-blue-500 text-blue-200 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Сохранить игру (Локально)
          </button>

          <button
            onClick={() => {
              onLoad();
              onClose();
            }}
            className="w-full py-2.5 bg-[#1f1713] hover:bg-[#2e1d16] border border-amber-600 text-amber-200 font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Загрузить сохранение
          </button>

          <button
            onClick={() => {
              if (confirm('Начать новое расследование? Весь несохранённый прогресс будет сброшен.')) {
                onNewGame();
                onClose();
              }
            }}
            className="w-full py-2 bg-red-950/40 hover:bg-red-900/50 border border-red-700/60 text-red-300 font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Начать заново
          </button>
        </div>

        {/* Controls Reference */}
        <div className="bg-[#0e0c0b] border border-[#2b1c15] p-3 text-[11px] font-mono text-gray-300 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase mb-1 border-b border-[#241711] pb-1">
            <Keyboard className="w-3.5 h-3.5" />
            Управление в игре
          </div>
          <div className="grid grid-cols-2 gap-y-1 gap-x-3">
            <div><span className="text-amber-300 font-bold">A / D:</span> Движение влево / вправо</div>
            <div><span className="text-amber-300 font-bold">W / Пробел:</span> Прыжок / Подъём</div>
            <div><span className="text-amber-300 font-bold">Shift:</span> Бег (Спринт)</div>
            <div><span className="text-amber-300 font-bold">Q / E:</span> Войти / Дверь / Действие</div>
            <div><span className="text-amber-300 font-bold">ЛКМ / Пробел:</span> Атака (Меч / Бита)</div>
            <div><span className="text-amber-300 font-bold">F:</span> Вкл/Выкл фонарик</div>
            <div><span className="text-amber-300 font-bold">C:</span> Вспышка Polaroid</div>
            <div><span className="text-amber-300 font-bold">I / J / Esc:</span> Инвентарь / Дело / Меню</div>
          </div>
        </div>

      </div>
    </div>
  );
};
