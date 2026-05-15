'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, BookOpen, Waves, Crown, Swords, Wifi, Globe, Monitor } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { AI_AVATARS, AI_NAMES } from '@/lib/core/constants';
import { RulesDialog } from './RulesDialog';
import { GameSettings } from '@/lib/core/types';

type Screen = 'menu' | 'singleplayer';

interface StartScreenProps {
  onStartGame: (settings: GameSettings) => void;
  onMultiplayer: (mode: 'host' | 'join') => void;
}

export function StartScreen({ onStartGame, onMultiplayer }: StartScreenProps) {
  const [screen, setScreen] = useState<Screen>('menu');
  const [playerCount, setPlayerCount] = useState(4);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [strictFollow, setStrictFollow] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const opponents = AI_AVATARS.slice(0, playerCount - 1).map((avatar, i) => ({
    name: AI_NAMES[i],
    avatar,
  }));

  const handleStart = () => {
    onStartGame({ playerCount, difficulty, strictFollow });
  };

  if (screen === 'singleplayer') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md z-10"
        >
          <Card className="bg-[#0c1e3a]/70 border-cyan-800/40 backdrop-blur-sm">
            <CardContent className="p-6 space-y-5">
              <button
                onClick={() => setScreen('menu')}
                className="text-cyan-400 hover:text-cyan-200 text-sm mb-2 flex items-center gap-1 transition-colors"
              >
                ← Back to menu
              </button>

              <div className="space-y-2">
                <label className="text-cyan-200 text-sm font-medium flex items-center gap-2">
                  <Swords className="w-4 h-4 text-cyan-400" />
                  Number of Players
                </label>
                <Select value={playerCount.toString()} onValueChange={(v) => setPlayerCount(Number(v))}>
                  <SelectTrigger className="bg-[#0c1e3a]/80 border-cyan-700/50 text-cyan-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a1628] border-cyan-700/50">
                    {[3, 4, 5, 6].map((n) => (
                      <SelectItem key={n} value={n.toString()} className="text-cyan-100 focus:bg-[#0c1e3a]/50 focus:text-cyan-50">
                        {n} Players ({n - 1} AI Opponents)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-cyan-200 text-sm font-medium flex items-center gap-2">
                  <Crown className="w-4 h-4 text-cyan-400" />
                  AI Difficulty
                </label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'easy' | 'medium' | 'hard')}>
                  <SelectTrigger className="bg-[#0c1e3a]/80 border-cyan-700/50 text-cyan-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a1628] border-cyan-700/50">
                    <SelectItem value="easy" className="text-cyan-100 focus:bg-[#0c1e3a]/50">⭐ Easy</SelectItem>
                    <SelectItem value="medium" className="text-cyan-100 focus:bg-[#0c1e3a]/50">⭐⭐ Medium</SelectItem>
                    <SelectItem value="hard" className="text-cyan-100 focus:bg-[#0c1e3a]/50">⭐⭐⭐ Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start justify-between gap-3 rounded-lg bg-[#0c1e3a]/50 border border-cyan-800/30 p-3">
                <div className="space-y-0.5">
                  <p className="text-cyan-200 text-sm font-medium">Strict Follow-Suit</p>
                  <p className="text-cyan-400/60 text-xs leading-snug">
                    Tridents &amp; Octo-Friends cannot be played if you hold the led suit. Harder variant.
                  </p>
                </div>
                <Switch
                  checked={strictFollow}
                  onCheckedChange={setStrictFollow}
                  className="shrink-0 mt-0.5"
                />
              </div>

              <div className="space-y-2">
                <label className="text-cyan-200 text-sm font-medium">Your Opponents</label>
                <div className="flex gap-3 flex-wrap">
                  {opponents.map((op) => (
                    <motion.div key={op.name} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#0c1e3a]/50" whileHover={{ scale: 1.05 }}>
                      <span className="text-2xl">{op.avatar}</span>
                      <span className="text-[10px] text-cyan-300">{op.name}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleStart}
                  className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold py-6 text-lg shadow-lg shadow-cyan-900/50 border border-cyan-500/30"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Game
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
        <RulesDialog open={showRules} onOpenChange={setShowRules} />
      </div>
    );
  }

  // Main menu
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div
        className="text-center mb-8 sm:mb-10 relative z-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="flex items-center justify-center gap-3 mb-2"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Waves className="w-8 h-8 text-yellow-400" />
          <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-b from-cyan-300 via-cyan-400 to-teal-600 bg-clip-text text-transparent drop-shadow-lg tracking-wider">
            DEEP ORACLE
          </h1>
          <Waves className="w-8 h-8 text-yellow-400" />
        </motion.div>
        <p className="text-cyan-300/70 text-sm sm:text-lg tracking-[0.3em] uppercase">
          Predict the Tides. Rule the Depths.
        </p>
      </motion.div>

      {/* Mode selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full max-w-md z-10 space-y-3"
      >
        {/* Singleplayer */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setScreen('singleplayer')}
            className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold py-6 text-lg shadow-lg shadow-cyan-900/50 border border-cyan-500/30"
          >
            <Monitor className="w-5 h-5 mr-2" />
            Singleplayer
            <span className="ml-2 text-cyan-200/60 text-sm font-normal">vs AI</span>
          </Button>
        </motion.div>

        {/* Multiplayer */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => onMultiplayer('host')}
              variant="outline"
              className="w-full h-auto py-5 border-cyan-600/40 bg-[#0a1628]/60 hover:bg-[#0c1e3a]/60 hover:border-cyan-500/50 text-cyan-100"
            >
              <div className="flex flex-col items-center gap-1">
                <Wifi className="w-5 h-5 text-green-400" />
                <span className="font-bold text-sm">Host</span>
                <span className="text-[10px] text-cyan-400/60">Create Room</span>
              </div>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => onMultiplayer('join')}
              variant="outline"
              className="w-full h-auto py-5 border-cyan-600/40 bg-[#0a1628]/60 hover:bg-[#0c1e3a]/60 hover:border-cyan-500/50 text-cyan-100"
            >
              <div className="flex flex-col items-center gap-1">
                <Globe className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm">Join</span>
                <span className="text-[10px] text-cyan-400/60">Enter Code</span>
              </div>
            </Button>
          </motion.div>
        </div>

        {/* Rules */}
        <Button
          variant="ghost"
          onClick={() => setShowRules(true)}
          className="w-full text-cyan-300 hover:text-cyan-100 hover:bg-[#0c1e3a]/40 mt-4"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          How to Play
        </Button>
      </motion.div>

      <RulesDialog open={showRules} onOpenChange={setShowRules} />
    </div>
  );
}
