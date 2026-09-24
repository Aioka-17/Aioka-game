import React from 'react';
import { Award, RotateCcw, Compass, CheckCircle2 } from 'lucide-react';
import { sound } from '../game/audio';

interface EndingModalProps {
  endingId: number;
  cluesCount: number;
  totalClues: number;
  onRestart: () => void;
  onContinueExploring: () => void;
}

export const EndingModal: React.FC<EndingModalProps> = ({
  endingId,
  cluesCount,
  totalClues,
  onRestart,
  onContinueExploring,
}) => {
  const getEndingDetails = () => {
    switch (endingId) {
      case 1:
        return {
          title: 'ФИНАЛ 1: РАСКРЫТАЯ ПРАВДА',
          subtitle: 'Тьма, выведенная на чистый свет',
          color: 'text-blue-400',
          borderColor: 'border-blue-600',
          bgBanner: 'bg-blue-950/40',
          narrative: `Вы сопоставили зашифрованные радиосигналы, искажённые церковные записи погребений и секретную чёрную кассету из глубинной лаборатории.
          
На рассвете по координатам вашей радиопередачи в Шепчущие Сосны прибывает федеральная оперативная группа расследований. Катакомбы опечатаны, а тайный биоакустический проект корпорации Блэквуд обнародован на весь мир.

Шеф Дэниел опускается на колени перед серебряным медальоном своей дочери, плача от горького облегчения. Имена пятерых невинно пропавших возвращены на городской мемориал. Раны Шепчущих Сосен останутся навсегда, но зловещий шёпот из-под земли наконец затих.`,
        };
      case 2:
        return {
          title: 'ФИНАЛ 2: ЛОЖНЫЙ СЛЕД',
          subtitle: 'Замурованная долина',
          color: 'text-amber-400',
          borderColor: 'border-amber-600',
          bgBanner: 'bg-amber-950/40',
          narrative: `Вы решили, что исчезновения были результатом массового психоза секты и завала старых медных шахт, упустив из виду резонансную частоту на Подуровне 3.

Вы активируете детонаторы. Серия оглушительных взрывов обрушивает штольни, погребая вход под тысячами тонн гранита.

Когда в сумерках вы спускаетесь на автомобиле по горному шоссе, в зеркале заднего вида мелькает знакомый силуэт в тумане. Сквозь треск радиоприёмника вдруг доносится шёпот голосом Эвелин: «Ты лишь запер нас здесь наедине с Ним...»`,
        };
      case 3:
      default:
        return {
          title: 'ФИНАЛ 3: ТАЙНАЯ СВЯЗЬ',
          subtitle: 'Трансмутация резонанса (Секретная концовка)',
          color: 'text-purple-400',
          borderColor: 'border-purple-600',
          bgBanner: 'bg-purple-950/40',
          narrative: `Благодаря снимкам фотокамеры Polaroid и древним резонансным формулам вы постигли то, что не мог принять человеческий разум: существо было не хищником, а космическим сознанием, ожидавшим Наблюдателя, чтобы обрести покой.

Магниевая вспышка камеры озаряет подземный зал в последний раз. Ваша тень отделяется от подошв. Границы между материей, светом и памятью растворяются.

В Шепчущих Соснах воцаряется абсолютная тишина. В лавке Марта замечает на стене новую чёрно-белую фотографию: детектив в красном пальто и шляпе, спокойно глядящий из глубин соснового бора.`,
        };
    }
  };

  const details = getEndingDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 animate-in fade-in duration-300">
      <div className={`w-full max-w-2xl bg-[#0f0c0b] border-4 ${details.borderColor} shadow-2xl p-8 text-gray-200 flex flex-col items-center text-center`}>
        
        <div className={`p-4 rounded-full ${details.bgBanner} border ${details.borderColor} mb-4`}>
          <Award className={`w-12 h-12 ${details.color}`} />
        </div>

        <h1 className={`text-3xl font-bold tracking-widest title-font uppercase ${details.color} mb-1`}>
          {details.title}
        </h1>
        <h3 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-6">
          {details.subtitle}
        </h3>

        <div className="w-full bg-[#17110e] border border-[#2e1d16] p-6 text-sm font-mono text-gray-200 leading-relaxed text-left whitespace-pre-line mb-6 max-h-[45vh] overflow-y-auto">
          {details.narrative}
        </div>

        <div className="w-full flex items-center justify-between bg-[#120d0b] border border-[#241711] px-5 py-3 text-xs font-mono text-amber-400/90 mb-6">
          <span>ИТОГИ РАССЛЕДОВАНИЯ:</span>
          <span className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {cluesCount} / {totalClues} УЛИК ОБНАРУЖЕНО
          </span>
        </div>

        <div className="flex gap-4 w-full">
          <button
            onClick={() => {
              sound.playPuzzleSuccess();
              onContinueExploring();
            }}
            className="flex-1 py-3 bg-[#1e293b] hover:bg-[#334155] border border-blue-400 text-blue-200 font-bold uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            Продолжить исследование
          </button>

          <button
            onClick={() => {
              sound.playFootstep('stone');
              onRestart();
            }}
            className="flex-1 py-3 bg-[#2a1711] hover:bg-[#3d2319] border border-amber-500 text-amber-200 font-bold uppercase tracking-wider text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Начать заново
          </button>
        </div>

      </div>
    </div>
  );
};
