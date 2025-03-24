import React from 'react';
import { AIDifficulty } from '../types';

interface DifficultySelectorProps {
  currentDifficulty: AIDifficulty;
  onSelectDifficulty: (difficulty: AIDifficulty) => void;
}

export const DifficultySelector = ({ currentDifficulty, onSelectDifficulty }: DifficultySelectorProps) => {
  return (
    <div className="difficulty-selector">
      <h3 className="text-amber-100 font-bold mb-2">Выберите уровень сложности:</h3>
      <div className="flex gap-2">
        <button
          className={`difficulty-btn easy ${currentDifficulty === 'easy' ? 'selected' : ''}`}
          onClick={() => onSelectDifficulty('easy')}
        >
          Легкий
        </button>
        <button
          className={`difficulty-btn normal ${currentDifficulty === 'normal' ? 'selected' : ''}`}
          onClick={() => onSelectDifficulty('normal')}
        >
          Средний
        </button>
        <button
          className={`difficulty-btn hard ${currentDifficulty === 'hard' ? 'selected' : ''}`}
          onClick={() => onSelectDifficulty('hard')}
        >
          Сложный
        </button>
      </div>
    </div>
  );
};

export default DifficultySelector;
