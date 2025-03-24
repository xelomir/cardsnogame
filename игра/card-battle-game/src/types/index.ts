export type CardType = 'minion' | 'spell';

// Добавляем новые свойства карт
export type CardAbility = 'taunt' | 'charge' | 'divine_shield' | 'poison' | 'lifesteal';

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  imageUrl?: string;
  description: string;
  attack?: number;
  health?: number;
  effects?: Effect[];
  // Новые свойства карт
  abilities?: CardAbility[];
  hasAttacked?: boolean; // Флаг для отслеживания возможности атаки
  canAttackHero?: boolean; // Можно ли атаковать героя напрямую
  isAnimating?: boolean; // Для анимаций
  animationType?: AnimationType; // Тип анимации
}

export interface Effect {
  type: EffectType;
  value: number;
  target: TargetType;
}

export type EffectType = 'damage' | 'heal' | 'draw' | 'summon' | 'buff';
export type TargetType = 'self' | 'enemy' | 'all' | 'allEnemies' | 'allAllies' | 'randomEnemy' | 'randomAlly';
export type AnimationType = 'attack' | 'damage' | 'heal' | 'spell' | 'death' | 'summon' | 'buff';

export interface Player {
  id: string;
  hero: Hero;
  hand: Card[];
  deck: Card[];
  field: Card[];
  mana: number;
  maxMana: number;
}

export interface Hero {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  armor: number;
  imageUrl?: string;
  heroPower: HeroPower;
  // Для анимаций
  isAnimating?: boolean;
  animationType?: AnimationType;
}

export interface HeroPower {
  id: string;
  name: string;
  cost: number;
  description: string;
  effect: Effect;
}

export interface GameState {
  player: Player;
  opponent: Player;
  turn: number;
  currentPlayerId: string;
  gameStatus: GameStatus;
  log: GameLogEntry[];
  // Новые свойства для расширенных функций
  difficulty: AIDifficulty; // Сложность ИИ
  statistics: GameStatistics; // Статистика игры
  activeAnimations: Animation[]; // Активные анимации
}

// Добавляем уровни сложности для ИИ
export type AIDifficulty = 'easy' | 'normal' | 'hard';

// Статистика игры
export interface GameStatistics {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  totalDamageDealt: number;
  totalCardsPlayed: number;
  totalTurns: number;
  favoriteCards: Record<string, number>; // Имя карты -> количество раз сыгранных
}

// Анимации
export interface Animation {
  id: string;
  type: AnimationType;
  sourceId: string; // ID источника (карта, герой)
  targetId?: string; // ID цели (если есть)
  value?: number; // Значение (урон, лечение и т.д.)
  startTime: number;
  duration: number;
}

export type GameStatus = 'waiting' | 'inProgress' | 'playerWon' | 'playerLost' | 'draw';

export interface GameLogEntry {
  id: string;
  text: string;
  turn: number;
  timestamp: number;
}
