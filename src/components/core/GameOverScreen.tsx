'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/lib/core/game-store';
import { Trophy, RotateCcw, Waves, Medal } from 'lucide-react';

export function GameOverScreen() {
  const { players, roundScores, totalRounds, resetGame } = useGameStore();

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const podiumColors = [
    'from-yellow-500/20 to-yellow-600/10 border-yellow-500/40',
    'from-gray-400/20 to-gray-500/10 border-gray-400/40',
    'from-amber-700/20 to-amber-800/10 border-amber-700/40',
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background celebration particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-yellow-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${8 + Math.random() * 12}px`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.1, 0.6, 0.1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          >
            ✦
          </motion.div>
        ))}
      </div>

      <motion.div
        className="relative z-10 w-full max-w-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-b from-yellow-300 to-amber-600 bg-clip-text text-transparent mb-2">
            Game Over!
          </h1>
          <p className="text-cyan-300/70 text-sm">
            {totalRounds} rounds completed
          </p>
        </motion.div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 sm:gap-4 mb-8 min-h-[200px]">
          {sortedPlayers.slice(0, 3).map((player, idx) => {
            const height = idx === 0 ? 160 : idx === 1 ? 120 : 90;
            const delay = idx * 0.2;

            return (
              <motion.div
                key={player.id}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + delay, type: 'spring' }}
              >
                <div className="text-center mb-2">
                  <span className="text-2xl sm:text-3xl block mb-1">
                    {player.avatar}
                  </span>
                  <span className="text-xs sm:text-sm text-cyan-200 font-medium">
                    {player.name}
                  </span>
                </div>
                <motion.div
                  className={`w-20 sm:w-28 bg-gradient-to-t ${podiumColors[idx]} border rounded-t-lg flex flex-col items-center justify-end p-2`}
                  initial={{ height: 0 }}
                  animate={{ height }}
                  transition={{ delay: 0.6 + delay, duration: 0.5 }}
                >
                  <span className="text-2xl sm:text-3xl font-bold text-yellow-400">
                    {idx + 1}
                  </span>
                </motion.div>
                <div className="text-center mt-2">
                  <span className="text-lg sm:text-xl font-bold text-yellow-300">
                    {player.score}
                  </span>
                  <span className="text-cyan-400 text-[10px] block">pts</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* All players */}
        {sortedPlayers.length > 3 && (
          <motion.div
            className="space-y-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {sortedPlayers.slice(3).map((player, idx) => (
              <div
                key={player.id}
                className="flex items-center justify-between px-4 py-2 bg-[#0c1e3a]/30 rounded-lg border border-cyan-800/20"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{player.avatar}</span>
                  <span className="text-sm text-cyan-200">{player.name}</span>
                </div>
                <span className="font-bold text-cyan-300">
                  {player.score} pts
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Round breakdown */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <button
            onClick={() => {
              const el = document.getElementById('round-breakdown');
              if (el) el.classList.toggle('hidden');
            }}
            className="flex items-center gap-2 text-cyan-300 text-sm hover:text-cyan-100 transition-colors w-full justify-center"
          >
            <Medal className="w-4 h-4" />
            Round-by-Round Breakdown
          </button>
          <div id="round-breakdown" className="hidden mt-4 max-h-60 overflow-y-auto bg-[#0a1628]/80 rounded-xl border border-cyan-800/30 p-3">
            <div className="space-y-3">
              {roundScores.map((rs) => (
                <div key={rs.roundNumber} className="space-y-1">
                  <h4 className="text-yellow-400/80 text-xs font-semibold">
                    Round {rs.roundNumber}
                  </h4>
                  <div className="grid grid-cols-[1fr_50px_50px_60px] gap-1 text-[10px] text-cyan-300/70">
                    <span>Player</span>
                    <span className="text-center">Bid</span>
                    <span className="text-center">Won</span>
                    <span className="text-right">Pts</span>
                  </div>
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className="grid grid-cols-[1fr_50px_50px_60px] gap-1 text-xs text-cyan-200"
                    >
                      <span className="truncate">
                        {p.avatar} {p.name}
                      </span>
                      <span className="text-center">{rs.bids[p.id]}</span>
                      <span className="text-center">{rs.tricksWon[p.id]}</span>
                      <span
                        className={`text-right font-medium ${
                          (rs.scores[p.id] ?? 0) >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {rs.scores[p.id] > 0 ? '+' : ''}
                        {rs.scores[p.id]}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <Button
            onClick={resetGame}
            className="flex-1 bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold py-5 shadow-lg border border-cyan-500/30"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
