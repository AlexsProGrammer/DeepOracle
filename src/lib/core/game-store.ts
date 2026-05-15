import { create } from 'zustand';
import {
  Card,
  GamePhase,
  GameSettings,
  GameState,
  Player,
  RoundScore,
  RoundState,
  Suit,
  Trick,
} from './types';
import {
  AI_AVATARS,
  AI_NAMES,
  PLAYER_AVATAR,
  PLAYER_NAME,
  SUIT_INFO,
  TRICK_END_DELAY,
  ROUND_END_DELAY,
} from './constants';
import { createDeck, deal, getTotalRounds, shuffle, sortHand } from './deck';
import { determineTrickWinner, getValidCards } from './trick';
import { calculateRoundScore } from './scoring';
import { getAIBid, getAIPlay, getAIDelay } from './ai';
import { GameNetwork, NetMsg } from './network';

export type GameMode = 'singleplayer' | 'multiplayer';

interface GameActions {
  startGame: (settings: GameSettings) => void;
  startMultiplayerGame: (settings: GameSettings, remotePeers: { id: string; name: string; avatar: string }[]) => void;
  placeBid: (bid: number) => void;
  playCard: (cardId: string) => void;
  selectTrumpSuit: (suit: Suit) => void;
  resetGame: () => void;
  receiveNetMsg: (msg: NetMsg) => void;
  syncClientState: (state: GameState, myId: string) => void;
  setNetwork: (net: GameNetwork | null) => void;
  setMode: (mode: GameMode) => void;
  getNetwork: () => GameNetwork | null;
}

type GameStore = GameState & GameActions & {
  mode: GameMode;
  isHost: boolean;
  myPeerId: string;
  network: GameNetwork | null;
};

