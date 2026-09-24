import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import { PlayerStats, TimeOfDay, InteractiveObject, NPC } from '../types/game';
import { sound } from '../game/audio';
import { 
  Heart, 
  Zap, 
  Flashlight, 
  FolderArchive, 
  Briefcase, 
  Menu, 
  Volume2, 
  VolumeX, 
  Compass, 
  Clock, 
  Eye, 
  Camera, 
  Hammer,
  Music,
  ChevronLeft,
  ChevronRight,
  ArrowUp
} from 'lucide-react';

interface GameCanvasProps {
  onOpenCaseFile: () => void;
  onOpenInventory: () => void;
  onOpenPauseMenu: () => void;
  onTriggerDialogue: (npc: NPC) => void;
  onTriggerPuzzle: (puzzleType: 'keypad' | 'generator' | 'symbols' | 'camera', obj: InteractiveObject) => void;
  onTriggerEnding: (endingId: number) => void;
  onEngineReady?: (engine: GameEngine) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onOpenCaseFile,
  onOpenInventory,
  onOpenPauseMenu,
  onTriggerDialogue,
  onTriggerPuzzle,
  onTriggerEnding,
  onEngineReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // HUD States
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [timeStr, setTimeStr] = useState<string>('12:00');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [interactPrompt, setInteractPrompt] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [musicMuted, setMusicMuted] = useState<boolean>(sound.getMusicMuted());
  const [musicVolume, setMusicVolume] = useState<number>(sound.getMusicVolume());
  const [showVolumePopup, setShowVolumePopup] = useState<boolean>(false);
  const [showMobileControls, setShowMobileControls] = useState<boolean>(false);

