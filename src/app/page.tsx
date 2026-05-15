'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/core/game-store';
import { StartScreen } from '@/components/core/StartScreen';
import { LobbyScreen } from '@/components/core/LobbyScreen';
import { GameTable } from '@/components/core/GameTable';
import { GameOverScreen } from '@/components/core/GameOverScreen';
import { GameSettings } from '@/lib/core/types';

type AppScreen = 'start' | 'lobby' | 'game' | 'gameOver';

export default function Home() {
  const { phase, round, startGame, resetGame } = useGameStore();

  const [screen, setScreen] = useState<AppScreen>(() => {
    // If URL has ?room=XXX, go to lobby
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('room')) return 'lobby';
    }
    return 'start';
  });
  const [lobbyMode, setLobbyMode] = useState<'host' | 'join' | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('room')) return 'join';
    }
    return null;
  });

  const handleStart = useCallback((settings: GameSettings) => {
    startGame(settings);
    setScreen('game');
  }, [startGame]);

  const handleMultiplayer = useCallback((mode: 'host' | 'join') => {
    setLobbyMode(mode);
    setScreen('lobby');
  }, []);

  const handleLobbyBack = useCallback(() => {
    setScreen('start');
    setLobbyMode(null);
  }, []);

  // Derive screen from game state (no setState in effects)
  const derivedScreen: AppScreen =
    screen === 'gameOver'
      ? 'gameOver'
      : phase === 'gameOver'
        ? 'gameOver'
        : screen;

  const showGame = derivedScreen === 'game' && round !== null;
  const showGameOver = derivedScreen === 'gameOver';
  const showLobby = derivedScreen === 'lobby' && lobbyMode !== null;
  const showStart = derivedScreen === 'start' || (!showGame && !showGameOver && !showLobby);

  // Transition from lobby to game when round data appears (uses flushSync pattern)
  useEffect(() => {
    if (screen === 'lobby' && round !== null) {
      // Use requestAnimationFrame to avoid synchronous setState in effect
      const id = requestAnimationFrame(() => setScreen('game'));
      return () => cancelAnimationFrame(id);
    }
  }, [screen, round]);

  const handleGameOverBack = useCallback(() => {
    resetGame();
    setScreen('start');
    setLobbyMode(null);
  }, [resetGame]);

  if (showGameOver) {
    return <div onClick={handleGameOverBack}><GameOverScreen /></div>;
  }

  if (showLobby) {
    return <LobbyScreen mode={lobbyMode!} onBack={handleLobbyBack} />;
  }

  if (showGame) {
    return <GameTable />;
  }

  return (
    <StartScreen
      onStartGame={handleStart}
      onMultiplayer={handleMultiplayer}
    />
  );
}