const initialState: GameState = {
  phase: 'start',
  settings: { playerCount: 4, difficulty: 'medium', strictFollow: false },
  players: [],
  round: null,
  roundScores: [],
  deck: [],
  totalRounds: 15,
  selectedCardId: null,
  bidValues: {},
  lastTrick: null,
  message: '',
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,
  mode: 'singleplayer',
  isHost: false,
  myPeerId: '',
  network: null,

  setNetwork: (net) => set({ network: net }),
  setMode: (mode) => set({ mode }),
  getNetwork: () => get().network,

  startGame: (settings: GameSettings) => {
    const totalRounds = getTotalRounds(settings.playerCount);
    const players = createPlayers(settings.playerCount);

    set({
      settings,
      players,
      totalRounds,
      roundScores: [],
      phase: 'start',
      mode: 'singleplayer',
      isHost: false,
      myPeerId: 'player-0',
    });

    startNewRound(set, get, 1, players);
  },

  startMultiplayerGame: (settings: GameSettings, remotePeers) => {
    const net = get().network;
    const hostPeerId = net?.getMyId() ?? '';
    const isHost = net?.getRole() === 'host';

    // Build player list: host first, then remote peers, then fill with AI
    const players: Player[] = [];

    // Add host
    players.push({
      id: hostPeerId,
      name: isHost ? net?.getLobbyPlayers()[0]?.name ?? 'Host' : 'Host',
      isHuman: isHost,
      score: 0,
      tricksWon: 0,
      hand: [],
      isDealer: false,
      avatar: '👑',
    });

    // Add remote players
    for (const rp of remotePeers) {
      players.push({
        id: rp.id,
        name: rp.name,
        isHuman: true,
        score: 0,
        tricksWon: 0,
        hand: [],
        isDealer: false,
        avatar: rp.avatar,
      });
    }

    // Fill remaining with AI
    let aiIdx = 0;
    while (players.length < settings.playerCount) {
      players.push({
        id: `ai-${aiIdx}`,
        name: AI_NAMES[aiIdx % AI_NAMES.length],
        isHuman: false,
        score: 0,
        tricksWon: 0,
        hand: [],
        isDealer: false,
        avatar: AI_AVATARS[aiIdx % AI_AVATARS.length],
      });
      aiIdx++;
    }

    const totalRounds = getTotalRounds(settings.playerCount);

    set({
      settings,
      players,
      totalRounds,
      roundScores: [],
      phase: 'start',
      mode: 'multiplayer',
      isHost,
      myPeerId: net?.getMyId() ?? '',
    });

    // Host runs the game loop; client waits for state sync
    if (isHost) {
      startNewRound(set, get, 1, players);
      net?.broadcast({ type: 'startGame', settings });
    }
    // Client: game will start when host sends 'state'
  },

  syncClientState: (state, myId) => {
    // Client receives filtered state from host
    const myPlayer = state.players.find(p => p.id === myId);
    // Mark only my player as human so UI shows my hand
    const adjustedPlayers = state.players.map(p => ({
      ...p,
      isHuman: p.id === myId,
    }));

    set({
      ...state,
      players: adjustedPlayers,
      myPeerId: myId,
      isHost: false,
      phase: state.phase,
    });
  },

  receiveNetMsg: (msg) => {
    const state = get();
    if (!state.isHost || !state.round) return;

    if (msg.type === 'bid') {
      const { players, round } = state;
      const currentPlayer = players[round.currentPlayerIndex];
      if (currentPlayer.id !== msg.peerId) return;

      // Canadian rule check
      const playersYetToBid = players.filter((p) => p.bid === undefined);
      const isLastBidder = playersYetToBid.length === 1;
      if (isLastBidder && round.cardsPerPlayer > 1) {
        const totalExistingBids = players.reduce((sum, p) => sum + (p.bid ?? 0), 0);
        if ((totalExistingBids + msg.bid) % round.cardsPerPlayer === 0) return;
      }

      const newPlayers = players.map((p) =>
        p.id === currentPlayer.id ? { ...p, bid: msg.bid } : p
      );
      set({
        players: newPlayers,
        bidValues: { ...state.bidValues, [currentPlayer.id]: msg.bid },
        message: `${currentPlayer.name} bids ${msg.bid}`,
      });
      advanceBidding(set, get);
    }

    if (msg.type === 'play') {
      const { players, round } = state;
      const currentPlayer = players[round.currentPlayerIndex];
      if (currentPlayer.id !== msg.peerId) return;

      const card = currentPlayer.hand.find((c) => c.id === msg.cardId);
      if (!card) return;

      let isValid = !round.currentTrick;
      if (!isValid && round.currentTrick) {
        const validCards = getValidCards(currentPlayer.hand, round.currentTrick, state.settings.strictFollow);
        isValid = !!validCards.find((c) => c.id === msg.cardId);
      }
      if (!isValid) return;

      executePlay(set, get, currentPlayer.id, card);
    }

    if (msg.type === 'trump') {
      const { round } = state;
      const dealer = state.players.find(p => p.isDealer);
      if (!dealer || dealer.id !== msg.peerId) return;

      const newRound = { ...round, trumpSuit: msg.suit };
      set({ round: newRound, message: `Trump is now ${msg.suit}!` });
      // Bidding already done — start playing
      setTimeout(() => {
        const cs = get();
        if (cs.round) {
          set({ round: { ...cs.round, trumpSuit: msg.suit }, phase: 'playing' });
          startPlayingLoop(set, get);
        }
      }, 1500);
    }
  },

  placeBid: (bid: number) => {
    const state = get();
    if (state.phase !== 'bidding' || !state.round) return;

    const { players, round } = state;
    const currentPlayer = players[round.currentPlayerIndex];

    if (!currentPlayer.isHuman) return;

    // Canadian rule: last bidder can't make total a multiple of cardsPerPlayer
    // Exception: round 1 only has 1 card, so all bids are forbidden — skip rule
    const playersYetToBid = players.filter((p) => p.bid === undefined);
    const isLastBidder = playersYetToBid.length === 1;
    if (isLastBidder && round.cardsPerPlayer > 1) {
      const totalExistingBids = players.reduce((sum, p) => sum + (p.bid ?? 0), 0);
      if ((totalExistingBids + bid) % round.cardsPerPlayer === 0) {
        return; // Forbidden bid — UI should prevent this, but double-check
      }
    }

    const newPlayers = players.map((p) =>
      p.id === currentPlayer.id ? { ...p, bid } : p
    );

    set({
      players: newPlayers,
      bidValues: { ...state.bidValues, [currentPlayer.id]: bid },
    });

    // In multiplayer client mode, send bid to host
    if (state.mode === 'multiplayer' && !state.isHost) {
      state.network?.sendToHost({ type: 'bid', peerId: state.myPeerId, bid });
      return;
    }

    advanceBidding(set, get);
  },

  playCard: (cardId: string) => {
    const state = get();
    if (state.phase !== 'playing' || !state.round) return;

    const { players, round } = state;
    const currentPlayer = players[round.currentPlayerIndex];

    if (!currentPlayer.isHuman) return;

    const card = currentPlayer.hand.find((c) => c.id === cardId);
    if (!card) return;

    // When leading (no trick yet), all cards are valid
    let isValid = !round.currentTrick;
    if (!isValid) {
      const validCards = getValidCards(currentPlayer.hand, round.currentTrick, state.settings.strictFollow);
      isValid = !!validCards.find((c) => c.id === cardId);
    }
    if (!isValid) return;

    // In multiplayer client mode, send play to host
    if (state.mode === 'multiplayer' && !state.isHost) {
      state.network?.sendToHost({ type: 'play', peerId: state.myPeerId, cardId });
      return;
    }

    executePlay(set, get, currentPlayer.id, card);
  },

  selectTrumpSuit: (suit: Suit) => {
    const state = get();
    if (!state.round) return;

    // In multiplayer client mode, send to host
    if (state.mode === 'multiplayer' && !state.isHost) {
      state.network?.sendToHost({ type: 'trump', peerId: state.myPeerId, suit });
      return;
    }

    const newRound = {
      ...state.round,
      trumpSuit: suit,
    };

    set({ round: newRound, message: `Trump is now ${suit}!` });

    // Start playing after short delay (bidding already done)
    setTimeout(() => {
      set({ phase: 'playing' });
      startPlayingLoop(set, get);
    }, 1500);
  },

  resetGame: () => {
    const net = get().network;
    net?.destroy();
    set({ ...initialState, mode: 'singleplayer', isHost: false, myPeerId: '', network: null });
  },
}));

