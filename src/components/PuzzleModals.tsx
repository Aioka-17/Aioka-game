import React, { useState } from 'react';
import { Lock, X, Zap, ShieldAlert } from 'lucide-react';
import { InteractiveObject } from '../types/game';
import { sound } from '../game/audio';

interface PuzzleModalsProps {
  puzzleType: 'keypad' | 'password' | 'symbols' | 'generator' | 'camera' | null;
  targetObject?: InteractiveObject | null;
  onSolved: () => void;
  onClose: () => void;
  onTriggerEnding?: (endingId: number) => void;
}

export const PuzzleModals: React.FC<PuzzleModalsProps> = ({
  puzzleType,
  targetObject,
  onSolved,
  onClose,
  onTriggerEnding,
}) => {
  // Keypad & Password state
  const [codeDigits, setCodeDigits] = useState<string>('');
  const [keypadError, setKeypadError] = useState<boolean>(false);

  // Symbol puzzle state: 4 rune stones, each has 4 states: Sun, Moon, Skull, Serpent
  // Correct solution: [0, 1, 2, 3] -> Sun, Moon, Skull, Serpent
  const [runes, setRunes] = useState<string[]>(['ЗМЕЯ', 'ЧЕРЕП', 'ЛУНА', 'СОЛНЦЕ']);
  const runeCycle = ['СОЛНЦЕ', 'ЛУНА', 'ЧЕРЕП', 'ЗМЕЯ'];

  // Generator puzzle state: 4 toggle switches/relays
  // Target: [true, false, true, true]
  const [relays, setRelays] = useState<boolean[]>([false, true, false, false]);

  if (!puzzleType) return null;

  const targetPassword = targetObject?.password || (puzzleType === 'keypad' ? '4729' : '1987');

  const handleKeypadPress = (digit: string) => {
    if (keypadError) {
      setKeypadError(false);
      setCodeDigits(digit);
      sound.playPuzzleBeep(true);
      return;
    }
    if (codeDigits.length >= 4) return;
    const next = codeDigits + digit;
    setCodeDigits(next);
    sound.playPuzzleBeep(true);

    if (next.length === 4) {
      if (next === targetPassword) {
        sound.playPuzzleSuccess();
        setTimeout(() => {
          onSolved();
          onClose();
        }, 300);
      } else {
        sound.playPuzzleBeep(false);
        setKeypadError(true);
      }
    }
  };

  const handleRotateRune = (index: number) => {
    const currentRune = runes[index];
    const nextIndex = (runeCycle.indexOf(currentRune) + 1) % runeCycle.length;
    const updated = [...runes];
    updated[index] = runeCycle[nextIndex];
    setRunes(updated);
    sound.playPuzzleBeep(true);

    // Check solution: [СОЛНЦЕ, ЛУНА, ЧЕРЕП, ЗМЕЯ]
    if (
      updated[0] === 'СОЛНЦЕ' &&
      updated[1] === 'ЛУНА' &&
      updated[2] === 'ЧЕРЕП' &&
      updated[3] === 'ЗМЕЯ'
    ) {
      sound.playPuzzleSuccess();
      setTimeout(() => {
        onSolved();
        onClose();
      }, 400);
    }
  };

  const handleToggleRelay = (index: number) => {
    const updated = [...relays];
    updated[index] = !updated[index];
    setRelays(updated);
    sound.playPuzzleBeep(true);

    // Target solution: 1st, 3rd, 4th relays active (indices 0, 2, 3 = true, 1 = false)
    if (updated[0] && !updated[1] && updated[2] && updated[3]) {
      sound.playPuzzleSuccess();
      setTimeout(() => {
        onSolved();
        onClose();
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#140f0d] border-4 border-[#3d271d] shadow-2xl p-6 text-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#3d271d] mb-5">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold tracking-wider text-amber-100 title-font uppercase">
              {puzzleType === 'keypad' && 'ЗАМОК БЕЗОПАСНОСТИ ШЛЮЗА'}
              {puzzleType === 'password' && (targetObject?.passwordTitle || 'ВВОД КОДА ДОСТУПА')}
              {puzzleType === 'symbols' && 'РУНИЧЕСКИЙ АЛТАРЬ КРИПТЫ'}
              {puzzleType === 'generator' && 'ЩИТ АВАРИЙНЫХ РЕЛЕ ПИТАНИЯ'}
              {puzzleType === 'camera' && 'ГЛАВНЫЙ ТЕРМИНАЛ ЯДРА (ПОДУРОВЕНЬ 3)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-amber-400 hover:text-white border border-amber-900/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PUZZLE 1: KEYPAD OR PASSWORD */}
        {(puzzleType === 'keypad' || puzzleType === 'password') && (
          <div className="flex flex-col items-center">
            <p className="text-xs font-mono text-gray-400 mb-4 text-center">
              {puzzleType === 'password'
                ? 'Введите 4-значный код из записок, шкафчиков или служебных отчётов.'
                : 'Введите 4-значный частотный код из дневника Эвелин или аудиозаписи из шахты.'}
            </p>

            <div className={`w-48 h-14 bg-black border-2 flex items-center justify-center text-3xl font-mono tracking-widest mb-6 ${
              keypadError ? 'border-red-500 text-red-500 bg-red-950/40' : 'border-amber-600 text-amber-400'
            }`}>
              {keypadError ? 'ОТКАЗ' : codeDigits.padEnd(4, '_')}
            </div>

            <div className="grid grid-cols-3 gap-3 w-56">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'СБРОС', '0', 'ВВОД'].map(val => (
                <button
                  key={val}
                  onClick={() => {
                    if (val === 'СБРОС') setCodeDigits('');
                    else if (val === 'ВВОД') {
                      if (codeDigits === targetPassword) {
                        sound.playPuzzleSuccess();
                        onSolved();
                        onClose();
                      } else {
                        setKeypadError(true);
                      }
                    } else handleKeypadPress(val);
                  }}
                  className="h-12 bg-[#231914] hover:bg-amber-600 hover:text-black border border-[#482d21] font-mono font-bold text-base text-amber-200 transition-colors"
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PUZZLE 2: RUNE SYMBOLS */}
        {puzzleType === 'symbols' && (
          <div className="flex flex-col items-center">
            <p className="text-xs font-mono text-gray-400 mb-4 text-center">
              Поверните древние камни в порядке из церковной книги: <br/>
              <span className="text-amber-400 font-bold">СОЛНЦЕ — ЛУНА — ЧЕРЕП — ЗМЕЯ</span>
            </p>

            <div className="grid grid-cols-4 gap-3 my-4">
              {runes.map((rune, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-[10px] font-mono text-gray-500 mb-1">КОЛОННА {idx + 1}</span>
                  <button
                    onClick={() => handleRotateRune(idx)}
                    className="w-24 h-24 bg-[#1f1713] hover:bg-[#2d1e18] border-2 border-amber-600/80 flex flex-col items-center justify-center p-2 transition-all hover:scale-105"
                  >
                    <span className="text-sm font-bold font-mono text-amber-300 tracking-wider">
                      {rune}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono mt-1">[ПОВЕРНУТЬ]</span>
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs font-mono text-gray-500 mt-2">
              Нажимайте на колонну, чтобы менять символ.
            </p>
          </div>
        )}

        {/* PUZZLE 3: AUXILIARY GENERATOR RELAYS */}
        {puzzleType === 'generator' && (
          <div className="flex flex-col items-center">
            <p className="text-xs font-mono text-gray-400 mb-4 text-center">
              Переключите реле аварийного контура, чтобы восстановить питание комплекса.
            </p>

            <div className="grid grid-cols-4 gap-4 my-4 w-full">
              {relays.map((isOn, idx) => (
                <button
                  key={idx}
                  onClick={() => handleToggleRelay(idx)}
                  className={`p-4 border-2 flex flex-col items-center justify-center transition-all ${
                    isOn
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-black/60 border-gray-700 text-gray-500'
                  }`}
                >
                  <Zap className={`w-8 h-8 mb-2 ${isOn ? 'text-emerald-400 animate-pulse' : 'text-gray-600'}`} />
                  <span className="text-xs font-mono font-bold">РЕЛЕ #{idx + 1}</span>
                  <span className="text-[10px] font-mono uppercase mt-1">
                    {isOn ? 'ВКЛ' : 'ВЫКЛ'}
                  </span>
                </button>
              ))}
            </div>

            <div className="text-xs font-mono text-amber-400/80 bg-[#19120e] p-3 border border-[#30211a] w-full text-center">
              ЦЕЛЕВАЯ ГАРМОНИКА: РЕЛЕ 1, 3 И 4 ДОЛЖНЫ БЫТЬ АКТИВНЫ
            </div>
          </div>
        )}

        {/* PUZZLE 4 / CHAPTER 6 MASTER CORE TERMINAL */}
        {puzzleType === 'camera' && (
          <div className="flex flex-col space-y-4">
            <div className="p-4 bg-red-950/30 border border-red-700 text-xs font-mono text-red-200">
              <ShieldAlert className="w-5 h-5 text-red-400 inline mr-2" />
              ВНИМАНИЕ: ДОСТУП К ГЛАВНОМУ ЯДРУ ПОЛУЧЕН. ВСЕ МАТЕРИАЛЫ ДЕЛА И УЛИКИ СОБРАНЫ.
            </div>

            <p className="text-sm text-gray-300 font-mono leading-relaxed">
              На основе вашего расследования выберите финальное действие:
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  onTriggerEnding?.(1);
                  onClose();
                }}
                className="w-full text-left p-3 bg-[#1e293b] hover:bg-[#334155] border-2 border-blue-500 text-gray-200 transition-colors"
              >
                <div className="font-bold font-mono text-blue-300 text-sm">
                  КОНЦОВКА 1: ПЕРЕДАТЬ ДОКАЗАТЕЛЬСТВА ВНЕШНИМ ВЛАСТЯМ
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Раскрыть тайные эксперименты военных и корпорации, снять подозрения с пропавших и вызвать группу карантина.
                </div>
              </button>

              <button
                onClick={() => {
                  onTriggerEnding?.(2);
                  onClose();
                }}
                className="w-full text-left p-3 bg-[#2a1711] hover:bg-[#3d2319] border-2 border-amber-600 text-gray-200 transition-colors"
              >
                <div className="font-bold font-mono text-amber-400 text-sm">
                  КОНЦОВКА 2: ВЗОРВАТЬ И НАВСЕГДА ПОХОРОНИТЬ ШАХТУ
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Списать трагедию на сектантскую истерию, подорвать оставшиеся штольни и навсегда запечатать проклятую долину.
                </div>
              </button>

              <button
                onClick={() => {
                  onTriggerEnding?.(3);
                  onClose();
                }}
                className="w-full text-left p-3 bg-[#1e112a] hover:bg-[#331c47] border-2 border-purple-500 text-gray-200 transition-colors"
              >
                <div className="font-bold font-mono text-purple-300 text-sm">
                  КОНЦОВКА 3: СЛИЯНИЕ С ТЕНЕВЫМ РЕЗОНАНСОМ (ТАЙНЫЙ ФИНАЛ)
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Используя фотокамеру Polaroid, настроиться на акустическую частоту сущности и выйти за пределы смертной оболочки.
                </div>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export const PuzzleModal = PuzzleModals;
