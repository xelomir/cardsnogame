import { Card, CardType, Effect, EffectType, TargetType, CardAbility } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Генерация ID для карты
export const generateCardId = (): string => {
  return uuidv4();
};

// Создание карты
export const createCard = (
  name: string,
  cost: number,
  type: CardType,
  description: string,
  attack?: number,
  health?: number,
  effects: Effect[] = [],
  abilities: CardAbility[] = []
): Card => {
  return {
    id: generateCardId(),
    name,
    cost,
    type,
    description,
    attack,
    health,
    effects,
    abilities,
    hasAttacked: false,
    canAttackHero: abilities.includes('charge'),
    isAnimating: false,
  };
};

// Создание эффекта
export const createEffect = (
  type: EffectType,
  value: number,
  target: TargetType
): Effect => {
  return {
    type,
    value,
    target,
  };
};

// Перетасовка колоды
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

// Пример карт для игры
export const getInitialDeck = (): Card[] => {
  const deck: Card[] = [
    // Базовые миньоны
    createCard(
      'Пехотинец',
      1,
      'minion',
      'Обычный солдат на передовой.',
      1,
      2
    ),
    createCard(
      'Лучник',
      2,
      'minion',
      'Наносит урон с расстояния.',
      2,
      1
    ),
    createCard(
      'Рыцарь',
      3,
      'minion',
      'Защитник королевства.',
      3,
      3
    ),

    // Заклинания
    createCard(
      'Огненный шар',
      2,
      'spell',
      'Наносит 3 урона выбранной цели.',
      undefined,
      undefined,
      [createEffect('damage', 3, 'enemy')]
    ),
    createCard(
      'Исцеление',
      1,
      'spell',
      'Восстанавливает 3 здоровья выбранной цели.',
      undefined,
      undefined,
      [createEffect('heal', 3, 'self')]
    ),

    // Танк с провокацией
    createCard(
      'Страж',
      4,
      'minion',
      'Провокация. Враги должны атаковать этого миньона в первую очередь.',
      2,
      5,
      [],
      ['taunt']
    ),

    // Миньон с зарядом
    createCard(
      'Налётчик',
      3,
      'minion',
      'Заряд. Может атаковать в тот же ход, когда был разыгран.',
      4,
      2,
      [],
      ['charge']
    ),

    // Миньон с божественным щитом
    createCard(
      'Паладин',
      5,
      'minion',
      'Божественный щит. Игнорирует первый полученный урон.',
      3,
      4,
      [],
      ['divine_shield']
    ),

    // Миньон с ядом
    createCard(
      'Ядовитый змей',
      3,
      'minion',
      'Яд. Уничтожает любое существо, которому наносит урон.',
      2,
      2,
      [],
      ['poison']
    ),

    // Миньон с вампиризмом
    createCard(
      'Вампир',
      4,
      'minion',
      'Вампиризм. Восстанавливает здоровье вашему герою равное нанесенному урону.',
      3,
      3,
      [],
      ['lifesteal']
    ),

    // Мощный миньон
    createCard(
      'Щитоносец',
      4,
      'minion',
      'Крепкий защитник с повышенной выживаемостью.',
      2,
      5
    ),
    createCard(
      'Берсерк',
      5,
      'minion',
      'Мощный удар, но меньше здоровья.',
      6,
      3
    ),

    // Мощные заклинания
    createCard(
      'Метеоритный дождь',
      6,
      'spell',
      'Наносит 4 урона всем существам противника.',
      undefined,
      undefined,
      [createEffect('damage', 4, 'allEnemies')]
    ),
    createCard(
      'Массовое исцеление',
      4,
      'spell',
      'Восстанавливает 2 здоровья всем дружественным существам.',
      undefined,
      undefined,
      [createEffect('heal', 2, 'allAllies')]
    ),
    createCard(
      'Боевой клич',
      3,
      'spell',
      'Усиливает всех союзных существ на +1/+1.',
      undefined,
      undefined,
      [createEffect('buff', 1, 'allAllies')]
    ),

    // Дополнительные копии некоторых карт для колоды
    createCard(
      'Пехотинец',
      1,
      'minion',
      'Обычный солдат на передовой.',
      1,
      2
    ),
    createCard(
      'Лучник',
      2,
      'minion',
      'Наносит урон с расстояния.',
      2,
      1
    ),
    createCard(
      'Огненный шар',
      2,
      'spell',
      'Наносит 3 урона выбранной цели.',
      undefined,
      undefined,
      [createEffect('damage', 3, 'enemy')]
    ),
    createCard(
      'Исцеление',
      1,
      'spell',
      'Восстанавливает 3 здоровья выбранной цели.',
      undefined,
      undefined,
      [createEffect('heal', 3, 'self')]
    ),

    // Танк с провокацией (дополнительная копия)
    createCard(
      'Страж',
      4,
      'minion',
      'Провокация. Враги должны атаковать этого миньона в первую очередь.',
      2,
      5,
      [],
      ['taunt']
    ),
  ];

  return shuffleDeck(deck);
};