/* ─── Auto-broadcast: host sends state to clients on every store change ─── */
useGameStore.subscribe((state) => {
  if (state.mode === 'multiplayer' && state.isHost && state.network && state.round) {
    // Extract only plain GameState fields — the full GameStore also contains the
    // GameNetwork class instance and action functions which binarypack cannot serialize.
    const gameState: GameState = {
      phase: state.phase,
      settings: state.settings,
      players: state.players,
      round: state.round,
      roundScores: state.roundScores,
      deck: state.deck,
      totalRounds: state.totalRounds,
      selectedCardId: state.selectedCardId,
      bidValues: state.bidValues,
      lastTrick: state.lastTrick,
      message: state.message,
    };
    state.network.broadcastState(gameState);
  }
});

function createPlayers(playerCount: number): Player[] {
  const players: Player[] = [];

  players.push({
    id: 'player-0',
    name: PLAYER_NAME,
    isHuman: true,
    score: 0,
    tricksWon: 0,
    hand: [],
    isDealer: false,
    avatar: PLAYER_AVATAR,
  });

  for (let i = 1; i < playerCount; i++) {
    players.push({
      id: `player-${i}`,
      name: AI_NAMES[i - 1] || `AI ${i}`,
      isHuman: false,
      score: 0,
      tricksWon: 0,
      hand: [],
      isDealer: false,
      avatar: AI_AVATARS[i - 1] || '🤖',
    });
  }

  return players;
}

