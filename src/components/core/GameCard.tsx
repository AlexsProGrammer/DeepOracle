'use client';

import { motion } from 'framer-motion';
import { Card as CardType, Suit } from '@/lib/core/types';
import { SUIT_INFO } from '@/lib/core/constants';

interface GameCardProps {
  card: CardType;
  faceUp?: boolean;
  selected?: boolean;
  disabled?: boolean;
  validPlay?: boolean;
  played?: boolean;
  onClick?: () => void;
  small?: boolean;
  tiny?: boolean;
}

/* ─── SVG suit symbols for ocean realms ─── */
function SuitSymbol({ suit, size = 20, color }: { suit: Suit; size?: number; color: string }) {
  const s = size;
  switch (suit) {
    case 'reef':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Coral */}
          <path d="M12 22c0 0-1-3-1-6s1-5 3-7c1-1 2-3 2-5-1 2-3 3-4 4s-3 3-3 6 1 5 1 8h2z" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 22c0 0-3-2-4-5s0-5 2-7 3-4 3-7c0 2-1 4-2 5s-3 3-3 6 2 5 4 8h0z" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="8" r="1" fill={color} fillOpacity="0.5" />
          <circle cx="15" cy="7" r="0.8" fill={color} fillOpacity="0.4" />
        </svg>
      );
    case 'trench':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Wave */}
          <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          <path d="M2 7c2-3 4-3 6 0s4 3 6 0 4-3 6 0" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.3" />
        </svg>
      );
    case 'surface':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sun — filled circle + 8 rays */}
          <circle cx="12" cy="12" r="4" fill={color} fillOpacity="0.85" />
          {/* Cardinal rays */}
          <line x1="12" y1="2" x2="12" y2="5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="12" y1="18.5" x2="12" y2="22" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="2" y1="12" x2="5.5" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="18.5" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          {/* Diagonal rays */}
          <line x1="4.93" y1="4.93" x2="7.34" y2="7.34" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16.66" y1="16.66" x2="19.07" y2="19.07" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="19.07" y1="4.93" x2="16.66" y2="7.34" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="7.34" y1="16.66" x2="4.93" y2="19.07" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'kelp':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Kelp / Seaweed */}
          <path d="M8 22c0-4 2-6 2-10s-1-5 1-8" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 22c0-3 1-5 1-8s-1-4 1-7" fill="none" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M16 22c0-4-1-6-1-9s1-4-1-8" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="6" cy="14" rx="2" ry="4" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1" />
          <ellipse cx="18" cy="12" rx="2" ry="3.5" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1" />
        </svg>
      );
  }
}

/* ─── Trident symbol — three-pronged golden spear ─── */
function TridentSymbol({ size = 28, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Staff */}
      <line x1="16" y1="14" x2="16" y2="30" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Left prong */}
      <line x1="16" y1="14" x2="8" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Right prong */}
      <line x1="16" y1="14" x2="24" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Center prong */}
      <line x1="16" y1="14" x2="16" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Prong tips — small barbs */}
      <line x1="9" y1="6" x2="7" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="23" y1="6" x2="25" y2="3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="5" x2="13" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="5" x2="19" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Center gem */}
      <circle cx="16" cy="16" r="2.5" fill={color} fillOpacity="0.35" stroke={color} strokeWidth="1" />
    </svg>
  );
}

