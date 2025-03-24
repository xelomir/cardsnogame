import React from 'react';
import { GameStatus as GameStatusType } from '../types';

interface GameStatusProps {
  status: GameStatusType;
  turn: number;
  onNewGame: () => void;
}

export const GameStatus = ({ status, turn, onNewGame }: GameStatusProps) => {
  let statusText = '';
  let statusClass = '';

  switch (status) {
    case 'waiting':
      statusText = 'Ожидание...';
      statusClass = 'text-amber-300';
      break;
    case 'inProgress':
      statusText = `Ход ${turn}`;
      statusClass = 'text-green-300';
      break;
    case 'playerWon':
      statusText = 'Вы победили!';
      statusClass = 'text-green-500 font-bold';
      break;
    case 'playerLost':
      statusText = 'Вы проиграли!';
      statusClass = 'text-red-500 font-bold';
      break;
    case 'draw':
      statusText = 'Ничья!';
      statusClass = 'text-amber-500 font-bold';
      break;
  }

  return (
    <div className="game-status flex items-center justify-between p-2 border-b border-amber-800">
      <div className={`status-text ${statusClass}`}>
        {statusText}
      </div>

      {(status === 'playerWon' || status === 'playerLost' || status === 'draw') && (
        <button
          className="button button-secondary text-sm"
          onClick={onNewGame}
        >
          Новая игра
        </button>
      )}
    </div>
  );
};

export default GameStatus;
