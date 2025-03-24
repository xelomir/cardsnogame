import React from 'react';
import { Card as CardType } from '../types';
import Card from './Card';

interface HandProps {
  cards: CardType[];
  playerMana: number;
  onCardPlay: (card: CardType) => void;
}

export const Hand = ({ cards, playerMana, onCardPlay }: HandProps) => {
  // Determine if a card is playable based on mana
  const isCardPlayable = (card: CardType) => {
    return card.cost <= playerMana;
  };

  // Calculate hand position adjustment based on number of cards
  const getHandStyles = () => {
    // Negative margin to overlap cards slightly
    const marginLeft = cards.length > 4 ? -15 * (cards.length - 4) : 0;

    return {
      marginLeft: `${marginLeft}px`,
    };
  };

  return (
    <div className="hand-container py-2 px-4">
      <div className="hand-cards flex justify-center" style={getHandStyles()}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="mx-1 transition-all duration-200"
            style={{
              zIndex: index,
              transform: `rotate(${-10 + (index * (20 / Math.max(cards.length - 1, 1)))}deg)`,
              transformOrigin: 'bottom center',
            }}
          >
            <Card
              card={card}
              playable={isCardPlayable(card)}
              inHand={true}
              onClick={onCardPlay}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Hand;
