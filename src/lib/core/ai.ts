import { Card, Suit, Trick, Player } from './types';
import { getValidCards, determineTrickWinner } from './trick';
import { AI_DELAY_MIN, AI_DELAY_MAX } from './constants';

function randomDelay(): number {
  return Math.floor(Math.random() * (AI_DELAY_MAX - AI_DELAY_MIN)) + AI_DELAY_MIN;
}

export function getAIBid(
  hand: Card[],
  cardsPerPlayer: number,
  trumpSuit: Suit | null,
  difficulty: 'easy' | 'medium' | 'hard',
  otherBids: number[],
  playerCount: number
): number {
  if (difficulty === 'easy') {
    return easyBid(hand, cardsPerPlayer);
  }
  if (difficulty === 'medium') {
    return mediumBid(hand, cardsPerPlayer, trumpSuit);
  }
  return hardBid(hand, cardsPerPlayer, trumpSuit, otherBids, playerCount);
}

function easyBid(hand: Card[], cardsPerPlayer: number): number {
  // Simple: count high cards
  let bid = 0;
  for (const card of hand) {
    if (card.type === 'trident') bid += 1;
    else if (card.type === 'realm' && card.value && card.value >= 10) bid += 0.5;
  }
  return Math.min(Math.round(bid), cardsPerPlayer);
}

function mediumBid(hand: Card[], cardsPerPlayer: number, trumpSuit: Suit | null): number {
  let bid = 0;
  for (const card of hand) {
    if (card.type === 'trident') {
      bid += 1;
    } else if (card.type === 'realm') {
      if (card.suit === trumpSuit && card.value && card.value >= 8) {
        bid += 0.7;
      } else if (card.suit !== trumpSuit && card.value && card.value >= 12) {
        bid += 0.5;
      }
    }
  }
  // Subtract for octo-friends
  const octoFriendCount = hand.filter((c) => c.type === 'octo-friend').length;
  bid -= octoFriendCount * 0.3;
  return Math.max(0, Math.min(Math.round(bid), cardsPerPlayer));
}

function hardBid(hand: Card[], cardsPerPlayer: number, trumpSuit: Suit | null, otherBids: number[], playerCount: number): number {
  let bid = 0;
  let trumpCards = 0;
  let highCards = 0;

  for (const card of hand) {
    if (card.type === 'trident') {
      bid += 1;
    } else if (card.type === 'realm') {
      if (card.suit === trumpSuit) {
        trumpCards++;
        if (card.value && card.value >= 10) bid += 0.8;
        else if (card.value && card.value >= 6) bid += 0.4;
      } else if (card.value && card.value >= 12) {
        highCards++;
        bid += 0.3;
      }
    }
  }

  // Having many cards in one non-trump suit increases chances
  const suitCounts: Record<string, number> = {};
  for (const card of hand) {
    if (card.type === 'realm' && card.suit !== trumpSuit) {
      suitCounts[card.suit!] = (suitCounts[card.suit!] ?? 0) + 1;
    }
  }
  for (const count of Object.values(suitCounts)) {
    if (count >= 3) bid += 0.2;
  }

  // Canadian rule: can't bid total = total tricks
  const maxBid = cardsPerPlayer;
  const otherBidsTotal = otherBids.reduce((a, b) => a + b, 0);
  const minPossible = Math.max(0, maxBid - otherBidsTotal);
  const maxPossible = maxBid - otherBidsTotal;

  bid = Math.round(bid);

  if (bid < minPossible) bid = minPossible;
  if (bid > maxPossible && maxPossible >= 0) bid = maxPossible;

  return Math.max(0, Math.min(bid, maxBid));
}

export function getAIPlay(
  player: Player,
  trick: Trick,
  trumpSuit: Suit | null,
  difficulty: 'easy' | 'medium' | 'hard',
  strictFollow = false
): Card {
  const validCards = getValidCards(player.hand, trick, strictFollow);

  // Defensive: if no valid cards (empty hand or edge case), fall back to any card
  if (validCards.length === 0) return player.hand[0];

  if (validCards.length === 1) return validCards[0];

  if (difficulty === 'easy') {
    return easyPlay(validCards, trick, trumpSuit, player);
  }
  if (difficulty === 'medium') {
    return mediumPlay(validCards, trick, trumpSuit, player);
  }
  return hardPlay(validCards, trick, trumpSuit, player);
}

function easyPlay(validCards: Card[], trick: Trick, _trumpSuit: Suit | null, _player: Player): Card {
  // Random valid card
  return validCards[Math.floor(Math.random() * validCards.length)];
}

function mediumPlay(validCards: Card[], trick: Trick, trumpSuit: Suit | null, player: Player): Card {
  const { bid, tricksWon } = player;

  if (trick.plays.length === 0) {
    // Leading
    return mediumLead(validCards, trumpSuit, bid, tricksWon);
  }

  // Following
  const currentWinner = determineTrickWinner(trick, trumpSuit);
  const isWinning = currentWinner === player.id;

  if (bid !== undefined && tricksWon < bid) {
    // Need to win more tricks
    if (!isWinning) {
      return tryToWin(validCards, trick, trumpSuit);
    }
    return playLowest(validCards, trumpSuit);
  } else {
    // Have enough or over bid
    return playLowest(validCards, trumpSuit);
  }
}

