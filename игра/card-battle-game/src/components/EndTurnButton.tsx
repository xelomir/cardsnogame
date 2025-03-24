import React from 'react';

interface EndTurnButtonProps {
  isPlayerTurn: boolean;
  onClick: () => void;
}

export const EndTurnButton = ({ isPlayerTurn, onClick }: EndTurnButtonProps) => {
  return (
    <button
      className={`
        button button-primary
        ${isPlayerTurn ? 'animate-pulse' : 'opacity-50 cursor-not-allowed'}
        flex items-center justify-center gap-2
      `}
      onClick={() => isPlayerTurn && onClick()}
      disabled={!isPlayerTurn}
    >
      <span>Завершить ход</span>
      {isPlayerTurn && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </button>
  );
};

export default EndTurnButton;
