import React, { useEffect, useRef } from 'react';
import { GameLogEntry } from '../types';

interface GameLogProps {
  entries: GameLogEntry[];
}

export const GameLog = ({ entries }: GameLogProps) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to the bottom when new entries arrive
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="game-log border border-amber-700 rounded bg-black bg-opacity-50 p-2 h-40 overflow-y-auto" ref={logRef}>
      <h3 className="text-amber-100 font-bold mb-2 text-sm">История событий</h3>

      {entries.length === 0 ? (
        <div className="text-amber-100 text-xs opacity-70 italic">События игры будут отображаться здесь</div>
      ) : (
        <ul className="space-y-1">
          {entries.map((entry) => (
            <li key={entry.id} className="text-xs text-amber-100 opacity-80">
              <span className="text-amber-300 font-bold">[Ход {entry.turn}]</span>{' '}
              {entry.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GameLog;
