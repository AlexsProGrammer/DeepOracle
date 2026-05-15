import { Card, Suit } from './types';
import { SUITS, CARD_VALUES, VALUE_DISPLAY, SUIT_INFO } from './constants';

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of SUITS) {
    for (const value of CARD_VALUES) {
      deck.push({
        id: `${suit}-${value}`,
        type: 'realm',
        suit,
        value,
        display: `${SUIT_INFO[suit].symbol}${VALUE_DISPLAY[value]}`,
      });
    }
  }

  // 4 Trident cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `trident-${i}`,
      type: 'trident',
      display: 'T',
    });
  }

  // 4 Octo-Friend cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `octo-friend-${i}`,
      type: 'octo-friend',
      display: 'O',
    });
  }

  return deck;
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function deal(deck: Card[], playerCount: number, cardsPerPlayer: number): { hands: Card[][]; remaining: Card[] } {
  const totalCardsNeeded = playerCount * cardsPerPlayer;
  const dealingCards = deck.slice(0, totalCardsNeeded);
  const remaining = deck.slice(totalCardsNeeded);

  const hands: Card[][] = Array.from({ length: playerCount }, () => []);

  for (let i = 0; i < dealingCards.length; i++) {
    hands[i % playerCount].push(dealingCards[i]);
  }

  return { hands, remaining };
}

export function getTotalRounds(playerCount: number): number {
  return Math.floor(60 / playerCount);
}

export function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<string, number> = {
    reef: 0,
    trench: 1,
    surface: 2,
    kelp: 3,
    'octo-friend': 4,
    trident: 5,
  };

  return [...hand].sort((a, b) => {
    const aType = a.type === 'octo-friend' ? 'octo-friend' : a.type === 'trident' ? 'trident' : a.suit!;
    const bType = b.type === 'octo-friend' ? 'octo-friend' : b.type === 'trident' ? 'trident' : b.suit!;

    const suitDiff = suitOrder[aType] - suitOrder[bType];
    if (suitDiff !== 0) return suitDiff;

    return (a.value ?? 0) - (b.value ?? 0);
  });
}

export function getTrumpSuit(trumpCard: Card | undefined): Suit | null {
  if (!trumpCard) return null;
  if (trumpCard.type === 'octo-friend') return null;
  if (trumpCard.type === 'trident') return null; // dealer chooses - handled elsewhere
  return trumpCard.suit ?? null;
}
