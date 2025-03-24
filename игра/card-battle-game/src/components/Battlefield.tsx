import React from 'react';
import { Card as CardType } from '../types';
import Card from './Card';

interface BattlefieldProps {
  playerField: CardType[];
  opponentField: CardType[];
  isPlayerTurn: boolean;
  onCardSelect: (card: CardType) => void;
}

export const Battlefield = ({ playerField, opponentField, isPlayerTurn, onCardSelect }: BattlefieldProps) => {
  return (
    <div className="battlefield-container mx-auto w-full">
      {/* Opponent's field */}
      <div className="battlefield mb-4">
        <div className="text-xs text-amber-100 mb-2">Поле противника</div>
        <div className="flex flex-wrap justify-center gap-1">
          {opponentField.map((card) => (
            <div key={card.id} className="battlefield-card">
              <Card
                card={card}
                inField={true}
                playable={isPlayerTurn}
                onClick={onCardSelect}
              />
            </div>
          ))}
          {opponentField.length === 0 && (
            <div className="text-amber-100 text-xs italic py-8">Нет карт на поле</div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-b-2 border-amber-800 my-2"></div>

      {/* Player's field */}
      <div className="battlefield mt-4">
        <div className="text-xs text-amber-100 mb-2">Ваше поле</div>
        <div className="flex flex-wrap justify-center gap-1">
          {playerField.map((card) => (
            <div key={card.id} className="battlefield-card">
              <Card
                card={card}
                inField={true}
                playable={isPlayerTurn}
                onClick={onCardSelect}
              />
            </div>
          ))}
          {playerField.length === 0 && (
            <div className="text-amber-100 text-xs italic py-8">Нет карт на поле</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Battlefield;
