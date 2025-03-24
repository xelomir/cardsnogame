import { Card, Effect, GameLogEntry, GameState, Hero, Player, GameStatistics } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { getInitialDeck } from './cards';

// Создать героя
export const createHero = (id: string, name: string, health: number, heroPower: any): Hero => {
  return {
    id,
    name,
    health,
    maxHealth: health,
    armor: 0,
    heroPower,
  };
};

// Создать игрока
export const createPlayer = (id: string, hero: Hero): Player => {
  const deck = getInitialDeck();

  return {
    id,
    hero,
    hand: [],
    deck,
    field: [],
    mana: 0,
    maxMana: 0,
  };
};

// Создать запись в логе игры
export const createLogEntry = (text: string, turn: number): GameLogEntry => {
  return {
    id: uuidv4(),
    text,
    turn,
    timestamp: Date.now(),
  };
};

// Получить сохраненную статистику
export const getSavedStatistics = (): GameStatistics => {
  try {
    const savedStats = localStorage.getItem('cardGameStats');
    if (savedStats) {
      return JSON.parse(savedStats);
    }
  } catch (error) {
    console.error('Ошибка при загрузке статистики:', error);
  }

  // Возвращаем пустую статистику, если нет сохраненной
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    totalDamageDealt: 0,
    totalCardsPlayed: 0,
    totalTurns: 0,
    favoriteCards: {},
  };
};

// Сохранить статистику
export const saveStatistics = (stats: GameStatistics): void => {
  try {
    localStorage.setItem('cardGameStats', JSON.stringify(stats));
  } catch (error) {
    console.error('Ошибка при сохранении статистики:', error);
  }
};

// Обновить статистику при завершении игры
export const updateStatistics = (
  gameState: GameState,
  result: 'win' | 'loss' | 'draw',
  damageDealt: number,
  cardsPlayed: number
): GameState => {
  const updatedStats = { ...gameState.statistics };

  updatedStats.gamesPlayed += 1;
  updatedStats.totalTurns += gameState.turn;
  updatedStats.totalDamageDealt += damageDealt;
  updatedStats.totalCardsPlayed += cardsPlayed;

  if (result === 'win') {
    updatedStats.gamesWon += 1;
  } else if (result === 'loss') {
    updatedStats.gamesLost += 1;
  }

  // Сохраняем обновленную статистику
  saveStatistics(updatedStats);

  return {
    ...gameState,
    statistics: updatedStats,
  };
};

// Начальное состояние игры
export const getInitialGameState = (): GameState => {
  // Создаем героев и силы героев
  const playerHeroPower = {
    id: 'hero-power-1',
    name: 'Восстановление',
    cost: 2,
    description: 'Восстанавливает 2 здоровья.',
    effect: {
      type: 'heal',
      value: 2,
      target: 'self',
    },
  };

  const opponentHeroPower = {
    id: 'hero-power-2',
    name: 'Огненный взрыв',
    cost: 2,
    description: 'Наносит 1 урона.',
    effect: {
      type: 'damage',
      value: 1,
      target: 'enemy',
    },
  };

  const playerHero = createHero('hero-1', 'Светозар', 30, playerHeroPower);
  const opponentHero = createHero('hero-2', 'Темный Маг', 30, opponentHeroPower);

  // Создаем игроков
  const player = createPlayer('player-1', playerHero);
  const opponent = createPlayer('player-2', opponentHero);

  // Получаем сохраненную статистику из localStorage или создаем новую
  const savedStats = getSavedStatistics();

  // Начальное состояние игры
  return {
    player,
    opponent,
    turn: 1,
    currentPlayerId: player.id,
    gameStatus: 'waiting',
    log: [
      createLogEntry('Игра началась!', 0),
    ],
    // Новые поля
    difficulty: 'normal', // По умолчанию средняя сложность
    statistics: savedStats,
    activeAnimations: [],
  };
};

// Взять карту из колоды
export const drawCard = (player: Player): { updatedPlayer: Player; drawnCard: Card | null } => {
  if (player.deck.length === 0) {
    return {
      updatedPlayer: player,
      drawnCard: null,
    };
  }

  const [drawnCard, ...remainingDeck] = player.deck;
  const updatedPlayer = {
    ...player,
    hand: [...player.hand, drawnCard],
    deck: remainingDeck,
  };

  return {
    updatedPlayer,
    drawnCard,
  };
};

