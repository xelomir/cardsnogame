import { Card, GameState, Player, Hero, AIDifficulty, AnimationType } from '../types';
import { createLogEntry, drawCard, playCard } from './game';

// Определить наилучшую карту для игры ИИ в зависимости от сложности
export const getBestCardToPlay = (hand: Card[], mana: number, difficulty: AIDifficulty): Card | null => {
  // Фильтруем карты, которые можно сыграть
  const playableCards = hand.filter(card => card.cost <= mana);

  if (playableCards.length === 0) {
    return null;
  }

  // Для разных уровней сложности - разные стратегии
  if (difficulty === 'easy') {
    // На легком уровне сложности ИИ играет случайную карту из доступных
    return playableCards[Math.floor(Math.random() * playableCards.length)];
  } else if (difficulty === 'normal') {
    // На среднем уровне сложности ИИ играет карту с наивысшей стоимостью
    return [...playableCards].sort((a, b) => b.cost - a.cost)[0];
  } else if (difficulty === 'hard') {
    // На сложном уровне ИИ оценивает карты по их ценности
    const cardValues = playableCards.map(card => {
      let value = card.cost; // Базовое значение - стоимость карты

      if (card.type === 'minion') {
        // Учитываем урон и здоровье миньона
        value += (card.attack || 0) + (card.health || 0) * 0.8;

        // Бонусы за особые способности
        if (card.abilities) {
          if (card.abilities.includes('taunt')) value += 2;
          if (card.abilities.includes('divine_shield')) value += 2;
          if (card.abilities.includes('charge')) value += 1.5;
          if (card.abilities.includes('poison')) value += 2;
          if (card.abilities.includes('lifesteal')) value += 1.8;
        }
      } else if (card.type === 'spell') {
        // Для заклинаний оцениваем их эффекты
        if (card.effects) {
          for (const effect of card.effects) {
            switch (effect.type) {
              case 'damage':
                value += effect.value * 1.2;
                break;
              case 'heal':
                value += effect.value * 0.8;
                break;
              case 'draw':
                value += effect.value * 1.5;
                break;
              case 'buff':
                value += effect.value * 2;
                break;
              default:
                break;
            }
          }
        }
      }

      return { card, value };
    });

    // Сортируем карты по их ценности (от большей к меньшей)
    cardValues.sort((a, b) => b.value - a.value);

    return cardValues[0].card;
  }

  // По умолчанию возвращаем первую карту
  return playableCards[0];
};

// Определить наилучшую цель для атаки в зависимости от сложности
export const getBestAttackTarget = (
  opponentField: Card[],
  opponentHero: Hero,
  difficulty: AIDifficulty
): { target: Card | Hero; isHero: boolean } => {
  if (opponentField.length === 0) {
    // Если поле пустое, атакуем героя
    return { target: opponentHero, isHero: true };
  }

  // Проверяем, есть ли миньоны с провокацией
  const taunts = opponentField.filter(card => card.abilities?.includes('taunt'));
  if (taunts.length > 0) {
    // Если есть провокация, должны атаковать таунт-миньонов
    // Сортируем таунты по угрозе на сложном уровне
    if (difficulty === 'hard') {
      const sortedTaunts = [...taunts].sort((a, b) => {
        const threatA = (a.attack || 0) * (a.health || 1);
        const threatB = (b.attack || 0) * (b.health || 1);
        return threatB - threatA;
      });
      return { target: sortedTaunts[0], isHero: false };
    }

    // На других уровнях - случайный таунт
    return { target: taunts[Math.floor(Math.random() * taunts.length)], isHero: false };
  }

  if (difficulty === 'easy') {
    // На легком уровне ИИ атакует случайную цель
    if (Math.random() < 0.4) {
      return { target: opponentHero, isHero: true };
    }
    return { target: opponentField[Math.floor(Math.random() * opponentField.length)], isHero: false };
  } else if (difficulty === 'normal') {
    // На среднем уровне ИИ атакует наиболее угрожающего миньона или героя с 30% шансом
    if (Math.random() < 0.3) {
      return { target: opponentHero, isHero: true };
    }

    const sortedCards = [...opponentField].sort((a, b) => {
      const threatA = (a.attack || 0) * (a.health || 1);
      const threatB = (b.attack || 0) * (b.health || 1);
      return threatB - threatA;
    });

    return { target: sortedCards[0], isHero: false };
  } else if (difficulty === 'hard') {
    // На сложном уровне ИИ оценивает, что выгоднее - атаковать героя или миньона
    // Сортируем миньонов по угрозе
    const getAbilityValue = (card: Card): number => {
      let value = 0;
      if (card.abilities) {
        if (card.abilities.includes('divine_shield')) value += 2;
        if (card.abilities.includes('poison')) value += 3;
        if (card.abilities.includes('lifesteal')) value += 2;
      }
      return value;
    };

    const sortedMinions = [...opponentField].sort((a, b) => {
      const valueA = (a.attack || 0) * 1.5 + (a.health || 1) + getAbilityValue(a);
      const valueB = (b.attack || 0) * 1.5 + (b.health || 1) + getAbilityValue(b);

      return valueB - valueA;
    });

    // Оценка для героя
    // Если здоровье героя <= 10, или мы можем нанести летальный урон - атакуем героя
    if (opponentHero.health <= 10 || opponentHero.health <= 15 && Math.random() < 0.7) {
      return { target: opponentHero, isHero: true };
    }

    // Иначе атакуем ценного миньона
    return { target: sortedMinions[0], isHero: false };
  }

  // По умолчанию атакуем героя
  return { target: opponentHero, isHero: true };
};