  // Resize canvas handler
  const handleResize = useCallback(() => {
    if (canvasRef.current && engineRef.current) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      engineRef.current.setSize(w, h);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Check touch device
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setShowMobileControls(true);
    }

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    handleResize();
    window.addEventListener('resize', handleResize);

    // Bind engine callbacks
    engine.onStatsChange = (newStats, newTimeStr, newTimeOfDay) => {
      setStats(newStats);
      setTimeStr(newTimeStr);
      setTimeOfDay(newTimeOfDay);
    };

    engine.onInteractPromptChange = (prompt) => {
      setInteractPrompt(prompt);
    };

    engine.onDialogueTrigger = (npc) => {
      onTriggerDialogue(npc);
    };

    engine.onPuzzleTrigger = (pType, obj) => {
      onTriggerPuzzle(pType as any, obj);
    };

    engine.onEndingTrigger = (eid) => {
      onTriggerEnding(eid);
    };

    engine.onNotification = (msg) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 3500);
    };

    if (onEngineReady) {
      onEngineReady(engine);
    }

    // Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid hotkey captures if in input
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft') engine.keys.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') engine.keys.right = true;
      if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
        engine.keys.jump = true;
        engine.keys.up = true;
      }
      if (code === 'KeyS' || code === 'ArrowDown') engine.keys.down = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') engine.keys.sprint = true;

      if (code === 'KeyE' || code === 'KeyQ') {
        // [Q] or [E] to enter room / interact with door / search / talk
        const entered = engine.handleEnterRoom();
        if (!entered && code === 'KeyE') {
          engine.handleInteract();
        } else if (!entered && code === 'KeyQ') {
          // If not right by door, fallback to general interaction
          engine.handleInteract();
        }
      }
      if (code === 'KeyF') {
        engine.toggleFlashlight();
      }
      if (code === 'KeyC') {
        engine.useCamera();
      }
      if (code === 'KeyI') {
        onOpenInventory();
      }
      if (code === 'KeyJ') {
        onOpenCaseFile();
      }
      if (code === 'Escape') {
        onOpenPauseMenu();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyA' || code === 'ArrowLeft') engine.keys.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') engine.keys.right = false;
      if (code === 'KeyW' || code === 'ArrowUp' || code === 'Space') {
        engine.keys.jump = false;
        engine.keys.up = false;
      }
      if (code === 'KeyS' || code === 'ArrowDown') engine.keys.down = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') engine.keys.sprint = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Left click attacks/swings
      if (e.button === 0 && !(e.target as HTMLElement).closest('button')) {
        engine.swingWeapon();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);

    // Start engine loop
    engine.start();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      engine.stop();
    };
  }, [handleResize, onOpenCaseFile, onOpenInventory, onOpenPauseMenu, onTriggerDialogue, onTriggerPuzzle, onTriggerEnding, onEngineReady]);

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    setMusicMuted(sound.getMusicMuted());
  };

  const handleToggleMusic = () => {
    const next = sound.toggleMusicMute();
    setMusicMuted(next);
    setIsMuted(sound.getMuted());
  };

  const handleMusicVolumeChange = (newVol: number) => {
    sound.setMusicVolume(newVol);
    setMusicVolume(newVol);
    if (musicMuted && newVol > 0) {
      sound.setMusicMuted(false);
      setMusicMuted(false);
    }
  };

  const getTimeOfDayColor = () => {
    switch (timeOfDay) {
      case 'day': return 'bg-sky-500/20 text-sky-300 border-sky-600';
      case 'sunset': return 'bg-amber-500/20 text-amber-300 border-amber-600';
      case 'night': return 'bg-indigo-950/80 text-indigo-300 border-indigo-700';
      case 'midnight': return 'bg-red-950/80 text-red-400 border-red-600 animate-pulse';
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      
      {/* 2D Pixel Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />

      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 crt-overlay pointer-events-none" />

      {/* TOP LEFT: HEALTH & STAMINA HUD */}
      <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 pointer-events-none">
        
        {/* Health Bar */}
        <div className="flex items-center space-x-2 bg-black/75 px-3 py-1.5 border border-[#3d271d] backdrop-blur-sm">
          <Heart className="w-4 h-4 text-red-500 fill-red-500 shrink-0" />
          <div className="w-36 h-3 bg-red-950/60 border border-red-900/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-150"
              style={{ width: `${Math.max(0, Math.min(100, stats?.health ?? 100))}%` }}
            />
          </div>
          <span className="text-xs font-mono text-red-300 font-bold w-12 text-right">
            {Math.round(stats?.health ?? 100)} HP
          </span>
        </div>

        {/* Stamina Bar */}
        <div className="flex items-center space-x-2 bg-black/75 px-3 py-1.5 border border-[#3d271d] backdrop-blur-sm">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
          <div className="w-36 h-3 bg-amber-950/60 border border-amber-900/80 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-75"
              style={{ width: `${Math.max(0, Math.min(100, stats?.stamina ?? 100))}%` }}
            />
          </div>
          <span className="text-xs font-mono text-amber-300 font-bold w-12 text-right">
            {Math.round(stats?.stamina ?? 100)}%
          </span>
        </div>

        {/* Flashlight Battery Indicator */}
        <div className="flex items-center space-x-2 bg-black/75 px-3 py-1 border border-[#3d271d] backdrop-blur-sm">
          <Flashlight className={`w-3.5 h-3.5 ${stats?.flashlightOn ? 'text-yellow-400' : 'text-gray-500'}`} />
          <div className="w-24 h-1.5 bg-yellow-950/40 border border-yellow-800/40 overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-150"
              style={{ width: `${Math.max(0, Math.min(100, stats?.flashlightBattery ?? 100))}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-yellow-300">
            {stats?.flashlightOn ? 'ВКЛ' : 'ВЫКЛ'} [F]
          </span>
        </div>

        {/* Equipped Weapon & Keys Indicator */}
        <div className="flex items-center space-x-2 bg-black/75 px-3 py-1 border border-[#3d271d] backdrop-blur-sm">
          <Hammer className={`w-3.5 h-3.5 ${stats?.equippedWeapon === 'sword' ? 'text-amber-400' : 'text-gray-400'}`} />
          <span className="text-[11px] font-mono text-gray-200">
            {stats?.equippedWeapon === 'sword' ? 'Старинный меч [ЛКМ]' : 'Бейсбольная бита [ЛКМ]'}
          </span>
        </div>
      </div>

      {/* TOP CENTER: STRICT DAY / NIGHT TIMER */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className={`flex flex-col items-center px-5 py-1.5 border-2 backdrop-blur-md shadow-2xl transition-all ${
          engineRef.current?.phase === 'NIGHT'
            ? 'bg-red-950/90 border-red-500 text-red-200 ring-2 ring-red-600/40 animate-pulse'
            : (engineRef.current?.phaseRemainingSeconds ?? 300) <= 30
              ? 'bg-amber-950/90 border-amber-400 text-amber-200 ring-2 ring-amber-500/50 animate-pulse'
              : 'bg-black/85 border-[#3d271d] text-amber-100'
        }`}>
          <div className="flex items-center space-x-1 text-[10px] tracking-widest font-black uppercase">
            <Clock className={`w-3 h-3 ${engineRef.current?.phase === 'NIGHT' ? 'text-red-400' : 'text-amber-400'}`} />
            <span className={engineRef.current?.phase === 'NIGHT' ? 'text-red-400' : 'text-amber-400'}>
              {engineRef.current?.phase === 'NIGHT' 
                ? 'НОЧНОЕ ВЫЖИВАНИЕ' 
                : (engineRef.current?.phaseRemainingSeconds ?? 300) <= 30
                  ? 'ПРИБЛИЖАЮТСЯ СУМЕРКИ'
                  : 'ДНЕВНОЕ РАССЛЕДОВАНИЕ'}
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black font-mono tracking-widest">
            {timeStr}
          </span>
        </div>
      </div>

      {/* TOP RIGHT: TIME, LOCATION & QUICK ACTION BUTTONS */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-3">
        
        {/* Location Display */}
        <div className="hidden sm:flex items-center space-x-3 bg-black/80 px-4 py-2 border border-[#3d271d] backdrop-blur-sm">
          <div className="flex items-center space-x-1.5 text-xs text-amber-300 font-mono">
            <Compass className="w-4 h-4 text-amber-500" />
            <span className="uppercase font-bold tracking-wider">
              {engineRef.current?.currentWorld.name || 'Шепчущие Сосны'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {/* Case File [J] */}
          <button
            onClick={onOpenCaseFile}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#211612] hover:bg-amber-900/60 border border-amber-700/80 text-amber-200 text-xs font-mono font-bold tracking-wider transition-colors shadow-md"
            title="Открыть материалы дела (J)"
          >
            <FolderArchive className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">ДЕЛО [J]</span>
          </button>

          {/* Inventory [I] */}
          <button
            onClick={onOpenInventory}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#211612] hover:bg-amber-900/60 border border-amber-700/80 text-amber-200 text-xs font-mono font-bold tracking-wider transition-colors shadow-md"
            title="Открыть инвентарь (I)"
          >
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">РЮКЗАК [I]</span>
          </button>

          {/* Music Control & Volume Slider Button */}
          <div className="relative flex items-center">
            <button
              onClick={handleToggleMusic}
              className={`flex items-center space-x-1.5 px-3 py-2 border font-mono text-xs font-bold tracking-wider transition-colors shadow-md ${
                musicMuted
                  ? 'bg-red-950/70 border-red-700/80 text-red-300'
                  : 'bg-[#211612] hover:bg-amber-900/60 border-amber-700/80 text-amber-200'
              }`}
              title="Музыка ВКЛ/ВЫКЛ"
            >
              {musicMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span className="hidden lg:inline">{musicMuted ? 'МУЗЫКА ВЫКЛ' : 'МУЗЫКА ВКЛ'}</span>
            </button>

            {/* Quick Volume Slider Popover Toggle */}
            <button
              onClick={() => setShowVolumePopup(!showVolumePopup)}
              className={`p-2 border-y border-r border-[#3d271d] transition-colors ${
                showVolumePopup ? 'bg-amber-950 text-amber-200' : 'bg-black/80 hover:bg-gray-800 text-gray-300'
              }`}
              title="Громкость музыки и информация"
            >
              <Music className="w-4 h-4 text-amber-400" />
            </button>

            {/* Volume Popover */}
            {showVolumePopup && (
              <div className="absolute right-0 top-12 z-30 w-64 bg-[#140f0d] border-2 border-amber-700/90 p-3 shadow-2xl space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-amber-300 font-bold border-b border-[#2e1d16] pb-1">
                  <span>ГРОМКОСТЬ МУЗЫКИ</span>
                  <span>{musicMuted ? 'ОТКЛ' : `${Math.round(musicVolume * 100)}%`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={musicMuted ? 0 : musicVolume}
                  onChange={(e) => handleMusicVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-[#2a1a14] rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="text-[10px] text-gray-400 leading-tight pt-1 border-t border-[#2e1d16]/80 mt-1">
                  <div className="text-amber-400 font-bold">Трек: "{sound.trackTitle}"</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">
                    {sound.isUsingProceduralMusic()
                      ? 'Активен процедурный синтезатор (пианино/хоррор-дрон). Поместите background-music.mp3 в public/audio/ для своего трека.'
                      : 'Воспроизводится оригинальный MP3 файл.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sound Synthesizer Mute Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2 bg-black/80 hover:bg-gray-800 border border-[#3d271d] text-gray-300 transition-colors"
            title="Toggle All Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Pause Menu [Esc] */}
          <button
            onClick={onOpenPauseMenu}
            className="p-2 bg-black/80 hover:bg-gray-800 border border-[#3d271d] text-gray-300 transition-colors"
            title="Menu & Settings"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* CENTER: INTERACTION PROMPT */}
      {interactPrompt && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-bounce">
          <div className="bg-[#1b120f]/90 border-2 border-amber-500 px-6 py-2 shadow-2xl backdrop-blur-sm">
            <span className="text-sm font-mono text-amber-200 font-bold uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
              {interactPrompt}
            </span>
          </div>
        </div>
      )}

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#120a07]/95 border-2 border-amber-600 px-6 py-3 shadow-2xl backdrop-blur-md">
            <span className="text-sm font-mono text-amber-100 font-bold uppercase tracking-wide">
              {notification}
            </span>
          </div>
        </div>
      )}

      {/* BOTTOM QUICKBAR & SHORTCUT HINTS */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center space-x-2 bg-black/80 p-2 border border-[#3d271d] backdrop-blur-sm">
        <button
          onClick={() => engineRef.current?.toggleFlashlight()}
          className={`flex items-center space-x-2 px-3 py-1.5 border text-xs font-mono font-bold transition-colors ${
            stats?.flashlightOn
              ? 'bg-amber-950/80 border-amber-500 text-amber-200'
              : 'bg-[#140f0d] border-[#2e1d16] text-gray-400 hover:text-gray-200'
          }`}
        >
          <Flashlight className="w-4 h-4 text-yellow-400" />
          <span>ФОНАРЬ [F]</span>
        </button>

        <button
          onClick={() => engineRef.current?.useCamera()}
          className="flex items-center space-x-2 px-3 py-1.5 bg-[#140f0d] hover:bg-blue-950/60 border border-[#2e1d16] hover:border-blue-600 text-gray-300 hover:text-blue-200 text-xs font-mono font-bold transition-colors"
        >
          <Camera className="w-4 h-4 text-blue-400" />
          <span>POLAROID [C]</span>
        </button>

        <button
          onClick={() => engineRef.current?.swingWeapon()}
          className="flex items-center space-x-2 px-3 py-1.5 bg-[#140f0d] hover:bg-red-950/60 border border-[#2e1d16] hover:border-red-600 text-gray-300 hover:text-red-200 text-xs font-mono font-bold transition-colors"
        >
          <Hammer className="w-4 h-4 text-red-400" />
          <span>{stats?.equippedWeapon === 'sword' ? 'УДАР МЕЧОМ [ЛКМ]' : 'УДАР БИТОЙ [ЛКМ]'}</span>
        </button>
      </div>

      {/* MOBILE TOUCH CONTROLS */}
      {showMobileControls && (
        <div className="absolute inset-x-0 bottom-4 z-30 flex justify-between px-6 pointer-events-none sm:hidden">
          {/* D-Pad Left/Right */}
          <div className="flex space-x-3 pointer-events-auto">
            <button
              onTouchStart={() => { if (engineRef.current) engineRef.current.keys.left = true; }}
              onTouchEnd={() => { if (engineRef.current) engineRef.current.keys.left = false; }}
              className="w-14 h-14 bg-black/70 active:bg-amber-700/80 border-2 border-amber-600 flex items-center justify-center text-white"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onTouchStart={() => { if (engineRef.current) engineRef.current.keys.right = true; }}
              onTouchEnd={() => { if (engineRef.current) engineRef.current.keys.right = false; }}
              className="w-14 h-14 bg-black/70 active:bg-amber-700/80 border-2 border-amber-600 flex items-center justify-center text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pointer-events-auto">
            <button
              onClick={() => {
                const entered = engineRef.current?.handleEnterRoom();
                if (!entered) {
                  engineRef.current?.handleInteract();
                }
              }}
              className="w-14 h-14 bg-amber-950/80 active:bg-amber-600 border-2 border-amber-500 font-mono font-bold text-amber-200 flex flex-col items-center justify-center text-xs"
            >
              <span>[Q / E]</span>
              <span className="text-[9px] text-amber-300/80">ENTER</span>
            </button>
            <button
              onTouchStart={() => { if (engineRef.current) engineRef.current.keys.jump = true; }}
              onTouchEnd={() => { if (engineRef.current) engineRef.current.keys.jump = false; }}
              className="w-14 h-14 bg-black/70 active:bg-blue-600 border-2 border-blue-500 flex items-center justify-center text-white"
            >
              <ArrowUp className="w-7 h-7" />
            </button>
            <button
              onClick={() => engineRef.current?.swingWeapon()}
              className="w-14 h-14 bg-red-950/80 active:bg-red-600 border-2 border-red-500 flex items-center justify-center text-white"
            >
              <Hammer className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
