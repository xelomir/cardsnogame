import React from 'react';
import { GameStatistics } from '../types';

interface StatsPanelProps {
  statistics: GameStatistics;
  onResetStats: () => void;
}

export const StatsPanel = ({ statistics, onResetStats }: StatsPanelProps) => {
  const { gamesPlayed, gamesWon, gamesLost, totalDamageDealt, totalCardsPlayed, totalTurns, favoriteCards } = statistics;

  // Вычисляем процент побед
  const winRate = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) : '0';

  // Получаем любимые карты (топ-3)
  const topCards = Object.entries(favoriteCards)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 3);

  return (
    <div className="stats-panel">
      <h3 className="stats-header">Статистика игры</h3>

      <div className="stats-item">
        <span>Всего игр:</span>
        <span className="stats-value">{gamesPlayed}</span>
      </div>

      <div className="stats-item">
        <span>Победы:</span>
        <span className="stats-value">{gamesWon}</span>
      </div>

      <div className="stats-item">
        <span>Поражения:</span>
        <span className="stats-value">{gamesLost}</span>
      </div>

      <div className="stats-item">
        <span>Процент побед:</span>
        <span className="stats-value">{winRate}%</span>
      </div>

      <div className="stats-item">
        <span>Нанесено урона:</span>
        <span className="stats-value">{totalDamageDealt}</span>
      </div>

      <div className="stats-item">
        <span>Разыграно карт:</span>
        <span className="stats-value">{totalCardsPlayed}</span>
      </div>

      <div className="stats-item">
        <span>Всего ходов:</span>
        <span className="stats-value">{totalTurns}</span>
      </div>

      {topCards.length > 0 && (
        <>
          <h4 className="text-amber-100 font-bold mt-3 mb-1">Любимые карты:</h4>
          {topCards.map(([cardName, count], index) => (
            <div key={index} className="stats-item">
              <span>{cardName}:</span>
              <span className="stats-value">{count} раз</span>
            </div>
          ))}
        </>
      )}

      <div className="mt-4">
        <button
          className="button button-secondary text-sm w-full"
          onClick={onResetStats}
        >
          Сбросить статистику
        </button>
      </div>
    </div>
  );
};

export default StatsPanel;
