import React, { useState } from 'react';
import { Clue, CaseDeduction } from '../types/game';
import { X, Search, FileText, Camera, Gem, Disc, Scroll, AlertTriangle, CheckCircle2, Shield, Eye, Map } from 'lucide-react';

interface CaseFileModalProps {
  clues: Clue[];
  deductions: CaseDeduction[];
  currentChapter?: number;
  onSolveDeduction: (deductionId: string) => void;
  onClose: () => void;
}

export const CaseFileModal: React.FC<CaseFileModalProps> = ({
  clues,
  deductions,
  onSolveDeduction,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'deductions' | 'timeline'>('evidence');
  const [selectedClue, setSelectedClue] = useState<Clue | null>(
    clues.find(c => c.discovered) || clues[0] || null
  );

  const handleSelectClue = (clue: Clue) => {
    if (clue.discovered) {
      setSelectedClue(clue);
    }
  };

  const renderIcon = (category: string) => {
    switch (category) {
      case 'document':
        return <FileText className="w-5 h-5 text-amber-400" />;
      case 'photograph':
        return <Camera className="w-5 h-5 text-sky-400" />;
      case 'artifact':
        return <Gem className="w-5 h-5 text-emerald-400" />;
      case 'recording':
        return <Disc className="w-5 h-5 text-purple-400" />;
      case 'biological':
        return <Scroll className="w-5 h-5 text-rose-400" />;
      default:
        return <Search className="w-5 h-5 text-amber-500" />;
    }
  };

  const getCategoryRussian = (category: string) => {
    switch (category) {
      case 'document': return 'ДОКУМЕНТ';
      case 'photograph': return 'ФОТОГРАФИЯ';
      case 'artifact': return 'АРТЕФАКТ';
      case 'recording': return 'АУДИОЗАПИСЬ';
      case 'biological': return 'ОБРАЗЕЦ';
      default: return category.toUpperCase();
    }
  };

  const getLocationRussian = (loc: string) => {
    switch (loc) {
      case 'town': return 'ГОРОД';
      case 'forest': return 'ТЁМНЫЙ ЛЕС';
      case 'mine': return 'ШАХТА';
      case 'house': return 'ДОМ ВЭНСОВ';
      case 'church': return 'ЦЕРКОВЬ';
      case 'lab': return 'ЛАБОРАТОРИЯ';
      default: return loc.toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] bg-[#120e0c] border-4 border-[#3d271d] shadow-2xl flex flex-col text-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#3d271d] bg-[#17110e]">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-amber-500" />
            <div>
              <h2 className="text-xl font-bold tracking-widest text-amber-100 title-font uppercase">
                МАТЕРИАЛЫ ДЕЛА: ИСЧЕЗНОВЕНИЯ В ШЕПЧУЩИХ СОСНАХ
              </h2>
              <span className="text-xs font-mono text-amber-600 tracking-wider">
                ДОСЬЕ ДЕТЕКТИВА • ДЕЛО №1989-10
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-400 hover:text-white border border-amber-900/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#3d271d] bg-[#140f0d] px-6 pt-3">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-5 py-2 text-sm uppercase tracking-wider font-bold transition-all border-t-2 border-x-2 ${
              activeTab === 'evidence'
                ? 'bg-[#1f1612] border-[#5e3b2b] text-amber-200 -mb-[1px]'
                : 'border-transparent text-gray-400 hover:text-amber-200/80'
            }`}
          >
            Улики и вещдоки ({clues.filter(c => c.discovered).length}/{clues.length})
          </button>
          <button
            onClick={() => setActiveTab('deductions')}
            className={`px-5 py-2 text-sm uppercase tracking-wider font-bold transition-all border-t-2 border-x-2 ${
              activeTab === 'deductions'
                ? 'bg-[#1f1612] border-[#5e3b2b] text-amber-200 -mb-[1px]'
                : 'border-transparent text-gray-400 hover:text-amber-200/80'
            }`}
          >
            Выводы следствия
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-5 py-2 text-sm uppercase tracking-wider font-bold transition-all border-t-2 border-x-2 ${
              activeTab === 'timeline'
                ? 'bg-[#1f1612] border-[#5e3b2b] text-amber-200 -mb-[1px]'
                : 'border-transparent text-gray-400 hover:text-amber-200/80'
            }`}
          >
            Хроника событий
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex overflow-hidden p-6 gap-6 bg-[#0e0c0b]">
          
          {/* TAB 1: EVIDENCE ARCHIVE */}
          {activeTab === 'evidence' && (
            <>
              {/* Evidence Grid */}
              <div className="w-1/2 overflow-y-auto pr-2 grid grid-cols-2 gap-3 auto-rows-max">
                {clues.map(clue => (
                  <div
                    key={clue.id}
                    onClick={() => handleSelectClue(clue)}
                    className={`relative p-3 border cursor-pointer transition-all ${
                      clue.discovered
                        ? selectedClue?.id === clue.id
                          ? 'bg-[#2e1d15] border-amber-500 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-[#1a1411] border-[#38261e] hover:border-amber-700/60'
                        : 'bg-[#0f0d0c] border-[#1f1917] opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-[#120d0b] border border-[#2d1e18] shrink-0">
                        {clue.discovered ? renderIcon(clue.category) : <Search className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs uppercase font-mono text-amber-600 tracking-wider">
                          {clue.discovered ? getCategoryRussian(clue.category) : 'НЕ НАЙДЕНО'}
                        </div>
                        <h4 className="text-sm font-bold text-gray-200 truncate">
                          {clue.discovered ? clue.title : '??? Нераскрытая улика'}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {clue.discovered ? clue.description : 'Ищите в городе, лесу и катакомбах.'}
                        </p>
                      </div>
                    </div>

                    {clue.discovered && clue.contradictionWith && (
                      <div className="absolute top-2 right-2 text-red-500" title="Обнаружено противоречие">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Clue Inspector Dossier */}
              <div className="w-1/2 bg-[#17120f] border-2 border-[#3d271d] p-6 flex flex-col overflow-y-auto relative">
                {selectedClue ? (
                  <>
                    <div className="flex items-center justify-between border-b border-[#3d271d] pb-4 mb-4">
                      <div>
                        <span className="text-xs font-mono uppercase tracking-widest text-amber-500">
                          НОМЕР ВЕЩДОКА: {selectedClue.id.toUpperCase()}
                        </span>
                        <h2 className="text-xl font-bold text-amber-100 mt-1">
                          {selectedClue.title}
                        </h2>
                      </div>
                      <div className="p-2.5 bg-[#231914] border border-[#482d21]">
                        {renderIcon(selectedClue.category)}
                      </div>
                    </div>

                    <div className="space-y-4 flex-1">
                      <div>
                        <h5 className="text-xs uppercase font-mono text-gray-400 tracking-wider">Место обнаружения</h5>
                        <p className="text-sm text-amber-300 font-mono mt-0.5 uppercase">
                          СЕКТОР: {getLocationRussian(selectedClue.locationFound)}
                        </p>
                      </div>

                      <div>
                        <h5 className="text-xs uppercase font-mono text-gray-400 tracking-wider">Заметки детектива</h5>
                        <p className="text-sm text-gray-300 leading-relaxed mt-1 italic bg-[#1f1713] p-3 border border-[#30211a]">
                          "{selectedClue.description}"
                        </p>
                      </div>

                      <div>
                        <h5 className="text-xs uppercase font-mono text-gray-400 tracking-wider">Криминалистический анализ</h5>
                        <div className="text-sm text-gray-200 leading-relaxed mt-1 bg-[#120d0b] p-4 border border-[#2b1c15] font-mono whitespace-pre-wrap">
                          {selectedClue.details}
                        </div>
                      </div>

                      {selectedClue.contradictionWith && (
                        <div className="p-3 bg-red-950/40 border border-red-700/60 text-red-300 text-xs flex items-start space-x-2">
                          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block uppercase tracking-wider">ОБНАРУЖЕНО ПРОТИВОРЕЧИЕ</span>
                            Эта улика прямо противоречит официальным показаниям властей города. Кто-то намеренно скрывает правду.
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <Search className="w-12 h-12 text-gray-600 mb-3" />
                    <p className="font-mono text-sm">Выберите найденную улику для осмотра.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: CASE DEDUCTIONS */}
          {activeTab === 'deductions' && (
            <div className="w-full overflow-y-auto space-y-4 pr-2">
              <div className="p-4 bg-[#1a1411] border border-[#3d271d] mb-4">
                <h3 className="text-base font-bold text-amber-300 uppercase tracking-wider">
                  Доска дедукции и проверка гипотез
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Сопоставляйте найденные улики, чтобы формировать выводы и продвигаться по главам расследования.
                </p>
              </div>

              {deductions.map(ded => {
                const availableRequired = ded.requiredClues.filter(cid =>
                  clues.find(c => c.id === cid && c.discovered)
                );
                const isReady = availableRequired.length === ded.requiredClues.length;

                return (
                  <div
                    key={ded.id}
                    className={`p-5 border-2 transition-all ${
                      ded.solved
                        ? 'bg-[#151c14] border-emerald-800/80 text-gray-200'
                        : isReady
                        ? 'bg-[#231a14] border-amber-600 text-gray-200 shadow-lg'
                        : 'bg-[#140f0d] border-[#291b14] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-mono uppercase tracking-widest text-amber-500">
                            ВОПРОС СЛЕДСТВИЯ #{ded.id.replace('deduction_', '')}
                          </span>
                          {ded.solved && (
                            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-600 px-2 py-0.5 font-mono uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Раскрыто
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-bold text-amber-100">{ded.prompt}</h4>
                        
                        {ded.solved ? (
                          <div className="mt-3 p-3 bg-[#0d140d] border border-emerald-900/60 text-emerald-200 text-sm font-mono leading-relaxed">
                            <span className="text-emerald-400 font-bold block uppercase tracking-wide text-xs mb-1">
                              ПОДТВЕРЖДЁННЫЙ ВЫВОД:
                            </span>
                            "{ded.conclusion}"
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center space-x-3 text-xs text-gray-400 font-mono">
                            <span>Необходимые улики:</span>
                            <div className="flex space-x-1.5">
                              {ded.requiredClues.map(cid => {
                                const found = clues.find(c => c.id === cid && c.discovered);
                                return (
                                  <span
                                    key={cid}
                                    className={`px-2 py-0.5 border ${
                                      found
                                        ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                                        : 'bg-black/60 border-gray-800 text-gray-600'
                                    }`}
                                  >
                                    {found ? found.title.slice(0, 14) + '...' : '???'}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {!ded.solved && (
                        <button
                          disabled={!isReady}
                          onClick={() => onSolveDeduction(ded.id)}
                          className={`px-4 py-2 text-xs uppercase font-bold tracking-wider border shrink-0 transition-all ${
                            isReady
                              ? 'bg-amber-600 hover:bg-amber-500 text-black border-amber-400 cursor-pointer shadow-md'
                              : 'bg-gray-800/50 text-gray-500 border-gray-700 cursor-not-allowed'
                          }`}
                        >
                          {isReady ? 'Сделать вывод' : `Не хватает улик (${availableRequired.length}/${ded.requiredClues.length})`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: INVESTIGATION TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="w-full overflow-y-auto space-y-4 p-4 font-mono text-sm">
              <h3 className="text-base font-bold text-amber-300 uppercase tracking-widest border-b border-[#3d271d] pb-2">
                ВОССТАНОВЛЕННАЯ ХРОНОЛОГИЯ СОБЫТИЙ (1982 - 1989)
              </h3>
              <div className="space-y-4 relative border-l-2 border-amber-800/60 ml-4 pl-6">
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-black" />
                  <span className="text-xs text-amber-500 font-bold">1982 г. — РАСКОПКИ СЕКТОРА 4</span>
                  <p className="text-gray-300 mt-1">Буровая корпорация Блэквуд пробивает свод древней резонансной полости под Шепчущими Соснами.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-black" />
                  <span className="text-xs text-amber-500 font-bold">1984 г. — ПОСТРОЙКА БУНКЕРА ПОДУРОВНЯ 3</span>
                  <p className="text-gray-300 mt-1">Фотография городского совета подтверждает: Марта и шеф Дэниел участвовали в тайном соглашении с исследователями лаборатории.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-black" />
                  <span className="text-xs text-red-400 font-bold">ОКТЯБРЬ 1989 г. — ИСЧЕЗНОВЕНИЕ ПЯТЕРЫХ ЖИТЕЛЕЙ</span>
                  <p className="text-gray-300 mt-1">В 03:14 ночи замирают электрические часы. Шеф Дэниел опускает взрывозащитную заслонку и отключает лифт, замуровывая научную группу ради спасения города.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-amber-300 border-2 border-black" />
                  <span className="text-xs text-amber-300 font-bold">НАШИ ДНИ — ПРИБЫТИЕ ДЕТЕКТИВА</span>
                  <p className="text-gray-300 mt-1">Вы прибываете в покинутый город, чтобы докопаться до погребённой во тьме правды.</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
