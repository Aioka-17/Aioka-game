import React, { useState, useEffect } from 'react';
import { NPC } from '../types/game';
import { NPC_DIALOGUES, DialogueNode, DialogueOption } from '../game/dialoguesData';
import { sound } from '../game/audio';
import { MessageSquare, ArrowRight, User } from 'lucide-react';

interface DialogueModalProps {
  npc: NPC;
  discoveredClues: string[];
  onClose: () => void;
  onGiveItem?: (itemId: string) => void;
  onHorrorTrigger?: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  npc,
  discoveredClues,
  onClose,
  onGiveItem,
  onHorrorTrigger,
}) => {
  const npcTree = NPC_DIALOGUES[npc.id] || NPC_DIALOGUES['martha'];
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(true);

  const currentNode: DialogueNode = npcTree[currentNodeId] || npcTree['start'];

  useEffect(() => {
    let charIdx = 0;
    setIsTyping(true);
    setDisplayedText('');

    const textToType = currentNode.text;
    const interval = setInterval(() => {
      if (charIdx < textToType.length) {
        setDisplayedText(prev => prev + textToType.charAt(charIdx));
        if (charIdx % 3 === 0) {
          sound.playFootstep('wood');
        }
        charIdx++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [currentNodeId, currentNode.text]);

  const handleOptionClick = (option: DialogueOption) => {
    if (option.action === 'close') {
      onClose();
      return;
    }

    if (option.action === 'give_pickaxe') {
      onGiveItem?.('item_pickaxe');
      onClose();
      return;
    }

    if (option.action === 'give_key') {
      onGiveItem?.('item_rusty_key');
      onClose();
      return;
    }

    if (option.action === 'trigger_horror') {
      onHorrorTrigger?.();
    }

    if (option.nextId && npcTree[option.nextId]) {
      setCurrentNodeId(option.nextId);
      sound.playFootstep('stone');
    }
  };

  const availableOptions = currentNode.options.filter(opt => {
    if (!opt.requiredClue) return true;
    return discoveredClues.includes(opt.requiredClue);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#140f0d] border-4 border-[#3d271d] shadow-2xl p-6 text-gray-200 flex flex-col md:flex-row gap-6">
        
        {/* Character Portrait Box */}
        <div className="flex flex-col items-center justify-center p-4 bg-[#1f1612] border-2 border-[#482d21] shrink-0 w-36">
          <div className="w-24 h-32 bg-[#120d0b] border border-[#3b2318] flex items-center justify-center mb-2 overflow-hidden relative">
            <User className="w-12 h-12 text-amber-600/70" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-1">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">{npc.name}</span>
            </div>
          </div>
          <span className="text-xs font-mono text-amber-500 text-center">{npc.role}</span>
        </div>

        {/* Dialogue Speech & Choices */}
        <div className="flex-1 flex flex-col justify-between min-h-[180px]">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-2">
              <MessageSquare className="w-4 h-4" />
              <span>{currentNode.speaker}</span>
            </div>

            <div className="text-base text-amber-100 font-mono leading-relaxed bg-[#191310] p-4 border border-[#30211a] min-h-[90px]">
              "{displayedText}"
              {isTyping && <span className="inline-block w-2 h-4 bg-amber-400 ml-1 animate-pulse" />}
            </div>
          </div>

          {/* Option Choices */}
          <div className="mt-4 space-y-2">
            {!isTyping ? (
              availableOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionClick(opt)}
                  className="w-full text-left px-4 py-2.5 bg-[#231914] hover:bg-[#38261e] border border-[#482d21] hover:border-amber-500 text-sm font-mono text-amber-200 flex items-center justify-between transition-colors group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">
                    › {opt.text}
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                </button>
              ))
            ) : (
              <button
                onClick={() => setDisplayedText(currentNode.text)}
                className="text-xs text-amber-500 hover:text-amber-300 font-mono underline"
              >
                [Нажмите, чтобы пропустить печать текста]
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
