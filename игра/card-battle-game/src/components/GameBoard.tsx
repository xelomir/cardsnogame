import React, { useEffect, useState } from 'react';
import { Card as CardType, GameState, Animation, AIDifficulty, AnimationType } from '../types';

import Hero from './Hero';
import Hand from './Hand';
import Battlefield from './Battlefield';
import ManaBar from './ManaBar';
import EndTurnButton from './EndTurnButton';
import GameStatus from './GameStatus';
import GameLog from './GameLog';
import DifficultySelector from './DifficultySelector';
import StatsPanel from './StatsPanel';
import AnimationEffect from './AnimationEffect';

import {
  getInitialGameState,
  checkGameOver,
  drawCard,
  playCard,
  createLogEntry,
  drawInitialHand,
  updateStatistics,
  saveStatistics
} from '../utils/game';
import { performAITurn } from '../utils/ai';
import {
  isTelegramWebApp,
  getTelegramWebApp,
  showTelegramPopup,
  showTelegramAlert,
  showTelegramConfirm,
  saveStatsToServer,
  loadStatsFromServer
} from '../utils/telegram';

export const GameBoard = () => {
  const [gameState, setGameState] = useState<GameState>(getInitialGameState());
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [attackMode, setAttackMode] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [showStats, setShowStats] = useState(false);

  // Начать новую игру
  const startNewGame = () => {
    let newGame = getInitialGameState();

    // Раздаем начальные карты
    const updatedPlayer = drawInitialHand(newGame.player, 3);
    const updatedOpponent = drawInitialHand(newGame.opponent, 3);

    // Устанавливаем начальную ману
    updatedPlayer.mana = 1;
    updatedPlayer.maxMana = 1;
    updatedOpponent.mana = 1;
    updatedOpponent.maxMana = 1;

    // Обновляем состояние игры
    newGame = {
      ...newGame,
      player: updatedPlayer,
      opponent: updatedOpponent,
      gameStatus: 'inProgress',
      log: [
        ...newGame.log,
        createLogEntry('Игра началась! Ваш ход', 1),
      ],
    };

    setGameState(newGame);
    setIsPlayerTurn(true);
    setSelectedCard(null);
    setAttackMode(false);
  };

  // Эффект при первой загрузке - начинаем игру и загружаем статистику из сервера
  useEffect(() => {
    // Загружаем статистику из сервера если мы в Telegram
    const loadStats = async () => {
      if (isTelegramWebApp()) {
        const stats = await loadStatsFromServer();
        if (stats) {
          // Обновляем состояние с загруженной статистикой
          setGameState(prevState => ({
            ...prevState,
            statistics: {
              ...prevState.statistics,
              ...stats
            }
          }));
        }
      }
    };

    loadStats();
    startNewGame();
  }, []);

  // Проверка на конец игры после каждого изменения состояния
  useEffect(() => {
    if (gameState.gameStatus === 'inProgress') {
      const newState = checkGameOver(gameState);
      if (newState.gameStatus !== 'inProgress') {
        let updatedState;
        if (newState.gameStatus === 'playerWon') {
          updatedState = updateStatistics(newState, 'win', 0, 0);
          // Показываем сообщение о победе в Telegram
          if (isTelegramWebApp()) {
            showTelegramPopup('Поздравляем! Вы победили!', 'Победа!');
          }
        } else if (newState.gameStatus === 'playerLost') {
          updatedState = updateStatistics(newState, 'loss', 0, 0);
          // Показываем сообщение о поражении в Telegram
          if (isTelegramWebApp()) {
            showTelegramPopup('Вы проиграли. Попробуйте еще раз!', 'Поражение');
          }
        } else {
          updatedState = updateStatistics(newState, 'draw', 0, 0);
          // Показываем сообщение о ничьей в Telegram
          if (isTelegramWebApp()) {
            showTelegramPopup('Игра закончилась вничью!', 'Ничья');
          }
        }

        // Сохраняем статистику на сервер если мы в Telegram
        if (isTelegramWebApp()) {
          saveStatsToServer(updatedState.statistics);
        } else {
          // Иначе сохраняем в localStorage
          saveStatistics(updatedState.statistics);
        }

        setGameState(updatedState);
      }
    }
  }, [gameState]);

  // Обработчик сброса статистики
  const handleResetStats = async () => {
    // Спрашиваем подтверждение в Telegram
    if (isTelegramWebApp()) {
      const confirmed = await showTelegramConfirm('Вы действительно хотите сбросить всю статистику?');
      if (!confirmed) return;
    }

    const newStats = {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalDamageDealt: 0,
      totalCardsPlayed: 0,
      totalTurns: 0,
      favoriteCards: {},
    };

    // Сохраняем в Telegram или localStorage
    if (isTelegramWebApp()) {
      await saveStatsToServer(newStats);
    } else {
      saveStatistics(newStats);
    }

    setGameState(prevState => ({
      ...prevState,
      statistics: newStats,
      log: [
        ...prevState.log,
        createLogEntry('Статистика сброшена', prevState.turn),
      ],
    }));

    // Показываем сообщение в Telegram
    if (isTelegramWebApp()) {
      showTelegramAlert('Статистика успешно сброшена');
    }
  };

  // Обработчик изменения сложности
  const handleDifficultyChange = (difficulty: AIDifficulty) => {
    setGameState(prevState => ({
      ...prevState,
      difficulty,
      log: [
        ...prevState.log,
        createLogEntry(`Уровень сложности изменен на "${difficulty}"`, prevState.turn),
      ],
    }));
  };

  // Обработчик завершения хода
  const handleEndTurn = () => {
    if (!isPlayerTurn) return;

    // Завершаем ход игрока
    setIsPlayerTurn(false);

    // Увеличиваем номер хода
    const nextTurn = gameState.turn + 1;

    // Увеличиваем ману противника
    const maxOpponentMana = Math.min(10, gameState.opponent.maxMana + 1);

    // Сбрасываем флаги атаки для всех карт на поле
    const resetPlayerField = gameState.player.field.map(card => ({
      ...card,
      hasAttacked: false,
    }));

    // Обновляем состояние игры
    const updatedState: GameState = {
      ...gameState,
      turn: nextTurn,
      currentPlayerId: gameState.opponent.id,
      player: {
        ...gameState.player,
        field: resetPlayerField,
      },
      opponent: {
        ...gameState.opponent,
        mana: maxOpponentMana,
        maxMana: maxOpponentMana,
      },
      log: [
        ...gameState.log,
        createLogEntry('Вы завершили ход', gameState.turn),
      ],
    };

    setGameState(updatedState);

    // Запускаем ход ИИ с небольшой задержкой
    setTimeout(() => {
      const aiState = performAITurn(updatedState);

      // По завершении хода ИИ возвращаем ход игроку
      const maxPlayerMana = Math.min(10, aiState.player.maxMana + 1);

      // Берем карту для игрока
      const drawResult = drawCard(aiState.player);

      // Обновляем состояние игры
      setGameState({
        ...aiState,
        player: {
          ...drawResult.updatedPlayer,
          mana: maxPlayerMana,
          maxMana: maxPlayerMana,
        },
        log: [
          ...aiState.log,
          createLogEntry('Вы взяли карту', nextTurn),
          createLogEntry('Ваш ход', nextTurn),
        ],
      });

      setIsPlayerTurn(true);
    }, 1500);
  };

  // Обработчик завершения анимации
  const handleAnimationComplete = (id: string) => {
    setGameState(prevState => ({
      ...prevState,
      activeAnimations: prevState.activeAnimations.filter(anim => anim.id !== id),
    }));
  };

  // Добавление анимации
  const addAnimation = (animation: Animation) => {
    setGameState(prevState => ({
      ...prevState,
      activeAnimations: [...prevState.activeAnimations, animation],
    }));
  };

  // Обработчик клика по карте в руке
  const handleCardPlay = (card: CardType) => {
    if (!isPlayerTurn) return;

    // Проверяем, хватает ли маны
    if (card.cost > gameState.player.mana) {
      setGameState({
        ...gameState,
        log: [
          ...gameState.log,
          createLogEntry(`Недостаточно маны для карты "${card.name}"`, gameState.turn),
        ],
      });
      return;
    }

    const result = playCard(gameState.player, card.id);

    if (result.playedCard) {
      // Обновляем статистику сыгранных карт
      const updatedStats = { ...gameState.statistics };
      updatedStats.totalCardsPlayed += 1;

      // Обновляем счетчики любимых карт
      if (!updatedStats.favoriteCards[card.name]) {
        updatedStats.favoriteCards[card.name] = 1;
      } else {
        updatedStats.favoriteCards[card.name] += 1;
      }

      // Обновляем состояние игры
      const updatedState = {
        ...gameState,
        player: result.updatedPlayer,
        statistics: updatedStats,
        log: [
          ...gameState.log,
          createLogEntry(`Вы сыграли карту "${card.name}"`, gameState.turn),
        ],
      };

      // Добавляем анимацию призыва для миньона
      if (card.type === 'minion') {
        addAnimation({
          id: `summon-${Date.now()}`,
          type: 'summon',
          sourceId: card.id,
          startTime: Date.now(),
          duration: 1000,
        });
      }

      // Если карта заклинание, применяем эффект
      if (card.type === 'spell' && card.effects) {
        // Это упрощенная логика для демонстрации
        const updatedOpponent = { ...gameState.opponent };

        for (const effect of card.effects) {
          if (effect.type === 'damage' && effect.target === 'enemy') {
            // Наносим урон герою противника
            updatedOpponent.hero = {
              ...updatedOpponent.hero,
              health: Math.max(0, updatedOpponent.hero.health - effect.value),
              isAnimating: true,
              animationType: 'damage' as AnimationType,
            };

            // Добавляем запись в лог
            updatedState.log.push(
              createLogEntry(`Заклинание "${card.name}" нанесло ${effect.value} урона противнику`, gameState.turn)
            );

            // Добавляем анимацию для заклинания
            addAnimation({
              id: `spell-${Date.now()}`,
              type: 'spell',
              sourceId: card.id,
              targetId: updatedOpponent.hero.id,
              value: effect.value,
              startTime: Date.now(),
              duration: 1000,
            });

            // Обновляем статистику урона
            updatedState.statistics.totalDamageDealt += effect.value;
          } else if (effect.type === 'heal' && effect.target === 'self') {
            // Восстанавливаем здоровье героя
            const updatedPlayerHero = {
              ...updatedState.player.hero,
              health: Math.min(
                updatedState.player.hero.maxHealth,
                updatedState.player.hero.health + effect.value
              ),
              isAnimating: true,
              animationType: 'heal' as AnimationType,
            };

            updatedState.player = {
              ...updatedState.player,
              hero: updatedPlayerHero,
            };

            // Добавляем запись в лог
            updatedState.log.push(
              createLogEntry(`Заклинание "${card.name}" восстановило ${effect.value} здоровья вашему герою`, gameState.turn)
            );

            // Добавляем анимацию для исцеления
            addAnimation({
              id: `heal-${Date.now()}`,
              type: 'heal',
              sourceId: card.id,
              targetId: updatedState.player.hero.id,
              value: effect.value,
              startTime: Date.now(),
              duration: 1000,
            });
          }
        }

        // Обновляем состояние игры с обновленным противником
        setGameState({
          ...updatedState,
          opponent: updatedOpponent,
        });
      } else {
        setGameState(updatedState);
      }

      // Сохраняем статистику в Telegram, если игра запущена в вебаппе
      if (isTelegramWebApp()) {
        saveStatsToServer(updatedState.statistics);
      }
    }
  };

  // Обработчик клика по карте на поле
  const handleCardSelect = (card: CardType) => {
    if (!isPlayerTurn) return;

    // Если карта на поле игрока, выбираем её для атаки
    if (gameState.player.field.some(c => c.id === card.id)) {
      // Проверяем, может ли карта атаковать
      if (card.hasAttacked) {
        setGameState({
          ...gameState,
          log: [
            ...gameState.log,
            createLogEntry(`Карта "${card.name}" уже атаковала в этот ход`, gameState.turn),
          ],
        });
        return;
      }

      setSelectedCard(card);
      setAttackMode(true);
      return;
    }

    // Если карта на поле противника и мы в режиме атаки
    if (attackMode && selectedCard && gameState.opponent.field.some(c => c.id === card.id)) {
      // Проверяем, есть ли таунты (провокация)
      const hasTaunts = gameState.opponent.field.some(c => c.abilities?.includes('taunt'));
      const isTargetTaunt = card.abilities?.includes('taunt');

      if (hasTaunts && !isTargetTaunt) {
        setGameState({
          ...gameState,
          log: [
            ...gameState.log,
            createLogEntry('Вы должны атаковать существ с провокацией', gameState.turn),
          ],
        });
        return;
      }

      // Атакуем карту противника
      const attacker = selectedCard;
      const defender = card;

      // Наносим урон обеим картам
      let attackerHealth = attacker.health || 0;
      let defenderHealth = defender.health || 0;

      // Обработка божественного щита
      const attackerHasShield = attacker.abilities?.includes('divine_shield');
      const defenderHasShield = defender.abilities?.includes('divine_shield');

      // Если у защитника яд, атакующий умирает (если нет щита)
      if (defender.abilities?.includes('poison') && !attackerHasShield) {
        attackerHealth = 0;
      } else if (!attackerHasShield) {
        // Обычный урон
        attackerHealth -= (defender.attack || 0);
      }

      // Если у атакующего яд, защитник умирает (если нет щита)
      if (attacker.abilities?.includes('poison') && !defenderHasShield) {
        defenderHealth = 0;
      } else if (!defenderHasShield) {
        // Обычный урон
        defenderHealth -= (attacker.attack || 0);
      }

      // Обновляем здоровье карт и удаляем щиты
      const updatedAttacker = {
        ...attacker,
        health: attackerHealth,
        hasAttacked: true,
        abilities: attackerHasShield
          ? attacker.abilities?.filter(a => a !== 'divine_shield')
          : attacker.abilities,
        isAnimating: true,
        animationType: 'attack' as AnimationType,
      };

      const updatedDefender = {
        ...defender,
        health: defenderHealth,
        abilities: defenderHasShield
          ? defender.abilities?.filter(a => a !== 'divine_shield')
          : defender.abilities,
        isAnimating: true,
        animationType: 'damage' as AnimationType,
      };

      // Обновляем поля боя
      let updatedPlayerField = [...gameState.player.field];
      let updatedOpponentField = [...gameState.opponent.field];

      if (attackerHealth <= 0) {
        // Удаляем уничтоженную карту игрока
        updatedPlayerField = updatedPlayerField.filter(c => c.id !== attacker.id);

        // Добавляем анимацию смерти
        addAnimation({
          id: `death-${attacker.id}`,
          type: 'death',
          sourceId: attacker.id,
          startTime: Date.now(),
          duration: 1000,
        });
      } else {
        // Обновляем здоровье карты игрока
        updatedPlayerField = updatedPlayerField.map(c =>
          c.id === attacker.id ? updatedAttacker : c
        );
      }

      if (defenderHealth <= 0) {
        // Удаляем уничтоженную карту противника
        updatedOpponentField = updatedOpponentField.filter(c => c.id !== defender.id);

        // Добавляем анимацию смерти
        addAnimation({
          id: `death-${defender.id}`,
          type: 'death',
          sourceId: defender.id,
          startTime: Date.now(),
          duration: 1000,
        });
      } else {
        // Обновляем здоровье карты противника
        updatedOpponentField = updatedOpponentField.map(c =>
          c.id === defender.id ? updatedDefender : c
        );
      }

      // Обновляем статистику урона
      const damageDone = attacker.attack || 0;
      const updatedStats = { ...gameState.statistics };
      updatedStats.totalDamageDealt += damageDone;

      // Обработка вампиризма
      let updatedPlayerHero = { ...gameState.player.hero };
      if (attacker.abilities?.includes('lifesteal') && damageDone > 0) {
        updatedPlayerHero = {
          ...updatedPlayerHero,
          health: Math.min(updatedPlayerHero.maxHealth, updatedPlayerHero.health + damageDone),
          isAnimating: true,
          animationType: 'heal' as AnimationType,
        };

        // Добавляем анимацию лечения
        addAnimation({
          id: `lifesteal-${Date.now()}`,
          type: 'heal',
          sourceId: attacker.id,
          targetId: updatedPlayerHero.id,
          value: damageDone,
          startTime: Date.now(),
          duration: 1000,
        });
      }

      // Обновляем состояние игры
      const updatedState = {
        ...gameState,
        player: {
          ...gameState.player,
          field: updatedPlayerField,
          hero: updatedPlayerHero,
        },
        opponent: {
          ...gameState.opponent,
          field: updatedOpponentField,
        },
        statistics: updatedStats,
        log: [
          ...gameState.log,
          createLogEntry(`Ваш миньон "${attacker.name}" атаковал миньона противника "${defender.name}"`, gameState.turn),
        ],
      };

      setGameState(updatedState);

      // Сохраняем статистику в Telegram, если игра запущена в вебаппе
      if (isTelegramWebApp()) {
        saveStatsToServer(updatedState.statistics);
      }

      // Добавляем анимацию атаки
      addAnimation({
        id: `attack-${Date.now()}`,
        type: 'attack',
        sourceId: attacker.id,
        targetId: defender.id,
        startTime: Date.now(),
        duration: 1000,
      });

      // Сбрасываем выбранную карту и режим атаки
      setSelectedCard(null);
      setAttackMode(false);
    }
  };

  // Обработчик атаки по герою противника
  const handleAttackHero = () => {
    if (!isPlayerTurn || !attackMode || !selectedCard) return;

    // Проверяем, есть ли таунты (провокация)
    const hasTaunts = gameState.opponent.field.some(c => c.abilities?.includes('taunt'));

    if (hasTaunts) {
      setGameState({
        ...gameState,
        log: [
          ...gameState.log,
          createLogEntry('Вы должны атаковать существ с провокацией', gameState.turn),
        ],
      });
      return;
    }

    // Атакуем героя противника
    const attacker = selectedCard;
    const damage = attacker.attack || 0;

    // Обновляем здоровье героя противника
    const updatedOpponentHero = {
      ...gameState.opponent.hero,
      health: Math.max(0, gameState.opponent.hero.health - damage),
      isAnimating: true,
      animationType: 'damage' as AnimationType,
    };

    // Обновляем карту атакующего
    const updatedAttacker = {
      ...attacker,
      hasAttacked: true,
      isAnimating: true,
      animationType: 'attack' as AnimationType,
    };

    // Обновляем поле игрока
    const updatedPlayerField = gameState.player.field.map(card =>
      card.id === attacker.id ? updatedAttacker : card
    );

    // Обновляем статистику урона
    const updatedStats = { ...gameState.statistics };
    updatedStats.totalDamageDealt += damage;

    // Обработка вампиризма
    let updatedPlayerHero = { ...gameState.player.hero };
    if (attacker.abilities?.includes('lifesteal') && damage > 0) {
      updatedPlayerHero = {
        ...updatedPlayerHero,
        health: Math.min(updatedPlayerHero.maxHealth, updatedPlayerHero.health + damage),
        isAnimating: true,
        animationType: 'heal' as AnimationType,
      };
    }

    // Обновляем состояние игры
    const updatedState = {
      ...gameState,
      player: {
        ...gameState.player,
        field: updatedPlayerField,
        hero: updatedPlayerHero,
      },
      opponent: {
        ...gameState.opponent,
        hero: updatedOpponentHero,
      },
      statistics: updatedStats,
      log: [
        ...gameState.log,
        createLogEntry(`Ваш миньон "${attacker.name}" атаковал героя противника и нанёс ${damage} урона`, gameState.turn),
      ],
    };

    setGameState(updatedState);

    // Сохраняем статистику в Telegram, если игра запущена в вебаппе
    if (isTelegramWebApp()) {
      saveStatsToServer(updatedState.statistics);
    }

    // Добавляем анимацию атаки
    addAnimation({
      id: `attack-hero-${Date.now()}`,
      type: 'attack',
      sourceId: attacker.id,
      targetId: gameState.opponent.hero.id,
      value: damage,
      startTime: Date.now(),
      duration: 1000,
    });

    // Сбрасываем выбранную карту и режим атаки
    setSelectedCard(null);
    setAttackMode(false);
  };

  // Обработчик использования силы героя
  const handleHeroPower = () => {
    if (!isPlayerTurn) return;

    const heroPower = gameState.player.hero.heroPower;

    // Проверяем, хватает ли маны
    if (heroPower.cost > gameState.player.mana) {
      setGameState({
        ...gameState,
        log: [
          ...gameState.log,
          createLogEntry('Недостаточно маны для использования силы героя', gameState.turn),
        ],
      });
      return;
    }

    // Применяем силу героя (в простой версии восстанавливаем 2 здоровья герою)
    const updatedHero = {
      ...gameState.player.hero,
      health: Math.min(gameState.player.hero.maxHealth, gameState.player.hero.health + 2),
      isAnimating: true,
      animationType: 'heal' as AnimationType,
    };

    // Обновляем состояние игры
    const updatedState = {
      ...gameState,
      player: {
        ...gameState.player,
        hero: updatedHero,
        mana: gameState.player.mana - heroPower.cost,
      },
      log: [
        ...gameState.log,
        createLogEntry('Вы использовали силу героя и восстановили 2 здоровья', gameState.turn),
      ],
    };

    setGameState(updatedState);

    // Сохраняем статистику в Telegram, если игра запущена в вебаппе
    if (isTelegramWebApp()) {
      saveStatsToServer(updatedState.statistics);
    }

    // Добавляем анимацию лечения
    addAnimation({
      id: `hero-power-${Date.now()}`,
      type: 'heal',
      sourceId: gameState.player.hero.id,
      targetId: gameState.player.hero.id,
      value: 2,
      startTime: Date.now(),
      duration: 1000,
    });
  };

  return (
    <div className="game-board min-h-screen flex flex-col">
      {/* Статус игры */}
      <GameStatus
        status={gameState.gameStatus}
        turn={gameState.turn}
        onNewGame={startNewGame}
      />

      {/* Панель управления */}
      <div className="control-panel flex justify-between items-center p-2 bg-amber-900 bg-opacity-20">
        <DifficultySelector
          currentDifficulty={gameState.difficulty}
          onSelectDifficulty={handleDifficultyChange}
        />

        <button
          className="button button-secondary text-sm"
          onClick={() => setShowStats(!showStats)}
        >
          {showStats ? 'Скрыть статистику' : 'Показать статистику'}
        </button>
      </div>

      {/* Статистика игры (если отображается) */}
      {showStats && (
        <div className="stats-container p-4">
          <StatsPanel
            statistics={gameState.statistics}
            onResetStats={handleResetStats}
          />
        </div>
      )}

      {/* Верхняя часть (противник) */}
      <div className="opponent-area p-4 flex flex-col items-center">
        {/* Герой противника */}
        <div
          className={`relative ${attackMode ? 'cursor-pointer animate-pulse' : ''}`}
          onClick={attackMode ? handleAttackHero : undefined}
          id={gameState.opponent.hero.id}
        >
          <Hero
            hero={gameState.opponent.hero}
            isPlayer={false}
            heroPowerUsable={false}
          />
        </div>

        {/* Мана противника */}
        <ManaBar
          currentMana={gameState.opponent.mana}
          maxMana={gameState.opponent.maxMana}
        />
      </div>

      {/* Поле боя */}
      <div className="battlefield-area flex-grow">
        <Battlefield
          playerField={gameState.player.field}
          opponentField={gameState.opponent.field}
          isPlayerTurn={isPlayerTurn}
          onCardSelect={handleCardSelect}
        />
      </div>

      {/* Нижняя часть (игрок) */}
      <div className="player-area p-4 flex flex-col">
        {/* Мана игрока */}
        <ManaBar
          currentMana={gameState.player.mana}
          maxMana={gameState.player.maxMana}
        />

        {/* Контроль игры */}
        <div className="game-controls flex justify-between items-center mb-4">
          {/* Герой игрока */}
          <div id={gameState.player.hero.id}>
            <Hero
              hero={gameState.player.hero}
              isPlayer={true}
              onHeroPowerClick={handleHeroPower}
              heroPowerUsable={isPlayerTurn && gameState.player.mana >= gameState.player.hero.heroPower.cost}
            />
          </div>

          {/* Лог игры */}
          <div className="flex-grow mx-4">
            <GameLog entries={gameState.log} />
          </div>

          {/* Кнопка завершения хода */}
          <EndTurnButton
            isPlayerTurn={isPlayerTurn}
            onClick={handleEndTurn}
          />
        </div>

        {/* Рука игрока */}
        <Hand
          cards={gameState.player.hand}
          playerMana={gameState.player.mana}
          onCardPlay={handleCardPlay}
        />
      </div>

      {/* Анимации */}
      {gameState.activeAnimations.map((animation) => (
        <AnimationEffect
          key={animation.id}
          animation={animation}
          onAnimationComplete={handleAnimationComplete}
        />
      ))}
    </div>
  );
};

export default GameBoard;
