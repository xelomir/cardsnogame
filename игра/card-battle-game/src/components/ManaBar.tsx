import React from 'react';

interface ManaBarProps {
  currentMana: number;
  maxMana: number;
}

export const ManaBar = ({ currentMana, maxMana }: ManaBarProps) => {
  // Create an array with the max number of mana crystals
  const manaArray = Array.from({ length: 10 }, (_, index) => ({
    filled: index < currentMana,
    available: index < maxMana,
  }));

  return (
    <div className="mana-bar flex items-center justify-center gap-1 py-2">
      {manaArray.map((mana, index) => (
        <div
          key={index}
          className={`
            rounded-full w-6 h-6 border-2
            ${mana.available
              ? (mana.filled ? 'bg-blue-600 border-blue-200' : 'bg-blue-300 border-blue-200 opacity-50')
              : 'bg-gray-500 border-gray-400 opacity-30'}
            transition-all duration-200
          `}
        ></div>
      ))}
      <div className="text-amber-100 ml-2 font-bold">
        {currentMana}/{maxMana}
      </div>
    </div>
  );
};

export default ManaBar;