function startNewRound(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore,
  roundNumber: number,
  players: Player[]
) {
  const state = get();
  const { playerCount, difficulty } = state.settings;
  const cardsPerPlayer = roundNumber;

  // Rotate dealer
  const dealerIndex = (roundNumber - 1) % playerCount;

  // Reset player round state
  const newPlayers = players.map((p, i) => ({
    ...p,
    bid: undefined,
    tricksWon: 0,
    isDealer: i === dealerIndex,
    hand: [],
  }));

  // Create and deal deck
  const fullDeck = shuffle(createDeck());
  const { hands, remaining } = deal(fullDeck, playerCount, cardsPerPlayer);

  // Assign hands
  for (let i = 0; i < newPlayers.length; i++) {
    newPlayers[i].hand = sortHand(hands[i]);
  }

  const dealerId = newPlayers[dealerIndex].id;

  const round: RoundState = {
    roundNumber,
    cardsPerPlayer,
    dealerId,
    currentPlayerIndex: (dealerIndex + 1) % playerCount,
    currentTrick: null,
    tricks: [],
  };

  // Handle trump determination
  if (remaining.length === 0) {
    // Last round — no trump, no dynamic
    const finalRound: RoundState = { ...round, trumpCard: undefined, trumpSuit: null, dynamicTrump: false };
    set({
      players: newPlayers,
      deck: remaining,
      round: finalRound,
      selectedCardId: null,
      bidValues: {},
      lastTrick: null,
      phase: 'trickEnd',
      message: 'Last round! No trump suit.',
    });
    setTimeout(() => startBiddingLoop(set, get), 1500);
  } else {
    const trumpCard = remaining[0];
    const dynamicTrump = trumpCard.type === 'trident' || trumpCard.type === 'octo-friend';
    const trumpSuit: Suit | null | undefined = dynamicTrump ? undefined : (trumpCard.suit ?? null);

    const message = dynamicTrump
      ? (trumpCard.type === 'trident'
          ? 'Trident revealed! First realm card each trick sets that trick\'s trump.'
          : 'Octo-Friend revealed! First realm card each trick sets that trick\'s trump.')
      : `Trump is ${SUIT_INFO[trumpCard.suit!].name}!`;

    const finalRound: RoundState = {
      ...round,
      trumpCard,
      trumpSuit,
      dynamicTrump,
      trickTrump: undefined,
    };
    set({
      players: newPlayers,
      deck: remaining,
      round: finalRound,
      selectedCardId: null,
      bidValues: {},
      lastTrick: null,
      phase: 'trickEnd',
      message,
    });
    setTimeout(() => startBiddingLoop(set, get), 1500);
  }
}

function startBiddingLoop(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore
) {
  set({ phase: 'bidding' });
  processNextBidder(set, get);
}

