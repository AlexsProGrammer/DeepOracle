'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGameStore } from '@/lib/core/game-store';
import { GameCard } from './GameCard';
import { Scoreboard } from './Scoreboard';
import { RulesDialog } from './RulesDialog';
import { SUIT_INFO } from '@/lib/core/constants';
import { getValidCards } from '@/lib/core/trick';
import {
  Trophy,
  HelpCircle,
  Undo2,
  ChevronDown,
  Waves,
} from 'lucide-react';

export function GameTable() {
  const {
    phase,
    players,
    round,
    settings,
    selectedCardId,
    totalRounds,
    message,
    placeBid,
    playCard,
    resetGame,
  } = useGameStore();

  const [showRules, setShowRules] = useState(false);
  const [showScoreboard, setShowScoreboard] = useState(true);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const handContainerRef = useRef<HTMLDivElement>(null);
  const [cardsPerRow, setCardsPerRow] = useState(100);

  const humanPlayer = players.find((p) => p.isHuman);
  const aiPlayers = players.filter((p) => !p.isHuman);
  const currentPlayer = round ? players[round.currentPlayerIndex] : null;
  const isHumanTurn = currentPlayer?.isHuman;
  const isPlaying = phase === 'playing';
  const isTrickEnd = phase === 'trickEnd';
  const isRoundEnd = phase === 'roundEnd';

  // Measure hand container to compute multi-row layout
  useEffect(() => {
    const measure = () => {
      if (!handContainerRef.current || !humanPlayer) return;
      const containerW = handContainerRef.current.offsetWidth;
      const cardW = 80; // default card width in px
      const overlap = humanPlayer.hand.length > 1
        ? Math.max(4, Math.min(28, 180 / humanPlayer.hand.length))
        : 0;
      const effectiveW = cardW - overlap;
      const newCPR = Math.max(1, Math.floor(containerW / effectiveW));
      setCardsPerRow(newCPR);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (handContainerRef.current) observer.observe(handContainerRef.current);
    return () => observer.disconnect();
  }, [humanPlayer?.hand.length]);

  const isFirstRound = round?.roundNumber === 1;
  const isFirstRoundBidding = isFirstRound && (phase === 'bidding' || phase === 'start');

  /* ─── Canadian rule: compute forbidden bids for human ─── */
  const totalExistingBids = useMemo(
    () => players.reduce((sum, p) => sum + (p.bid ?? 0), 0),
    [players]
  );
  const playersYetToBid = players.filter((p) => p.bid === undefined).length;
  const isHumanLastBidder = playersYetToBid === 1 && isHumanTurn && phase === 'bidding';
  const isBidForbidden = useCallback(
    (bid: number) => {
      // Round 1 exception: only 1 card, all bids would be forbidden — skip rule
      if (!isHumanLastBidder || !round || round.cardsPerPlayer <= 1) return false;
      return (totalExistingBids + bid) % round.cardsPerPlayer === 0;
    },
    [isHumanLastBidder, round, totalExistingBids]
  );

  const validCards = useMemo(() => {
    if (!isPlaying || !round || !humanPlayer) return [];
    // When leading (no trick yet), all cards in hand are valid
    if (!round.currentTrick) return humanPlayer.hand;
    return getValidCards(humanPlayer.hand, round.currentTrick, settings.strictFollow);
  }, [isPlaying, round?.currentTrick, round, humanPlayer, settings.strictFollow]);

  // Effective trump for display
  const effectiveTrumpSuit = round?.dynamicTrump
    ? (round.trickTrump ?? undefined) // undefined = not yet set this trick
    : (round?.trumpSuit ?? undefined);

  const trumpSuitInfo = effectiveTrumpSuit ? SUIT_INFO[effectiveTrumpSuit] : null;
  const isDynamicTrump = !!round?.dynamicTrump;

  /* ─── Drag-and-drop reorder handlers ─── */
  const handleDragStart = useCallback((e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    // Use transparent image to avoid default ghost
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(img, 0, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCardId(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(idx);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (draggedCardId === null || !humanPlayer) {
        setDraggedCardId(null);
        setDragOverIndex(null);
        return;
      }

      const fromIndex = humanPlayer.hand.findIndex((c) => c.id === draggedCardId);
      if (fromIndex === -1 || fromIndex === targetIndex) {
        setDraggedCardId(null);
        setDragOverIndex(null);
        return;
      }

      // Reorder the hand
      const newHand = [...humanPlayer.hand];
      const [movedCard] = newHand.splice(fromIndex, 1);
      newHand.splice(targetIndex, 0, movedCard);

      // Update store - reorder human player's hand
      const store = useGameStore.getState();
      const newPlayers = store.players.map((p) =>
        p.id === humanPlayer.id ? { ...p, hand: newHand } : p
      );
      useGameStore.setState({ players: newPlayers });

      setDraggedCardId(null);
      setDragOverIndex(null);
    },
    [draggedCardId, humanPlayer]
  );

  // Stable particle positions — computed once to avoid SSR/client hydration mismatch
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        // Deterministic pseudo-random based on index
        const seed = (i * 137.508 + 42) % 100;
        const seed2 = (i * 73.1 + 17) % 100;
        return {
          left: seed,
          top: seed2,
          duration: 4 + (i % 4) * 0.75,
          delay: (i * 0.25) % 5,
        };
      }),
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#060d1f] via-[#0a1628] to-[#060d1f] relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-0.5 bg-cyan-400/20 rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-3 py-2 sm:px-6 sm:py-3 bg-[#0a1628]/50 border-b border-cyan-800/30">
        <div className="flex items-center gap-2 sm:gap-4">
          <h1 className="text-cyan-400 font-bold text-lg sm:text-xl tracking-wider">
            🔱 DEEP ORACLE
          </h1>
          {round && (
            <Badge
              variant="outline"
              className="border-cyan-600/50 text-cyan-300 text-xs"
            >
              Round {round.roundNumber}/{totalRounds}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Trump indicator */}
          {isDynamicTrump ? (
            trumpSuitInfo ? (
              <Badge className="bg-[#0c1e3a]/80 border border-cyan-600/40 text-xs flex items-center gap-1">
                Trick Trump:{' '}
                <span className="font-bold" style={{ color: trumpSuitInfo.color }}>
                  {trumpSuitInfo.emoji} {trumpSuitInfo.name}
                </span>
              </Badge>
            ) : (
              <Badge className="bg-[#0c1e3a]/80 border border-yellow-600/40 text-xs text-yellow-300">
                {round?.trumpCard?.type === 'trident' ? '🔱' : '🐙'} Dynamic Trump
              </Badge>
            )
          ) : trumpSuitInfo ? (
            <Badge className="bg-[#0c1e3a]/80 border border-cyan-600/40 text-xs flex items-center gap-1">
              Trump:{' '}
              <span className="font-bold" style={{ color: trumpSuitInfo.color }}>
                {trumpSuitInfo.emoji} {trumpSuitInfo.name}
              </span>
            </Badge>
          ) : round ? (
            <Badge className="bg-gray-800/60 border border-gray-600/40 text-xs text-gray-300">
              No Trump
            </Badge>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRules(true)}
            className="text-cyan-300 hover:text-cyan-100 h-8 w-8 p-0"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetGame}
            className="text-cyan-300 hover:text-cyan-100 h-8 w-8 p-0"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main game area */}
      <main className="relative z-10 flex-1 flex flex-col">
        {/* Trump card reveal area */}
        {round?.trumpCard && (
          <div className="flex justify-center py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-cyan-400 text-xs sm:text-sm">
                Trump Card:
              </span>
              <GameCard card={round.trumpCard} small />
              {isDynamicTrump && (
                <span className="text-yellow-300/80 text-xs">
                  (first realm card each trick sets trump)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Dealer choosing trump — removed (dynamic trump replaces this) */}

        {/* AI players display */}
        <div className="flex justify-around items-start px-2 sm:px-6 pt-2 sm:pt-4 gap-2">
          {aiPlayers.map((ai) => {
            const isCurrentTurn = currentPlayer?.id === ai.id;

            return (
              <motion.div
                key={ai.id}
                className="flex flex-col items-center gap-1 sm:gap-2 min-w-[60px] sm:min-w-[80px]"
                animate={isCurrentTurn ? { scale: [1, 1.03, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {/* Player info */}
                <div
                  className={`flex flex-col items-center px-2 py-1 rounded-lg ${
                    isCurrentTurn
                      ? 'bg-yellow-500/10 border border-yellow-500/30'
                      : 'bg-[#0c1e3a]/40'
                  }`}
                >
                  <span className="text-lg sm:text-xl">{ai.avatar}</span>
                  <span className="text-[10px] sm:text-xs text-cyan-200 font-medium truncate max-w-[60px] sm:max-w-[80px]">
                    {ai.name}
                  </span>
                  {ai.isDealer && (
                    <Badge className="bg-yellow-600/60 text-[7px] px-1 py-0 h-3 mt-0.5">
                      Dealer
                    </Badge>
                  )}
                  <div className="flex gap-2 text-[10px] sm:text-xs text-cyan-300/80 mt-0.5">
                    {ai.bid !== undefined && <span>Bid: {ai.bid}</span>}
                    <span>Won: {ai.tricksWon}</span>
                  </div>
                </div>

                {/* AI hand - face up in round 1 bidding, face down otherwise */}
                <div className="flex -space-x-3 sm:-space-x-4 justify-center">
                  {ai.hand.slice(0, Math.min(ai.hand.length, 5)).map((card, idx) => (
                    <GameCard
                      key={idx}
                      card={card}
                      faceUp={isFirstRoundBidding}
                      tiny
                    />
                  ))}
                  {ai.hand.length > 5 && (
                    <span className="text-cyan-400/60 text-xs self-center ml-1">
                      +{ai.hand.length - 5}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Central trick area */}
        <div className="flex-1 flex items-center justify-center relative py-2 sm:py-4">
          <div className="relative w-64 h-48 sm:w-96 sm:h-64">
            {/* Table surface */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#0c1e3a]/30 to-[#0a1628]/50 border border-cyan-800/20" />

            {/* Message */}
            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  key={message}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-2 left-0 right-0 text-center z-10"
                >
                  <span className="text-xs sm:text-sm text-cyan-300/80 bg-[#0a1628]/80 px-3 py-1 rounded-full">
                    {message}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Played cards */}
            {round?.currentTrick && (
              <div className="absolute inset-0 flex items-center justify-center">
                {round.currentTrick.plays.filter((play) => play.card != null).map((play, idx) => {
                  const playPlayer = players.find(
                    (p) => p.id === play.playerId
                  );
                  const isWinner =
                    round.currentTrick?.winnerId === play.playerId;
                  const totalPlays = round.currentTrick.plays.length;

                  // Position cards in a circular pattern
                  const angle =
                    (idx / Math.max(totalPlays, settings.playerCount)) * 360 - 90;
                  const radius = 60;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;

                  return (
                    <motion.div
                      key={`${play.playerId}-${idx}`}
                      className="absolute"
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x,
                        y: y - 10,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                      }}
                    >
                      <div className="relative">
                        <GameCard card={play.card} played small />
                        {isTrickEnd && isWinner && (
                          <motion.div
                            className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-0.5"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <Trophy className="w-3 h-3 text-yellow-900" />
                          </motion.div>
                        )}
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-[9px] sm:text-[10px] text-cyan-300/60">
                          {playPlayer?.avatar} {playPlayer?.name}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Bidding interface — shown in the play area */}
            <AnimatePresence>
              {phase === 'bidding' && isHumanTurn && !humanPlayer?.bid && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 flex items-center justify-center z-20"
                >
                <div className="flex flex-col items-center gap-2 sm:gap-3 bg-[#0a1628]/90 border border-cyan-700/40 rounded-xl p-4 sm:p-6 backdrop-blur-sm max-w-xs sm:max-w-sm w-full mx-4">
                  <p className="text-yellow-400 font-semibold text-sm sm:text-base">
                    Place Your Bid
                  </p>
                  {isHumanLastBidder && (
                    <p className="text-cyan-300/70 text-[10px] sm:text-xs">
                      You are the last bidder — some values are forbidden
                    </p>
                  )}
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
                    {Array.from(
                      { length: (round?.cardsPerPlayer ?? 0) + 1 },
                      (_, i) => i
                    ).map((bid) => {
                      const forbidden = isBidForbidden(bid);
                      return (
                        <motion.div key={bid} whileHover={{ scale: forbidden ? 1 : 1.1 }} whileTap={{ scale: forbidden ? 1 : 0.9 }}>
                          <Button
                            onClick={() => placeBid(bid)}
                            disabled={forbidden}
                            className={`w-9 h-9 sm:w-10 sm:h-10 font-bold text-sm border
                              ${forbidden
                                ? 'bg-gray-800/30 border-gray-700/30 text-gray-600 cursor-not-allowed line-through'
                                : 'bg-[#0c1e3a]/80 hover:bg-[#112240]/80 border-cyan-600/40 text-white'
                              }`}
                          >
                            {bid}
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* Round end summary */}
            {isRoundEnd && round && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="bg-[#0a1628]/90 border border-cyan-700/40 rounded-xl p-4 sm:p-6 text-center max-w-xs sm:max-w-sm">
                  <Waves className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <h3 className="text-yellow-400 font-bold text-base sm:text-lg mb-3">
                    Round {round.roundNumber} Complete!
                  </h3>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    {players.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center text-cyan-200"
                      >
                        <span>
                          {p.avatar} {p.name}
                        </span>
                        <div className="flex gap-3">
                          <span className="text-cyan-400">
                            Bid: {p.bid} → Won: {p.tricksWon}
                          </span>
                          <span
                            className={`font-bold ${
                              p.bid === p.tricksWon
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}
                          >
                            {p.bid === p.tricksWon ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-cyan-400/60 text-xs mt-3">
                    Next round starting...
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Human hand */}
        <div className="pb-3 sm:pb-4 px-2 sm:px-4">
          {/* Round 1 info banner */}
          {isFirstRoundBidding && (
            <div className="flex justify-center mb-2">
              <span className="text-xs sm:text-sm text-amber-300/80 bg-amber-950/40 border border-amber-700/30 px-3 py-1 rounded-full">
                Round 1: You can see opponents&apos; cards, but not your own! Bid wisely.
              </span>
            </div>
          )}
          <div
            ref={handContainerRef}
            className="flex justify-center items-end flex-wrap min-h-[120px] sm:min-h-[160px] relative"
          >
            {humanPlayer?.hand.map((card, idx) => {
              const isValid = validCards.some((c) => c.id === card.id);
              const isSelected = selectedCardId === card.id;
              const canPlay = isPlaying && isHumanTurn && isValid;
              // Round 1 bidding: hide player's own cards
              const showCardFace = !isFirstRoundBidding;
              const isHovered = hoveredCardId === card.id;
              const isDragged = draggedCardId === card.id;
              const isDragTarget = dragOverIndex === idx && draggedCardId !== card.id;

              // Overlap: cards share horizontal space. Negative margin creates overlap.
              const overlap = humanPlayer.hand.length > 1
                ? Math.max(4, Math.min(28, 180 / humanPlayer.hand.length))
                : 0;

              // Multi-row: 2nd row overlaps 1st row (only bottom 30% visible)
              const rowIndex = Math.floor(idx / cardsPerRow);
              const cardHeight = 112; // default card height in px
              const rowOverlapPx = rowIndex > 0 ? -(cardHeight * 0.7) : 0;

              return (
                <motion.div
                  key={card.id}
                  className="relative"
                  style={{
                    marginLeft: idx === 0 ? 0 : -overlap,
                    marginTop: rowOverlapPx,
                    zIndex: isDragged ? 100 : isHovered ? 50 : isSelected ? 40 : 10 + (rowIndex * 20) + idx,
                    transition: 'z-index 0s',
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: isDragged ? 0.4 : 1,
                    y: isSelected
                      ? -20
                      : isHovered && !isDragged
                        ? -12
                        : isDragTarget
                          ? -6
                          : 0,
                    scale: isDragged ? 0.95 : isHovered ? 1.08 : 1,
                  }}
                  transition={{ delay: idx * 0.03, type: 'spring', stiffness: 300, damping: 25 }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragLeave={() => setDragOverIndex(null)}
                  onMouseEnter={() => setHoveredCardId(card.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                >
                  {/* Drop indicator line */}
                  {isDragTarget && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-yellow-400 rounded-full z-50" />
                  )}
                  <GameCard
                    card={card}
                    faceUp={showCardFace}
                    selected={isSelected}
                    disabled={isPlaying && isHumanTurn && !isValid}
                    validPlay={canPlay && !isSelected}
                    onClick={
                      canPlay ? () => playCard(card.id) : undefined
                    }
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Scoreboard toggle */}
      <div className="fixed top-1/2 -translate-y-1/2 right-0 z-30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowScoreboard(!showScoreboard)}
          className="text-cyan-300 hover:text-cyan-100 bg-[#0a1628]/80 rounded-l-lg rounded-r-none border border-r-0 border-cyan-800/40 h-8 w-6 p-0"
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform ${
              showScoreboard ? '' : 'rotate-90'
            }`}
          />
        </Button>
      </div>

      {/* Scoreboard panel */}
      <AnimatePresence>
        {showScoreboard && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="fixed top-1/2 -translate-y-1/2 right-8 z-20"
          >
            <Scoreboard />
          </motion.div>
        )}
      </AnimatePresence>

      <RulesDialog open={showRules} onOpenChange={setShowRules} />
    </div>
  );
}
