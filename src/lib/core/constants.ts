import { Suit } from './types';

export const SUIT_INFO: Record<Suit, { name: string; color: string; symbol: string; emoji: string; gradient: string; bgGradient: string; darkColor: string }> = {
  reef: {
    name: 'The Reef',
    color: '#FF6B6B',
    symbol: 'R',
    emoji: '🪸',
    gradient: 'linear-gradient(135deg, #c0392b 0%, #FF6B6B 50%, #FF8E53 100%)',
    bgGradient: 'linear-gradient(145deg, #1a0a0a 0%, #2d1515 40%, #3d1c1c 100%)',
    darkColor: '#c0392b',
  },
  trench: {
    name: 'The Trench',
    color: '#4ECDC4',
    symbol: 'T',
    emoji: '🌊',
    gradient: 'linear-gradient(135deg, #0A1628 0%, #1B3A5C 50%, #4ECDC4 100%)',
    bgGradient: 'linear-gradient(145deg, #060d1a 0%, #0c1e3a 40%, #122a4f 100%)',
    darkColor: '#1B3A5C',
  },
  surface: {
    name: 'The Surface',
    color: '#F4C430',
    symbol: 'S',
    emoji: '☀️',
    gradient: 'linear-gradient(135deg, #B8860B 0%, #F4C430 50%, #FFE066 100%)',
    bgGradient: 'linear-gradient(145deg, #2a1f05 0%, #3d2d08 40%, #4d3a0c 100%)',
    darkColor: '#B8860B',
  },
  kelp: {
    name: 'The Kelp Forest',
    color: '#00B894',
    symbol: 'K',
    emoji: '🌿',
    gradient: 'linear-gradient(135deg, #00815a 0%, #00B894 50%, #55EFC4 100%)',
    bgGradient: 'linear-gradient(145deg, #0a1a15 0%, #0c2d22 40%, #104030 100%)',
    darkColor: '#00815a',
  },
};

export const SUITS: Suit[] = ['reef', 'trench', 'surface', 'kelp'];

export const CARD_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export const VALUE_DISPLAY: Record<number, string> = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: '11',
  12: '12',
  13: '13',
};

export const AI_NAMES = ['Poseidon', 'Nereid', 'Kraken', 'Leviathan', 'Siren', 'Calypso'];
export const AI_AVATARS = ['🧜', '🐙', '🦈', '🐋', '🦑', '🐠'];

export const PLAYER_NAME = 'You';
export const PLAYER_AVATAR = '👑';

export const ORACLE_SCORE_EXACT = 20;
export const ORACLE_SCORE_PER_TRICK = 10;
export const ORACLE_SCORE_MISS = 10;

export const AI_DELAY_MIN = 800;
export const AI_DELAY_MAX = 1200;
export const TRICK_END_DELAY = 1500;
export const ROUND_END_DELAY = 3000;

export const THEME = {
  cyan: '#0ea5e9',
  teal: '#06b6d4',
  lightCyan: '#22d3ee',
  gold: '#fbbf24',
  darkBg: '#060d1f',
  darkSurface: '#0c1e3a',
  darkCard: '#112240',
  deepBg: '#0a1628',
};
