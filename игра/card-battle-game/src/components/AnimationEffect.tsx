import React, { useEffect, useState } from 'react';
import { Animation } from '../types';

interface AnimationEffectProps {
  animation: Animation;
  onAnimationComplete: (id: string) => void;
}

export const AnimationEffect = ({ animation, onAnimationComplete }: AnimationEffectProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Находим элементы источника и цели анимации
    const sourceElement = document.getElementById(animation.sourceId);
    const targetElement = animation.targetId ? document.getElementById(animation.targetId) : null;

    if (sourceElement) {
      const sourceRect = sourceElement.getBoundingClientRect();

      // Устанавливаем начальную позицию
      setPosition({
        x: sourceRect.left + sourceRect.width / 2,
        y: sourceRect.top + sourceRect.height / 2,
      });

      // Если есть цель, то устанавливаем анимацию перемещения к ней
      if (targetElement) {
        const targetRect = targetElement.getBoundingClientRect();

        const targetPosition = {
          x: targetRect.left + targetRect.width / 2,
          y: targetRect.top + targetRect.height / 2,
        };

        // Анимация перемещения
        const animateMovement = () => {
          const moveDuration = animation.duration * 0.7; // 70% времени на движение
          const steps = 20;
          const stepTime = moveDuration / steps;
          let step = 0;

          const intervalId = setInterval(() => {
            step++;

            if (step >= steps) {
              clearInterval(intervalId);

              // По завершению движения через некоторое время завершаем анимацию
              setTimeout(() => {
                setIsVisible(false);
                onAnimationComplete(animation.id);
              }, animation.duration * 0.3);
            } else {
              const progress = step / steps;
              setPosition({
                x: sourceRect.left + (targetPosition.x - sourceRect.left) * progress,
                y: sourceRect.top + (targetPosition.y - sourceRect.top) * progress,
              });
            }
          }, stepTime);

          return () => clearInterval(intervalId);
        };

        const cleanup = animateMovement();
        return cleanup;
      } else {
        // Если нет цели, просто показываем эффект и скрываем через timeout
        const timer = setTimeout(() => {
          setIsVisible(false);
          onAnimationComplete(animation.id);
        }, animation.duration);

        return () => clearTimeout(timer);
      }
    }

    // Если нет источника, скрываем эффект
    setIsVisible(false);
    onAnimationComplete(animation.id);

    return undefined;
  }, [animation, onAnimationComplete]);

  if (!isVisible) return null;

  // Получаем класс на основе типа анимации
  const getAnimationClass = () => {
    switch (animation.type) {
      case 'attack': return 'animation-attack';
      case 'damage': return 'animation-damage';
      case 'heal': return 'animation-heal';
      case 'spell': return 'animation-spell';
      case 'death': return 'animation-death';
      case 'summon': return 'animation-summon';
      case 'buff': return 'animation-buff';
      default: return '';
    }
  };

  // Получаем содержимое эффекта
  const getAnimationContent = () => {
    switch (animation.type) {
      case 'damage':
        return <span className="text-red-500 font-bold">-{animation.value}</span>;
      case 'heal':
        return <span className="text-green-500 font-bold">+{animation.value}</span>;
      case 'spell':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500 opacity-80 animate-pulse">
            <span className="text-white font-bold">✨</span>
          </div>
        );
      case 'attack':
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-500 opacity-80">
            <span className="text-white font-bold">⚔️</span>
          </div>
        );
      case 'buff':
        return <span className="text-yellow-400 font-bold">+{animation.value}/+{animation.value}</span>;
      default:
        return null;
    }
  };

  return (
    <div
      className={`absolute z-50 transform -translate-x-1/2 -translate-y-1/2 ${getAnimationClass()}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: 'none', // Чтобы эффект не мешал взаимодействию
      }}
    >
      {getAnimationContent()}
    </div>
  );
};

export default AnimationEffect;