function processNextBidder(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore
) {
  const state = get();
  if (state.phase !== 'bidding' || !state.round) return;

  const { players, round, settings } = state;
  const currentPlayer = players[round.currentPlayerIndex];

  // Check if all have bid
  const allBid = players.every((p) => p.bid !== undefined);
  if (allBid) {
    set({ phase: 'playing' });
    startPlayingLoop(set, get);
    return;
  }

  if (currentPlayer.bid !== undefined) {
    // Skip to next
    advanceBidding(set, get);
    return;
  }

  if (currentPlayer.isHuman) {
    set({
      message: `${currentPlayer.name}, place your bid (0-${round.cardsPerPlayer})`,
    });
    // Wait for human input
    return;
  }

  // AI bids
  const delay = getAIDelay();
  setTimeout(() => {
    const currentState = get();
    if (currentState.phase !== 'bidding' || !currentState.round) return;

    const cp = currentState.players[currentState.round.currentPlayerIndex];
    if (cp.bid !== undefined) return;

    const biddingOrder = getBiddingOrder(currentState.round.dealerId, currentState.players);
    const currentBidIndex = biddingOrder.indexOf(cp.id);
    const previousBids = biddingOrder.slice(0, currentBidIndex).map((id) => {
      const p = currentState.players.find((pl) => pl.id === id);
      return p?.bid ?? 0;
    }).filter((b): b is number => b !== undefined);

    let bid = getAIBid(
      cp.hand,
      currentState.round.cardsPerPlayer,
      currentState.round.trumpSuit ?? null,
      currentState.settings.difficulty,
      previousBids,
      currentState.settings.playerCount
    );

    // Canadian rule: last bidder can't make total a multiple of cardsPerPlayer
    // Exception: round 1 only has 1 card, so all bids are forbidden — skip rule
    const playersYetToBid = currentState.players.filter((p) => p.bid === undefined);
    const isLast = playersYetToBid.length === 1;
    if (isLast && currentState.round.cardsPerPlayer > 1) {
      const totalExistingBids = currentState.players.reduce((sum, p) => sum + (p.bid ?? 0), 0);
      if ((totalExistingBids + bid) % currentState.round.cardsPerPlayer === 0) {
        // Nudge bid to nearest non-forbidden value
        if (bid < currentState.round.cardsPerPlayer && (totalExistingBids + bid + 1) % currentState.round.cardsPerPlayer !== 0) {
          bid = bid + 1;
        } else if (bid > 0 && (totalExistingBids + bid - 1) % currentState.round.cardsPerPlayer !== 0) {
          bid = bid - 1;
        }
      }
    }

    const newPlayers = currentState.players.map((p) =>
      p.id === cp.id ? { ...p, bid } : p
    );
    set({
      players: newPlayers,
      bidValues: { ...currentState.bidValues, [cp.id]: bid },
      message: `${cp.name} bids ${bid}`,
    });

    setTimeout(() => advanceBidding(set, get), 600);
  }, delay);
}

function getBiddingOrder(dealerId: string, players: Player[]): string[] {
  const dealerIndex = players.findIndex((p) => p.id === dealerId);
  const order: string[] = [];
  for (let i = 1; i <= players.length; i++) {
    order.push(players[(dealerIndex + i) % players.length].id);
  }
  return order;
}

function advanceBidding(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore
) {
  const state = get();
  if (!state.round) return;

  const { players, round } = state;
  const nextIndex = findNextBidder(round.currentPlayerIndex, players);

  const newRound: RoundState = {
    ...round,
    currentPlayerIndex: nextIndex,
  };

  set({ round: newRound });

  setTimeout(() => processNextBidder(set, get), 300);
}

function findNextBidder(currentIndex: number, players: Player[]): number {
  for (let i = 1; i <= players.length; i++) {
    const idx = (currentIndex + i) % players.length;
    if (players[idx].bid === undefined) return idx;
  }
  return currentIndex;
}

function startPlayingLoop(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore
) {
  set({ phase: 'playing' });
  processNextPlayer(set, get);
}

function processNextPlayer(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore
) {
  const state = get();
  if (state.phase !== 'playing' || !state.round) return;

  const { players, round } = state;
  const currentPlayer = players[round.currentPlayerIndex];

  // Check if trick is complete
  if (round.currentTrick && round.currentTrick.plays.length === players.length) {
    resolveTrick(set, get);
    return;
  }

  if (currentPlayer.isHuman) {
    set({ message: `${currentPlayer.name}, play a card` });
    return;
  }

  // AI plays
  const delay = getAIDelay();
  setTimeout(() => {
    const currentState = get();
    if (currentState.phase !== 'playing' || !currentState.round) return;

    const cp = currentState.players[currentState.round.currentPlayerIndex];
    if (!cp.isHuman) {
      const trick = currentState.round.currentTrick || {
        leadPlayerId: cp.id,
        plays: [],
      };

      const card = getAIPlay(
        cp,
        trick,
        currentState.round.dynamicTrump
          ? (currentState.round.trickTrump ?? null)
          : (currentState.round.trumpSuit ?? null),
        currentState.settings.difficulty,
        currentState.settings.strictFollow
      );

      executePlay(set, get, cp.id, card);
    }
  }, delay);
}

