'use client';

import { useGameStore } from '@/lib/core/game-store';
import { Badge } from '@/components/ui/badge';

export function Scoreboard() {
  const { players, round } = useGameStore();

  return (
    <div className="bg-[#0a1628]/80 border border-cyan-800/40 rounded-xl p-3 sm:p-4 backdrop-blur-sm">
      <h3 className="text-yellow-400 font-bold text-sm mb-3 flex items-center gap-2">
        📊 Scoreboard
      </h3>
      <div className="space-y-2">
        {/* Headers */}
        <div className="grid grid-cols-[1fr_40px_40px_50px] sm:grid-cols-[1fr_50px_50px_60px] gap-1 text-[10px] sm:text-xs text-cyan-400/70 font-medium">
          <span>Player</span>
          <span className="text-center">Bid</span>
          <span className="text-center">Won</span>
          <span className="text-right">Score</span>
        </div>

        {players.map((player) => {
          const isDealer = round?.dealerId === player.id;
          const isCurrentPlayer =
            round?.currentPlayerIndex === players.findIndex((p) => p.id === player.id);

          return (
            <div
              key={player.id}
              className={`grid grid-cols-[1fr_40px_40px_50px] sm:grid-cols-[1fr_50px_50px_60px] gap-1 items-center text-xs sm:text-sm rounded-lg px-2 py-1.5 transition-colors ${
                isCurrentPlayer
                  ? 'bg-[#0c1e3a]/50 border border-cyan-600/30'
                  : 'hover:bg-[#0c1e3a]/30'
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-base">{player.avatar}</span>
                <span className="truncate text-cyan-100 font-medium">
                  {player.name}
                </span>
                {isDealer && (
                  <Badge className="bg-yellow-600/80 text-[8px] px-1 py-0 h-4">
                    D
                  </Badge>
                )}
              </span>
              <span className="text-center text-cyan-300">
                {player.bid !== undefined ? player.bid : '-'}
              </span>
              <span className="text-center text-cyan-300">
                {player.tricksWon}
              </span>
              <span
                className={`text-right font-bold ${
                  player.score >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {player.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
