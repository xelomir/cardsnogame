import React, { useState, useEffect } from 'react';
import { Card as CardType, CardAbility, AnimationType } from '../types';

interface CardProps {
  card: CardType;
  playable?: boolean;
  inHand?: boolean;
  inField?: boolean;
  onClick?: (card: CardType) => void;
}

export const Card = ({ card, playable = false, inHand = false, inField = false, onClick }: CardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<AnimationType | null>(null);

  useEffect(() => {
    // Обработка анимаций
    if (card.isAnimating && card.animationType) {
      setIsAnimating(true);
      setAnimationType(card.animationType);

      // Завершаем анимацию через определенное время
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setAnimationType(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [card.isAnimating, card.animationType]);

  const handleClick = () => {
    if (playable && onClick) {
      onClick(card);
    }
  };

  const getCardImage = () => {
    if (card.imageUrl) {
      return <img src={card.imageUrl} alt={card.name} className="w-full h-24 object-cover" />;
    }

    // Fallback image based on card type
    return (
      <div className={`w-full h-24 flex items-center justify-center ${card.type === 'spell' ? 'bg-blue-300' : 'bg-amber-300'}`}>
        <span className="text-2xl font-bold text-center">{card.name.charAt(0)}</span>
      </div>
    );
  };

  // Получение иконок для способностей карты
  const getAbilityIcons = () => {
    if (!card.abilities || card.abilities.length === 0) return null;

    return (
      <div className="ability-icons absolute top-1 right-1 flex gap-1">
        {card.abilities.map((ability, index) => (
          <div key={index} className="ability-icon w-5 h-5 rounded-full flex items-center justify-center" title={getAbilityName(ability)}>
            {getAbilitySymbol(ability)}
          </div>
        ))}
      </div>
    );
  };

  // Получение символа для способности
  const getAbilitySymbol = (ability: CardAbility): React.ReactNode => {
    switch (ability) {
      case 'taunt':
        return <div className="bg-red-500 w-4 h-4 rounded-full border border-white" title="Провокация" />;
      case 'charge':
        return <div className="bg-green-500 w-4 h-4 rounded-full border border-white" title="Заряд" />;
      case 'divine_shield':
        return <div className="bg-yellow-300 w-4 h-4 rounded-full border border-white" title="Божественный щит" />;
      case 'poison':
        return <div className="bg-green-700 w-4 h-4 rounded-full border border-white" title="Яд" />;
      case 'lifesteal':
        return <div className="bg-purple-600 w-4 h-4 rounded-full border border-white" title="Вампиризм" />;
      default:
        return <div className="bg-gray-500 w-4 h-4 rounded-full" />;
    }
  };

  // Получение названия способности
  const getAbilityName = (ability: CardAbility): string => {
    switch (ability) {
      case 'taunt': return 'Провокация';
      case 'charge': return 'Заряд';
      case 'divine_shield': return 'Божественный щит';
      case 'poison': return 'Яд';
      case 'lifesteal': return 'Вампиризм';
      default: return '';
    }
  };

  // Calculate card classes
  const cardClasses = `
    card
    ${card.type === 'minion' ? 'card-minion' : 'card-spell'}
    ${playable ? 'card-playable cursor-pointer' : 'cursor-default'}
    ${inHand ? 'hover:translate-y-[-20px] hover:scale-110' : ''}
    ${inField ? 'scale-90' : ''}
    ${isHovered ? 'z-10' : 'z-0'}
    ${card.abilities?.includes('taunt') ? 'card-taunt' : ''}
    ${isAnimating ? `animate-${animationType}` : ''}
    w-32
  `;

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cost */}
      <div className="stat mana absolute top-1 left-1 w-8 h-8 text-xl">
        {card.cost}
      </div>

      {/* Ability Icons */}
      {getAbilityIcons()}

      {/* Card Title */}
      <div className="card-title text-sm mt-6">
        {card.name}
      </div>

      {/* Card Image */}
      {getCardImage()}

      {/* Card Description */}
      <div className="p-2 text-xs text-center h-16 overflow-hidden" style={{ color: '#561d18' }}>
        {card.description}
      </div>

      {/* Attack & Health for minion cards */}
      {card.type === 'minion' && (
        <div className="absolute bottom-1 w-full flex justify-between px-1">
          <div className="stat attack w-7 h-7 text-sm">
            {card.attack || 0}
          </div>
          <div className="stat health w-7 h-7 text-sm">
            {card.health || 0}
          </div>
        </div>
      )}

      {/* Индикатор потраченной атаки */}
      {inField && card.hasAttacked && (
        <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">Атаковал</span>
        </div>
      )}
    </div>
  );
};

export default Card;