function executePlay(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore,
  playerId: string,
  card: Card
) {
  const state = get();
  if (!state.round) return;

  const { players, round } = state;
  const player = players.find((p) => p.id === playerId);
  if (!player) return;
  if (!card) return; // defensive guard — should never happen but prevents corrupt trick state

  // Remove card from hand
  const newPlayers = players.map((p) =>
    p.id === playerId
      ? { ...p, hand: p.hand.filter((c) => c.id !== card.id) }
      : p
  );

  // Create or update trick
  const trick: Trick = round.currentTrick || {
    leadPlayerId: playerId,
    plays: [],
  };

  trick.plays = [...trick.plays, { playerId, card }];

  // Resolve dynamic trick trump: first realm card played sets trump for this trick
  let trickTrump = round.trickTrump;
  if (round.dynamicTrump && trickTrump === undefined && card.type === 'realm') {
    trickTrump = card.suit ?? null;
  }

  const newRound: RoundState = {
    ...round,
    currentTrick: trick,
    currentPlayerIndex: (round.currentPlayerIndex + 1) % players.length,
    ...(round.dynamicTrump ? { trickTrump } : {}),
  };

  set({
    players: newPlayers,
    round: newRound,
    selectedCardId: null,
  });

  setTimeout(() => processNextPlayer(set, get), 400);
}

function resolveTrick(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore
) {
  const state = get();
  if (!state.round || !state.round.currentTrick) return;

  const { players, round } = state;
  const trick = round.currentTrick;

  // Use per-trick trump when in dynamic mode, otherwise use round trump
  const effectiveTrump = round.dynamicTrump
    ? (round.trickTrump ?? null)
    : (round.trumpSuit ?? null);

  const winnerId = determineTrickWinner(trick, effectiveTrump);
  const completedTrick: Trick = { ...trick, winnerId };

  const winner = players.find((p) => p.id === winnerId);

  // Update tricks won
  const newPlayers = players.map((p) =>
    p.id === winnerId ? { ...p, tricksWon: p.tricksWon + 1 } : p
  );

  const newRound: RoundState = {
    ...round,
    currentTrick: null,
    tricks: [...round.tricks, completedTrick],
    currentPlayerIndex: players.findIndex((p) => p.id === winnerId),
    trickTrump: undefined, // reset for the next trick
  };

  set({
    players: newPlayers,
    round: newRound,
    lastTrick: completedTrick,
    phase: 'trickEnd',
    message: `${winner?.name} wins the trick!`,
  });

  // After delay, continue
  setTimeout(() => {
    const currentState = get();
    if (currentState.round) {
      // Check if round is over
      if (currentState.round.tricks.length >= currentState.round.cardsPerPlayer) {
        endRound(set, get);
      } else {
        set({ phase: 'playing', lastTrick: null });
        processNextPlayer(set, get);
      }
    }
  }, TRICK_END_DELAY);
}

function endRound(
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore
) {
  const state = get();
  if (!state.round) return;

  const { players, round, roundScores, settings } = state;

  // Calculate scores
  const roundScore: RoundScore = {
    roundNumber: round.roundNumber,
    bids: {},
    tricksWon: {},
    scores: {},
  };

  const newPlayers = players.map((p) => {
    const bid = p.bid ?? 0;
    const score = calculateRoundScore(bid, p.tricksWon);
    roundScore.bids[p.id] = bid;
    roundScore.tricksWon[p.id] = p.tricksWon;
    roundScore.scores[p.id] = score;
    return { ...p, score: p.score + score };
  });

  const newRoundScores = [...roundScores, roundScore];

  // Check if game is over
  const isGameOver = round.roundNumber >= getTotalRounds(settings.playerCount);

  set({
    players: newPlayers,
    roundScores: newRoundScores,
    phase: isGameOver ? 'gameOver' : 'roundEnd',
    message: isGameOver
      ? 'Game Over!'
      : `Round ${round.roundNumber} complete!`,
    lastTrick: null,
  });

  if (!isGameOver) {
    setTimeout(() => {
      const currentState = get();
      startNewRound(set, get, round.roundNumber + 1, currentState.players);
    }, ROUND_END_DELAY);
  }
}