/* ─── Octo-Friend symbol — cute sad octopus ─── */
function OctoFriendSymbol({ size = 28, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <ellipse cx="16" cy="14" rx="9" ry="8" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" />
      {/* Big sad eyes */}
      <circle cx="12" cy="12" r="2.5" fill="none" stroke={color} strokeWidth="1.3" />
      <circle cx="20" cy="12" r="2.5" fill="none" stroke={color} strokeWidth="1.3" />
      <circle cx="12" cy="12.8" r="1.2" fill={color} fillOpacity="0.6" />
      <circle cx="20" cy="12.8" r="1.2" fill={color} fillOpacity="0.6" />
      {/* Sad mouth */}
      <path d="M12 18c2 1.5 6 1.5 8 0" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* Tentacles */}
      <path d="M8 20c-1 3-2 5-4 7" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M11 21c-0.5 3-0.5 5-1 8" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M14 22c0 3 0 5 0 8" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M18 22c0 3 0 5 0 8" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M21 21c0.5 3 0.5 5 1 8" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <path d="M24 20c1 3 2 5 4 7" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function GameCard({
  card,
  faceUp = true,
  selected = false,
  disabled = false,
  validPlay = false,
  played = false,
  onClick,
  small = false,
  tiny = false,
}: GameCardProps) {
  const isTrident = card.type === 'trident';
  const isOctoFriend = card.type === 'octo-friend';
  const suitInfo = card.suit ? SUIT_INFO[card.suit] : null;
  const color = isTrident ? '#FFD700' : isOctoFriend ? '#a78bfa' : suitInfo?.color ?? '#fff';
  const bgGradient = isTrident
    ? 'linear-gradient(145deg, #1a1200 0%, #2d2000 30%, #3d2e00 100%)'
    : isOctoFriend
      ? 'linear-gradient(145deg, #0c0620 0%, #1a0f38 30%, #251848 100%)'
      : suitInfo?.bgGradient ?? 'linear-gradient(145deg, #0c1e3a 0%, #112240 100%)';

  /* ─── Sizing: tiny (AI hands), small (trump/played), full (player hand) ─── */
  const isTiny = tiny;
  const isSmall = small && !tiny;

  const cardW = isTiny ? 'w-[42px] h-[58px]' : isSmall ? 'w-[56px] h-[78px] sm:w-[66px] sm:h-[92px]' : 'w-[80px] h-[112px] sm:w-[100px] sm:h-[140px]';
  const pad = isTiny ? 'p-0.5' : isSmall ? 'p-0.5 sm:p-1' : 'p-1 sm:p-1.5';
  const cornerTextSize = isTiny ? 'text-[7px]' : isSmall ? 'text-[9px] sm:text-[10px]' : 'text-xs sm:text-sm';
  const cornerSubSize = isTiny ? 'hidden' : isSmall ? 'text-[6px] sm:text-[7px]' : 'text-[8px] sm:text-[10px]';
  const centerSuitSize = isTiny ? 10 : isSmall ? 16 : 24;
  const centerTextSize = isTiny ? 'text-[14px] sm:text-base' : isSmall ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl';
  const cornerSuitSize = isTiny ? 6 : isSmall ? 8 : 12;

  /* ─── Card back ─── */
  if (!faceUp) {
    return (
      <div
        className={`${cardW} rounded-lg border border-cyan-800/40 flex items-center justify-center shadow-lg relative overflow-hidden`}
        style={{
          background: 'linear-gradient(145deg, #060d1f 0%, #0c1e3a 30%, #060d1f 100%)',
        }}
      >
        {/* Inner frame */}
        <div
          className="absolute inset-[3px] rounded-md"
          style={{
            border: '1px solid rgba(14, 165, 233, 0.2)',
            background: 'linear-gradient(145deg, #0a1628 0%, #112240 50%, #0a1628 100%)',
          }}
        />
        {/* Wave pattern */}
        <div className="absolute inset-[6px] overflow-hidden rounded opacity-15">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(14,165,233,0.3) 4px, rgba(14,165,233,0.3) 5px)`,
          }} />
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(6,182,212,0.3) 4px, rgba(6,182,212,0.3) 5px)`,
          }} />
        </div>
        {/* Center emblem — wave */}
        <motion.div
          className="relative z-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <svg
            width={isTiny ? 16 : isSmall ? 22 : 28}
            height={isTiny ? 16 : isSmall ? 22 : 28}
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M4 16c4-5 8-5 12 0s8 5 12 0"
              fill="none"
              stroke="rgba(14,165,233,0.5)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <path
              d="M4 20c4-5 8-5 12 0s8 5 12 0"
              fill="none"
              stroke="rgba(6,182,212,0.3)"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <circle cx="16" cy="16" r="5" fill="rgba(14,165,233,0.1)" stroke="rgba(14,165,233,0.3)" strokeWidth="0.8" />
          </svg>
        </motion.div>
      </div>
    );
  }

  /* ─── Card face ─── */
  return (
    <motion.div
      className={`
        ${cardW} rounded-lg flex flex-col justify-between ${pad} relative select-none
        transition-shadow duration-200
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${selected ? '-translate-y-2 sm:-translate-y-3' : ''}
        ${played ? '' : ''}
        ${!disabled && !played ? 'hover:-translate-y-1' : ''}
      `}
      style={{
        background: bgGradient,
        border: selected
          ? '2px solid #fbbf24'
          : validPlay
            ? '2px solid rgba(251,191,36,0.5)'
            : '2px solid rgba(14, 165, 233, 0.3)',
        boxShadow: selected
          ? '0 0 24px rgba(251,191,36,0.4), 0 0 8px rgba(251,191,36,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
          : validPlay
            ? '0 0 16px rgba(251,191,36,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
            : '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
      whileHover={!disabled && !played ? { scale: 1.05 } : {}}
      whileTap={!disabled && !played ? { scale: 0.97 } : {}}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Top inner border accent */}
      <div
        className="absolute inset-[2px] rounded-md pointer-events-none"
        style={{
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      />

      {/* Top-left corner */}
      <div className="flex flex-col items-start leading-none z-10 overflow-hidden">
        <span className={`${cornerTextSize} font-bold`} style={{ color }}>
          {isTrident ? 'T' : isOctoFriend ? 'O' : card.display}
        </span>
        {!isTiny && (
          <div className={cornerSubSize}>
            {!isTrident && !isOctoFriend && card.suit && (
              <SuitSymbol suit={card.suit} size={cornerSuitSize} color={color} />
            )}
            {isTrident && (
              <svg width={cornerSuitSize} height={cornerSuitSize} viewBox="0 0 32 32" fill="none">
                <line x1="16" y1="8" x2="16" y2="24" stroke={color} strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="8" x2="8" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="16" y1="8" x2="24" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            {isOctoFriend && (
              <svg width={cornerSuitSize} height={cornerSuitSize} viewBox="0 0 32 32" fill="none">
                <ellipse cx="16" cy="14" rx="6" ry="5" fill={color} fillOpacity="0.3" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Center area */}
      <div className="flex-1 flex items-center justify-center relative z-10 overflow-hidden">
        {isTrident ? (
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <TridentSymbol size={isTiny ? 18 : isSmall ? 24 : 36} color="#FFD700" />
          </motion.div>
        ) : isOctoFriend ? (
          <motion.div
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <OctoFriendSymbol size={isTiny ? 18 : isSmall ? 24 : 36} color="#a78bfa" />
          </motion.div>
        ) : card.suit ? (
          <div className="flex flex-col items-center gap-0">
            <span className={`${centerTextSize} font-bold leading-none`} style={{ color }}>
              {card.value}
            </span>
            <SuitSymbol suit={card.suit} size={centerSuitSize} color={color} />
          </div>
        ) : null}

        {/* Subtle radial glow in center for special cards */}
        {(isTrident || isOctoFriend) && (
          <div
            className="absolute inset-0 rounded opacity-20 pointer-events-none"
            style={{
              background: isTrident
                ? 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)',
            }}
          />
        )}
      </div>

      {/* Bottom-right corner (rotated 180) */}
      <div className="flex flex-col items-end leading-none rotate-180 z-10 overflow-hidden">
        <span className={`${cornerTextSize} font-bold`} style={{ color }}>
          {isTrident ? 'T' : isOctoFriend ? 'O' : card.display}
        </span>
        {!isTiny && (
          <div className={cornerSubSize}>
            {!isTrident && !isOctoFriend && card.suit && (
              <SuitSymbol suit={card.suit} size={cornerSuitSize} color={color} />
            )}
            {isTrident && (
              <svg width={cornerSuitSize} height={cornerSuitSize} viewBox="0 0 32 32" fill="none">
                <line x1="16" y1="8" x2="16" y2="24" stroke={color} strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="8" x2="8" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="16" y1="8" x2="24" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            {isOctoFriend && (
              <svg width={cornerSuitSize} height={cornerSuitSize} viewBox="0 0 32 32" fill="none">
                <ellipse cx="16" cy="14" rx="6" ry="5" fill={color} fillOpacity="0.3" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Bottom gradient overlay for depth */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none rounded-b-lg"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)',
        }}
      />

      {/* Valid play pulsing border */}
      {validPlay && !selected && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none z-20"
          style={{ border: '2px solid rgba(251,191,36,0.4)' }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