function mediumLead(validCards: Card[], trumpSuit: Suit | null, bid: number | undefined, tricksWon: number): Card {
  const tridents = validCards.filter((c) => c.type === 'trident');
  if (tridents.length > 0 && bid !== undefined && tricksWon < bid) return tridents[0];

  // Lead high non-trump
  const highNonTrump = validCards
    .filter((c) => c.type === 'realm' && c.suit !== trumpSuit)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  if (highNonTrump.length > 0) return highNonTrump[0];

  // Lead trump if strong
  const trumpCards = validCards
    .filter((c) => c.type === 'realm' && c.suit === trumpSuit)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  if (trumpCards.length > 0 && bid !== undefined && tricksWon < bid) return trumpCards[0];

  // Default: lowest card
  return playLowest(validCards, trumpSuit);
}

function hardPlay(validCards: Card[], trick: Trick, trumpSuit: Suit | null, player: Player): Card {
  const { bid, tricksWon } = player;
  const needToWin = bid !== undefined && tricksWon < bid;
  const overBid = bid !== undefined && tricksWon >= bid;

  if (trick.plays.length === 0) {
    return hardLead(validCards, trumpSuit, needToWin, overBid, player);
  }

  const currentWinner = determineTrickWinner(trick, trumpSuit);
  const isWinning = currentWinner === player.id;

  if (overBid) {
    // Dump lowest
    return playLowest(validCards, trumpSuit);
  }

  if (!isWinning && needToWin) {
    return tryToWin(validCards, trick, trumpSuit);
  }

  if (isWinning && trick.plays.length === validCards.length + trick.plays.length - 1) {
    // Last to play and winning - play lowest
    return playLowest(validCards, trumpSuit);
  }

  return playLowest(validCards, trumpSuit);
}

function hardLead(validCards: Card[], trumpSuit: Suit | null, needToWin: boolean, overBid: boolean, player: Player): Card {
  if (overBid) {
    // Lead lowest to dump
    const octoFriends = validCards.filter((c) => c.type === 'octo-friend');
    if (octoFriends.length > 0) return octoFriends[0];
    return playLowest(validCards, trumpSuit);
  }

  if (needToWin) {
    const tridents = validCards.filter((c) => c.type === 'trident');
    if (tridents.length > 0) return tridents[0];

    // Lead with a suit we have many of
    const suitCounts: Record<string, number> = {};
    for (const card of player.hand) {
      if (card.type === 'realm') {
        suitCounts[card.suit!] = (suitCounts[card.suit!] ?? 0) + 1;
      }
    }

    const bestSuit = Object.entries(suitCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

    if (bestSuit) {
      const suitCards = validCards
        .filter((c) => c.type === 'realm' && c.suit === bestSuit)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
      if (suitCards.length > 0) return suitCards[0];
    }

    return playLowest(validCards, trumpSuit);
  }

  // Default: play lowest
  return playLowest(validCards, trumpSuit);
}

function tryToWin(validCards: Card[], trick: Trick, trumpSuit: Suit | null): Card {
  // Try trump first
  const trumpCards = validCards
    .filter((c) => c.type === 'realm' && c.suit === trumpSuit)
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0));

  if (trumpCards.length > 0) {
    // Check if smallest trump beats current winner
    const winner = determineTrickWinner(trick, trumpSuit);
    const winnerPlay = trick.plays.find((p) => p.playerId === winner);
    if (winnerPlay && winnerPlay.card && winnerPlay.card.type === 'realm' && winnerPlay.card.suit === trumpSuit) {
      const beatingTrumps = trumpCards.filter((c) => (c.value ?? 0) > (winnerPlay.card.value ?? 0));
      if (beatingTrumps.length > 0) return beatingTrumps[0];
    } else {
      return trumpCards[0];
    }
  }

  // Try to beat with lead suit
  const leadSuitCards = validCards
    .filter((c) => c.type === 'realm')
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0));

  if (leadSuitCards.length > 0) {
    return leadSuitCards[leadSuitCards.length - 1]; // Highest
  }

  // Octo-Friends are low - dump them
  const octoFriends = validCards.filter((c) => c.type === 'octo-friend');
  if (octoFriends.length > 0) return octoFriends[0];

  return validCards[0];
}

function playLowest(validCards: Card[], trumpSuit: Suit | null): Card {
  // Dump octo-friends first
  const octoFriends = validCards.filter((c) => c.type === 'octo-friend');
  if (octoFriends.length > 0) return octoFriends[0];

  // Play lowest non-trump
  const nonTrump = validCards
    .filter((c) => c.type === 'realm' && c.suit !== trumpSuit)
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0));

  if (nonTrump.length > 0) return nonTrump[0];

  // Play lowest card
  const sorted = validCards
    .filter((c) => c.type === 'realm')
    .sort((a, b) => (a.value ?? 0) - (b.value ?? 0));

  return sorted.length > 0 ? sorted[0] : validCards[0];
}

export function getAIDelay(): number {
  return randomDelay();
}

/**
 * AI dealer picks the best trump suit based on their hand.
 * Chooses the suit with the most cards and highest total value.
 */
export function getAITrumpSuit(hand: Card[]): Suit {
  const suits: Suit[] = ['reef', 'trench', 'surface', 'kelp'];
  const suitScores: Record<string, { count: number; totalValue: number }> = {};

  for (const suit of suits) {
    suitScores[suit] = { count: 0, totalValue: 0 };
  }

  for (const card of hand) {
    if (card.type === 'realm' && card.suit) {
      suitScores[card.suit].count++;
      suitScores[card.suit].totalValue += card.value ?? 0;
    }
  }

  // Score: count * 10 + totalValue (prefer more cards, then higher values)
  let bestSuit: Suit = suits[0];
  let bestScore = -1;

  for (const suit of suits) {
    const score = suitScores[suit].count * 10 + suitScores[suit].totalValue;
    if (score > bestScore) {
      bestScore = score;
      bestSuit = suit;
    }
  }

  return bestSuit;
}
