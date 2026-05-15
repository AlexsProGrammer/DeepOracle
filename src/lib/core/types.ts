export type Suit = 'reef' | 'trench' | 'surface' | 'kelp';
export type CardType = 'realm' | 'trident' | 'octo-friend';

export interface Card {
  id: string;
  type: CardType;
  suit?: Suit;
  value?: number;
  display: string;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  score: number;
  bid?: number;
  tricksWon: number;
  hand: Card[];
  isDealer: boolean;
  avatar: string;
}

export type GamePhase =
  | 'start'
  | 'bidding'
  | 'playing'
  | 'trickEnd'
  | 'roundEnd'
  | 'gameOver';

export interface Trick {
  leadPlayerId: string;
  plays: { playerId: string; card: Card }[];
  winnerId?: string;
}

export interface RoundState {
  roundNumber: number;
  cardsPerPlayer: number;
  trumpCard?: Card;
  trumpSuit?: Suit | null;
  dynamicTrump?: boolean;
  trickTrump?: Suit | null;
  dealerId: string;
  currentPlayerIndex: number;
  currentTrick: Trick | null;
  tricks: Trick[];
}

export interface RoundScore {
  roundNumber: number;
  bids: Record<string, number>;
  tricksWon: Record<string, number>;
  scores: Record<string, number>;
}

export interface GameSettings {
  playerCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  strictFollow: boolean;
}

export interface GameState {
  phase: GamePhase;
  settings: GameSettings;
  players: Player[];
  round: RoundState | null;
  roundScores: RoundScore[];
  deck: Card[];
  totalRounds: number;
  selectedCardId: string | null;
  bidValues: Record<string, number>;
  lastTrick: Trick | null;
  message: string;
}
