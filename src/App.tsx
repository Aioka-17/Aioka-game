/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GameEngine } from './game/engine';
import { GameCanvas } from './components/GameCanvas';
import { CaseFileModal } from './components/CaseFileModal';
import { InventoryModal } from './components/InventoryModal';
import { DialogueModal } from './components/DialogueModal';
import { PuzzleModal } from './components/PuzzleModals';
import { EndingModal } from './components/EndingModal';
import { PauseMenu } from './components/PauseMenu';
import { NPC, InteractiveObject } from './types/game';
import { SPECIAL_ITEMS } from './game/itemsData';
import { sound } from './game/audio';
import { Eye, ShieldAlert, Sparkles, Compass, Play } from 'lucide-react';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);

  // Active modal
  const [activeModal, setActiveModal] = useState<
    'none' | 'casefile' | 'inventory' | 'dialogue' | 'puzzle' | 'ending' | 'pause' | 'intro'
  >('intro');

  // Modal payload states
  const [activeNpc, setActiveNpc] = useState<NPC | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<'keypad' | 'generator' | 'symbols' | 'camera' | 'password'>('keypad');
  const [activePuzzleObj, setActivePuzzleObj] = useState<InteractiveObject | null>(null);
  const [endingId, setEndingId] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());

  // Clues count & chapter cache for UI
  const [currentChapter, setCurrentChapter] = useState<number>(1);

  const handleEngineReady = (engine: GameEngine) => {
    engineRef.current = engine;
    setCurrentChapter(engine.chapter);
  };

  const handleStartGame = () => {
    setActiveModal('none');
    sound.startGameAudio();
    sound.playFootstep('stone');
  };

  // Dialogue actions
  const handleTriggerDialogue = (npc: NPC) => {
    setActiveNpc(npc);
    setActiveModal('dialogue');
  };

  const handleGiveItem = (itemId: string) => {
    if (!engineRef.current) return;
    const special = SPECIAL_ITEMS[itemId];
    if (special) {
      const alreadyHas = engineRef.current.inventory.some(i => i.id === itemId);
      if (!alreadyHas) {
        engineRef.current.inventory.push({ ...special });
        sound.playClueFound();
        engineRef.current.onNotification?.(`Received: ${special.name}`);
      }
    }
  };

  // Puzzle actions
  const handleTriggerPuzzle = (pType: string, obj: InteractiveObject) => {
    setActivePuzzle(pType as any);
    setActivePuzzleObj(obj);
    setActiveModal('puzzle');
  };

  const handlePuzzleSolved = () => {
    if (!engineRef.current || !activePuzzleObj) return;
    engineRef.current.solvedPuzzles.add(activePuzzleObj.id);

    if (activePuzzleObj.doorType === 'password') {
      engineRef.current.unlockedDoors.add(activePuzzleObj.id);
      engineRef.current.onNotification?.('Доступ разрешён! Дверь безопасности открыта.');
    } else if (activePuzzleObj.id === 'mine_airlock_keypad') {
      engineRef.current.unlockedDoors.add('mine_airlock_keypad');
      engineRef.current.onNotification?.('Взрывозащитный шлюз открыт! Переход на Подуровень 3.');
      engineRef.current.transitionToLocation('lab', 120, 380);
    } else if (activePuzzleObj.id === 'church_rune_altar') {
      engineRef.current.unlockedDoors.add('church_to_lab');
      engineRef.current.onNotification?.('Плита алтаря отодвинулась, открывая тайную лестницу!');
    } else if (activePuzzleObj.id === 'lab_generator_puzzle') {
      engineRef.current.onNotification?.('Резервные генераторы запущены! Главный терминал ядра активен.');
    }
  };

  // Ending actions
  const handleTriggerEnding = (eid: number) => {
    setEndingId(eid);
    setActiveModal('ending');
    sound.playHorrorSting();
  };

  // Detective deduction solve
  const handleSolveDeduction = (deductionId: string) => {
    if (!engineRef.current) return;
    const deduction = engineRef.current.deductions.find(d => d.id === deductionId);
    if (deduction) {
      deduction.solved = true;
      sound.playPuzzleSuccess();
      engineRef.current.onNotification?.(`Вывод подтверждён: ${deduction.conclusion}`);
      if (deduction.unlockedChapter && deduction.unlockedChapter > engineRef.current.chapter) {
        engineRef.current.chapter = deduction.unlockedChapter;
        setCurrentChapter(deduction.unlockedChapter);
      }
    }
  };

  const handleUseItem = (itemId: string) => {
    if (engineRef.current) {
      engineRef.current.useItem(itemId);
    }
  };

  const handleSave = () => {
    if (engineRef.current) {
      engineRef.current.saveGame();
      engineRef.current.onNotification?.('ИГРА УСПЕШНО СОХРАНЕНА');
    }
  };

  const handleLoad = () => {
    if (engineRef.current) {
      const success = engineRef.current.loadGame();
      if (success) {
        setCurrentChapter(engineRef.current.chapter);
        engineRef.current.onNotification?.('СОХРАНЕНИЕ ЗАГРУЖЕНО');
      } else {
        engineRef.current.onNotification?.('Сохранений не найдено');
      }
    }
  };

  const handleNewGame = () => {
    if (engineRef.current) {
      engineRef.current.newGame();
      setCurrentChapter(1);
    }
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Clue arrays for CaseFileModal
  const cluesArray = engineRef.current
    ? Array.from(engineRef.current.clues.values())
    : [];

  const discoveredClueIds = cluesArray
    .filter(c => c.discovered)
    .map(c => c.id);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-mono select-none">
      
      {/* Main 2D Canvas Engine */}
      <GameCanvas
        onOpenCaseFile={() => setActiveModal('casefile')}
        onOpenInventory={() => setActiveModal('inventory')}
        onOpenPauseMenu={() => setActiveModal('pause')}
        onTriggerDialogue={handleTriggerDialogue}
        onTriggerPuzzle={handleTriggerPuzzle}
        onTriggerEnding={handleTriggerEnding}
        onEngineReady={handleEngineReady}
      />

      {/* INTRO TITLE SPLASH SCREEN */}
      {activeModal === 'intro' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl bg-[#0f0c0b] border-4 border-[#3d271d] shadow-2xl p-8 text-center text-gray-200">
            
            <div className="w-16 h-16 mx-auto mb-4 bg-red-950/40 border border-red-700/60 flex items-center justify-center text-red-500">
              <Eye className="w-8 h-8 animate-pulse" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-widest text-amber-100 title-font uppercase mb-2">
              ТЕНИ В ГЛУБИНЕ
            </h1>
            <h3 className="text-sm font-mono text-amber-500/80 tracking-widest uppercase mb-6">
              Пиксельный психологический детектив-хоррор
            </h3>

            <div className="bg-[#17110e] border border-[#2e1d16] p-5 text-sm font-mono text-gray-300 leading-relaxed text-left space-y-3 mb-5">
              <p>
                Пять жителей городка Шепчущие Сосны бесследно исчезли в одну ночь.
              </p>
              <p>
                Днём покинутый город кажется пустынным и тихим. Но когда опускаются сумерки, мерцают уличные фонари, тени сползают со стен, а в густом тумане появляется пугающий силуэт.
              </p>
              <p className="text-amber-400">
                • Собирайте улики и сопоставляйте факты в <strong>[J] МАТЕРИАЛАХ ДЕЛА</strong>.<br />
                • Включайте <strong>[F] Фонарик</strong>, чтобы читать скрытые надписи и отгонять тени.<br />
                • Используйте вспышку <strong>[C] Polaroid</strong>, чтобы обнаружить скрытые аномалии.<br />
                • Опрашивайте Марту, Дэниела и Илая, чтобы раскрыть тайну под заброшенной шахтой.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs font-mono text-amber-400/90 mb-4 bg-amber-950/20 py-1.5 px-3 border border-amber-900/30">
              <span>🎵 Оригинальный саундтрек: <strong>"Being Watched by Aioka"</strong></span>
            </div>

            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-black font-extrabold uppercase tracking-widest text-lg border-2 border-amber-300 shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              <Play className="w-5 h-5 fill-current" />
              НАЧАТЬ РАССЛЕДОВАНИЕ
            </button>
          </div>
        </div>
      )}

      {/* CASE FILE MODAL */}
      {activeModal === 'casefile' && (
        <CaseFileModal
          clues={cluesArray}
          deductions={engineRef.current?.deductions || []}
          currentChapter={currentChapter}
          onClose={() => setActiveModal('none')}
          onSolveDeduction={handleSolveDeduction}
        />
      )}

      {/* INVENTORY MODAL */}
      {activeModal === 'inventory' && engineRef.current && (
        <InventoryModal
          inventory={engineRef.current.inventory}
          selectedSlot={engineRef.current.player.selectedSlot}
          onSelectSlot={(slot) => {
            if (engineRef.current) engineRef.current.player.selectedSlot = slot;
          }}
          onUseItem={handleUseItem}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* NPC DIALOGUE MODAL */}
      {activeModal === 'dialogue' && activeNpc && (
        <DialogueModal
          npc={activeNpc}
          discoveredClues={discoveredClueIds}
          onClose={() => setActiveModal('none')}
          onGiveItem={handleGiveItem}
          onHorrorTrigger={() => {
            if (engineRef.current) {
              engineRef.current.horror.flickerBlackout = true;
              engineRef.current.horror.blackoutTimer = 2.0;
            }
          }}
        />
      )}

      {/* PUZZLE MODAL */}
      {activeModal === 'puzzle' && (
        <PuzzleModal
          puzzleType={activePuzzle}
          targetObject={activePuzzleObj}
          onSolved={handlePuzzleSolved}
          onTriggerEnding={handleTriggerEnding}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* ENDING MODAL */}
      {activeModal === 'ending' && (
        <EndingModal
          endingId={endingId}
          cluesCount={discoveredClueIds.length}
          totalClues={cluesArray.length}
          onRestart={() => {
            handleNewGame();
            setActiveModal('none');
          }}
          onContinueExploring={() => setActiveModal('none')}
        />
      )}

      {/* PAUSE & SETTINGS MENU */}
      {activeModal === 'pause' && (
        <PauseMenu
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onSave={handleSave}
          onLoad={handleLoad}
          onNewGame={handleNewGame}
          onClose={() => setActiveModal('none')}
        />
      )}

    </div>
  );
}
