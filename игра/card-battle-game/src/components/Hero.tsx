import React from 'react';
import { Hero as HeroType } from '../types';

interface HeroProps {
  hero: HeroType;
  isPlayer: boolean;
  onHeroPowerClick?: () => void;
  heroPowerUsable?: boolean;
}

export const Hero = ({ hero, isPlayer, onHeroPowerClick, heroPowerUsable = false }: HeroProps) => {
  const getHeroImage = () => {
    if (hero.imageUrl) {
      return <img src={hero.imageUrl} alt={hero.name} className="w-full h-full object-cover rounded-md" />;
    }

    // Fallback image
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-800 rounded-md">
        <span className="text-3xl font-bold text-center text-amber-100">{hero.name.charAt(0)}</span>
      </div>
    );
  };

  const heroPowerClasses = `
    hero-power
    w-12 h-12
    ${heroPowerUsable ? 'cursor-pointer card-playable' : 'opacity-70 cursor-default'}
  `;

  return (
    <div className="flex flex-col items-center">
      {/* Hero main container */}
      <div className="hero w-20 h-28">
        {getHeroImage()}

        {/* Health */}
        <div className="stat health absolute bottom-1 right-1 w-8 h-8">
          {hero.health}
        </div>

        {/* Armor if present */}
        {hero.armor > 0 && (
          <div className="absolute bottom-1 left-1 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center border-2 border-amber-600">
            <span className="text-white font-bold">{hero.armor}</span>
          </div>
        )}
      </div>

      {/* Hero name */}
      <div className="text-center text-sm mt-1 font-bold text-amber-100">{hero.name}</div>

      {/* Hero power */}
      <div
        className={heroPowerClasses}
        onClick={() => heroPowerUsable && onHeroPowerClick && onHeroPowerClick()}
        title={hero.heroPower.description}
      >
        <div className="text-xs text-center">{hero.heroPower.name.charAt(0)}</div>
        <div className="stat mana absolute top-0 right-0 w-5 h-5 text-xs">
          {hero.heroPower.cost}
        </div>
      </div>
    </div>
  );
};

export default Hero;