// Выполнить ход ИИ
export const performAITurn = (gameState: GameState): GameState => {
  const { opponent, player, difficulty } = gameState;

  // Копии для изменения
  let updatedOpponent = { ...opponent };
  let updatedPlayer = { ...player };
  const log = [...gameState.log];

  // Добавляем запись в лог о начале хода ИИ
  log.push(createLogEntry('Ход противника начался', gameState.turn));

  // 1. Берем карту
  const drawResult = drawCard(updatedOpponent);
  updatedOpponent = drawResult.updatedPlayer;

  if (drawResult.drawnCard) {
    log.push(createLogEntry('Противник взял карту', gameState.turn));
  } else {
    log.push(createLogEntry('У противника закончились карты в колоде!', gameState.turn));
  }

  // 2. Играем карты (пока есть мана и подходящие карты)
  let continuePlaying = true;
  let cardsPlayed = 0;

  while (continuePlaying) {
    const bestCard = getBestCardToPlay(updatedOpponent.hand, updatedOpponent.mana, difficulty);

    if (!bestCard) {
      continuePlaying = false;
      continue;
    }

    const playResult = playCard(updatedOpponent, bestCard.id);

    if (playResult.playedCard) {
      updatedOpponent = playResult.updatedPlayer;
      cardsPlayed++;

      log.push(createLogEntry(`Противник сыграл карту "${playResult.playedCard.name}"`, gameState.turn));

      // Если карта заклинание, применяем её эффект
      if (playResult.playedCard.type === 'spell' && playResult.playedCard.effects) {
        log.push(createLogEntry(`Противник применил заклинание "${playResult.playedCard.name}"`, gameState.turn));

        // Обработка эффектов заклинаний
        for (const effect of playResult.playedCard.effects) {
          switch (effect.type) {
            case 'damage':
              if (effect.target === 'enemy') {
                // Урон по герою игрока
                const updatedHero = {
                  ...updatedPlayer.hero,
                  health: Math.max(0, updatedPlayer.hero.health - effect.value),
                  isAnimating: true,
                  animationType: 'damage' as AnimationType,
                };

                updatedPlayer = {
                  ...updatedPlayer,
                  hero: updatedHero,
                };

                log.push(createLogEntry(`Заклинание нанесло ${effect.value} урона вашему герою`, gameState.turn));
              } else if (effect.target === 'allEnemies') {
                // Урон по всем существам игрока
                updatedPlayer = {
                  ...updatedPlayer,
                  field: updatedPlayer.field.map(card => ({
                    ...card,
                    health: Math.max(0, (card.health || 0) - effect.value),
                    isAnimating: true,
                    animationType: 'damage' as AnimationType,
                  })).filter(card => (card.health || 0) > 0),
                };

                log.push(createLogEntry(`Заклинание нанесло ${effect.value} урона всем вашим существам`, gameState.turn));
              }
              break;

            case 'heal':
              if (effect.target === 'self') {
                // Лечение своего героя
                const updatedHero = {
                  ...updatedOpponent.hero,
                  health: Math.min(updatedOpponent.hero.maxHealth, updatedOpponent.hero.health + effect.value),
                  isAnimating: true,
                  animationType: 'heal' as AnimationType,
                };

                updatedOpponent = {
                  ...updatedOpponent,
                  hero: updatedHero,
                };

                log.push(createLogEntry(`Противник восстановил ${effect.value} здоровья своему герою`, gameState.turn));
              } else if (effect.target === 'allAllies') {
                // Лечение всех своих миньонов
                updatedOpponent = {
                  ...updatedOpponent,
                  field: updatedOpponent.field.map(card => ({
                    ...card,
                    health: Math.min((card.health || 1) + effect.value, card.health || 1),
                    isAnimating: true,
                    animationType: 'heal' as AnimationType,
                  })),
                };

                log.push(createLogEntry(`Противник восстановил ${effect.value} здоровья всем своим существам`, gameState.turn));
              }
              break;

            case 'buff':
              if (effect.target === 'allAllies') {
                // Усиление всех своих миньонов
                updatedOpponent = {
                  ...updatedOpponent,
                  field: updatedOpponent.field.map(card => ({
                    ...card,
                    attack: (card.attack || 0) + effect.value,
                    health: (card.health || 0) + effect.value,
                    isAnimating: true,
                    animationType: 'buff' as AnimationType,
                  })),
                };

                log.push(createLogEntry(`Противник усилил всех своих существ на +${effect.value}/+${effect.value}`, gameState.turn));
              }
              break;
          }
        }
      }
    } else {
      continuePlaying = false;
    }
  }

  // 3. Атакуем миньонами
  for (const card of updatedOpponent.field) {
    // Пропускаем карты, которые уже атаковали (кроме заряда при первом ходе)
    if (card.hasAttacked && !(card.abilities?.includes('charge') && !card.canAttackHero)) {
      continue;
    }

    const { target, isHero } = getBestAttackTarget(updatedPlayer.field, updatedPlayer.hero, difficulty);

    // Устанавливаем флаг, что карта атаковала
    card.hasAttacked = true;
    // Если карта с зарядом, позволяем ей атаковать героя в следующий ход
    if (card.abilities?.includes('charge') && !card.canAttackHero) {
      card.canAttackHero = true;
    }

    if (isHero) {
      // Атакуем героя игрока
      const damage = card.attack || 0;

      const updatedHero = {
        ...updatedPlayer.hero,
        health: Math.max(0, updatedPlayer.hero.health - damage),
        isAnimating: true,
        animationType: 'damage' as AnimationType,
      };

      updatedPlayer = {
        ...updatedPlayer,
        hero: updatedHero,
      };

      // Добавляем эффект анимации
      card.isAnimating = true;
      card.animationType = 'attack' as AnimationType;

      log.push(createLogEntry(`Миньон противника "${card.name}" атаковал вашего героя и нанёс ${damage} урона`, gameState.turn));

      // Применение вампиризма, если есть
      if (card.abilities?.includes('lifesteal')) {
        const healAmount = damage;
        const healedHero = {
          ...updatedOpponent.hero,
          health: Math.min(updatedOpponent.hero.maxHealth, updatedOpponent.hero.health + healAmount),
          isAnimating: true,
          animationType: 'heal' as AnimationType,
        };

        updatedOpponent = {
          ...updatedOpponent,
          hero: healedHero,
        };

        log.push(createLogEntry(`Миньон "${card.name}" восстановил ${healAmount} здоровья герою противника`, gameState.turn));
      }
    } else {
      // Атакуем миньона игрока
      const targetCard = target as Card;
      const targetIndex = updatedPlayer.field.findIndex(c => c.id === targetCard.id);

      if (targetIndex !== -1) {
        let attackerHealth = (card.health || 0);
        let defenderHealth = (targetCard.health || 0);

        // Обработка божественного щита
        const attackerHasShield = card.abilities?.includes('divine_shield');
        const defenderHasShield = targetCard.abilities?.includes('divine_shield');

        // Если у атакующего яд, защитник умирает (если нет щита)
        if (card.abilities?.includes('poison') && !defenderHasShield) {
          defenderHealth = 0;
        } else if (!defenderHasShield) {
          // Обычный урон
          defenderHealth -= (card.attack || 0);
        }

        // Если у защитника яд, атакующий умирает (если нет щита)
        if (targetCard.abilities?.includes('poison') && !attackerHasShield) {
          attackerHealth = 0;
        } else if (!attackerHasShield) {
          // Обычный урон
          attackerHealth -= (targetCard.attack || 0);
        }

        // Обновляем здоровье карт и удаляем щиты
        const updatedAttacker = {
          ...card,
          health: attackerHealth,
          abilities: attackerHasShield
            ? card.abilities?.filter(a => a !== 'divine_shield')
            : card.abilities,
          isAnimating: true,
          animationType: 'attack' as AnimationType,
        };

        const updatedDefender = {
          ...targetCard,
          health: defenderHealth,
          abilities: defenderHasShield
            ? targetCard.abilities?.filter(a => a !== 'divine_shield')
            : targetCard.abilities,
          isAnimating: true,
          animationType: 'damage' as AnimationType,
        };

        // Обновляем поля боя, удаляя уничтоженные карты
        if (attackerHealth <= 0) {
          updatedOpponent = {
            ...updatedOpponent,
            field: updatedOpponent.field.filter(c => c.id !== card.id),
          };

          log.push(createLogEntry(`Миньон противника "${card.name}" был уничтожен`, gameState.turn));
        } else {
          updatedOpponent = {
            ...updatedOpponent,
            field: updatedOpponent.field.map(c => c.id === card.id ? updatedAttacker : c),
          };
        }

        if (defenderHealth <= 0) {
          updatedPlayer = {
            ...updatedPlayer,
            field: updatedPlayer.field.filter(c => c.id !== targetCard.id),
          };

          log.push(createLogEntry(`Ваш миньон "${targetCard.name}" был уничтожен`, gameState.turn));
        } else {
          updatedPlayer = {
            ...updatedPlayer,
            field: updatedPlayer.field.map(c => c.id === targetCard.id ? updatedDefender : c),
          };
        }

        log.push(createLogEntry(`Миньон противника "${card.name}" атаковал вашего миньона "${targetCard.name}"`, gameState.turn));

        // Применение вампиризма, если есть
        if (card.abilities?.includes('lifesteal') && (card.attack || 0) > 0) {
          const healAmount = card.attack || 0;
          const healedHero = {
            ...updatedOpponent.hero,
            health: Math.min(updatedOpponent.hero.maxHealth, updatedOpponent.hero.health + healAmount),
            isAnimating: true,
            animationType: 'heal' as AnimationType,
          };

          updatedOpponent = {
            ...updatedOpponent,
            hero: healedHero,
          };

          log.push(createLogEntry(`Миньон "${card.name}" восстановил ${healAmount} здоровья герою противника`, gameState.turn));
        }
      }
    }
  }

  // 4. Используем силу героя, если есть мана (на сложном всегда, на среднем с шансом 70%, на легком с шансом 40%)
  const useHeroPower =
    difficulty === 'hard' ? true :
    difficulty === 'normal' ? Math.random() < 0.7 :
    Math.random() < 0.4;

  if (useHeroPower && updatedOpponent.mana >= updatedOpponent.hero.heroPower.cost) {
    // Применяем силу героя (в простой версии наносим 1 урон герою игрока)
    const updatedHero = {
      ...updatedPlayer.hero,
      health: Math.max(0, updatedPlayer.hero.health - 1),
      isAnimating: true,
      animationType: 'damage' as AnimationType,
    };

    updatedPlayer = {
      ...updatedPlayer,
      hero: updatedHero,
    };

    updatedOpponent = {
      ...updatedOpponent,
      mana: updatedOpponent.mana - updatedOpponent.hero.heroPower.cost,
    };

    log.push(createLogEntry('Противник использовал силу героя', gameState.turn));
  }

  // 5. Завершаем ход
  log.push(createLogEntry('Ход противника завершен', gameState.turn));

  // Сбрасываем флаги атаки для карт на поле
  updatedOpponent = {
    ...updatedOpponent,
    field: updatedOpponent.field.map(card => ({
      ...card,
      hasAttacked: false,
    })),
  };

  // Обновляем статистику, увеличивая счетчик сыгранных карт
  const updatedStatistics = {
    ...gameState.statistics,
    totalCardsPlayed: gameState.statistics.totalCardsPlayed + cardsPlayed,
  };

  // Возвращаем обновленное состояние игры
  return {
    ...gameState,
    player: updatedPlayer,
    opponent: updatedOpponent,
    currentPlayerId: player.id,
    log,
    statistics: updatedStatistics,
  };
};