// Взять начальную руку
export const drawInitialHand = (player: Player, cardCount: number): Player => {
  let updatedPlayer = { ...player };

  for (let i = 0; i < cardCount; i++) {
    const result = drawCard(updatedPlayer);
    updatedPlayer = result.updatedPlayer;
  }

  return updatedPlayer;
};

// Сыграть карту
export const playCard = (player: Player, cardId: string): {
  updatedPlayer: Player;
  playedCard: Card | null;
} => {
  const cardIndex = player.hand.findIndex(card => card.id === cardId);

  if (cardIndex === -1) {
    return {
      updatedPlayer: player,
      playedCard: null,
    };
  }

  const playedCard = player.hand[cardIndex];

  // Проверка, хватает ли маны
  if (playedCard.cost > player.mana) {
    return {
      updatedPlayer: player,
      playedCard: null,
    };
  }

  const updatedHand = [
    ...player.hand.slice(0, cardIndex),
    ...player.hand.slice(cardIndex + 1),
  ];

  let updatedField = player.field;

  // Если карта существа, добавляем на поле
  if (playedCard.type === 'minion') {
    updatedField = [...player.field, playedCard];
  }

  // Обновляем игрока
  const updatedPlayer = {
    ...player,
    hand: updatedHand,
    field: updatedField,
    mana: player.mana - playedCard.cost,
  };

  return {
    updatedPlayer,
    playedCard,
  };
};

// Атаковать карту
export const attackCard = (
  attacker: Card,
  defender: Card,
  attackerField: Card[],
  defenderField: Card[]
): {
  updatedAttackerField: Card[];
  updatedDefenderField: Card[];
} => {
  // Наносим урон
  const updatedDefender = {
    ...defender,
    health: (defender.health || 0) - (attacker.attack || 0),
  };

  const updatedAttacker = {
    ...attacker,
    health: (attacker.health || 0) - (defender.attack || 0),
  };

  // Обновляем поля боя
  let updatedAttackerField = attackerField.map(card =>
    card.id === attacker.id ? updatedAttacker : card
  );

  let updatedDefenderField = defenderField.map(card =>
    card.id === defender.id ? updatedDefender : card
  );

  // Удаляем уничтоженные карты
  updatedAttackerField = updatedAttackerField.filter(card => (card.health || 0) > 0);
  updatedDefenderField = updatedDefenderField.filter(card => (card.health || 0) > 0);

  return {
    updatedAttackerField,
    updatedDefenderField,
  };
};

// Атаковать героя
export const attackHero = (
  attacker: Card,
  hero: Hero,
): Hero => {
  // Сначала тратим броню, если она есть
  let remainingDamage = attacker.attack || 0;
  let updatedArmor = hero.armor;

  if (updatedArmor > 0) {
    if (updatedArmor >= remainingDamage) {
      updatedArmor -= remainingDamage;
      remainingDamage = 0;
    } else {
      remainingDamage -= updatedArmor;
      updatedArmor = 0;
    }
  }

  // Затем наносим урон здоровью
  const updatedHealth = Math.max(0, hero.health - remainingDamage);

  return {
    ...hero,
    health: updatedHealth,
    armor: updatedArmor,
  };
};

// Проверить, закончилась ли игра
export const checkGameOver = (gameState: GameState): GameState => {
  const { player, opponent } = gameState;

  if (player.hero.health <= 0 && opponent.hero.health <= 0) {
    return {
      ...gameState,
      gameStatus: 'draw',
      log: [
        ...gameState.log,
        createLogEntry('Игра завершилась ничьей!', gameState.turn),
      ],
    };
  }

  if (player.hero.health <= 0) {
    return {
      ...gameState,
      gameStatus: 'playerLost',
      log: [
        ...gameState.log,
        createLogEntry('Вы проиграли!', gameState.turn),
      ],
    };
  }

  if (opponent.hero.health <= 0) {
    return {
      ...gameState,
      gameStatus: 'playerWon',
      log: [
        ...gameState.log,
        createLogEntry('Вы победили!', gameState.turn),
      ],
    };
  }

  return gameState;
};
