'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Copy,
  Check,
  Loader2,
  Wifi,
  WifiOff,
  Users,
  Crown,
  Swords,
  ArrowLeft,
  Waves,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { GameNetwork, LobbyPlayer } from '@/lib/core/network';
import { useGameStore, GameMode } from '@/lib/core/game-store';
import { GameSettings } from '@/lib/core/types';
import { RulesDialog } from './RulesDialog';

interface LobbyScreenProps {
  mode: 'host' | 'join';
  onBack: () => void;
}

export function LobbyScreen({ mode, onBack }: LobbyScreenProps) {
  const { setNetwork, startMultiplayerGame, receiveNetMsg } = useGameStore();

  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerCount, setPlayerCount] = useState(4);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [strictFollow, setStrictFollow] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showRules, setShowRules] = useState(false);

  // Generate particle positions once on the client to avoid SSR/client hydration mismatch
  const [particles, setParticles] = useState<{ left: number; top: number; duration: number; delay: number }[]>([]);
  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: 3 + Math.random() * 4,
        delay: Math.random() * 3,
      }))
    );
  }, []);

  const netRef = useRef<GameNetwork | null>(null);

  const cleanup = useCallback(() => {
    netRef.current?.destroy();
    netRef.current = null;
    setNetwork(null);
  }, [setNetwork]);

  // Parse room code from URL on join
  useEffect(() => {
    if (mode === 'join') {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room');
      if (urlRoom) setRoomCode(urlRoom.toUpperCase());
    }
  }, [mode]);

  /* ─── Host ─── */
  const handleHost = async () => {
    if (!playerName.trim()) return;
    setStatus('connecting');
    setErrorMsg('');

    const net = new GameNetwork({
      onState: () => {},
      onLobby: (players) => setLobbyPlayers(players),
      onGameStart: () => {},
      onError: (msg) => { setErrorMsg(msg); setStatus('error'); },
      onPlayerLeft: () => {},
      onDisconnected: () => { setStatus('error'); setErrorMsg('Disconnected from server'); },
      onMessage: (msg) => useGameStore.getState().receiveNetMsg(msg),
    });

    netRef.current = net;
    setNetwork(net);

    try {
      const roomId = await net.host(playerName.trim());
      setShareLink(net.getShareLink());
      setStatus('connected');
    } catch {
      setStatus('error');
    }
  };

  /* ─── Join ─── */
  const handleJoin = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    setStatus('connecting');
    setErrorMsg('');

    const net = new GameNetwork({
      onState: (state, myId) => {
        useGameStore.getState().syncClientState(state, myId);
      },
      onLobby: (players) => setLobbyPlayers(players),
      onGameStart: () => {},
      onError: (msg) => { setErrorMsg(msg); setStatus('error'); },
      onPlayerLeft: () => {},
      onDisconnected: () => { setStatus('error'); setErrorMsg('Disconnected from host'); },
    });

    netRef.current = net;
    setNetwork(net);

    try {
      await net.join(roomCode.trim().toUpperCase(), playerName.trim());
      setStatus('connected');
    } catch {
      setStatus('error');
    }
  };

  /* ─── Start Game ─── */
  const handleStartGame = () => {
    if (!netRef.current) return;

    const remotePeers = lobbyPlayers
      .filter(p => !p.isHost)
      .map(p => ({ id: p.id, name: p.name, avatar: p.avatar }));

    startMultiplayerGame(
      { playerCount, difficulty, strictFollow },
      remotePeers,
    );
  };

  /* ─── Copy link ─── */
  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    return () => { cleanup(); };
  }, [cleanup]);

  const isHost = mode === 'host';
  const connectedCount = lobbyPlayers.length;
  const canStart = isHost && connectedCount >= 2 && connectedCount <= 6;
  const isWaitingForHost = !isHost && status === 'connected';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full"
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
          />
        ))}
      </div>

      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          onClick={() => { cleanup(); onBack(); }}
          className="text-cyan-300 hover:text-cyan-100 hover:bg-[#0c1e3a]/40"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      {/* Title */}
      <motion.div
        className="text-center mb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Waves className="w-5 h-5 text-yellow-400" />
          <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400">
            {isHost ? 'Host Game' : 'Join Game'}
          </h2>
          <Waves className="w-5 h-5 text-yellow-400" />
        </div>
        <p className="text-cyan-300/60 text-xs sm:text-sm">
          {isHost ? 'Create a room and invite your friends' : 'Enter a room code to join'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md z-10"
      >
        <Card className="bg-[#0c1e3a]/70 border-cyan-800/40 backdrop-blur-sm">
          <CardContent className="p-6 space-y-5">
            {/* Name input */}
            <div className="space-y-1.5">
              <label className="text-cyan-200 text-sm font-medium">Your Name</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={16}
                className="bg-[#0c1e3a]/80 border-cyan-700/50 text-cyan-100 placeholder:text-cyan-500/50"
                disabled={status === 'connecting' || status === 'connected'}
              />
            </div>

            {/* Room code (join only) */}
            {mode === 'join' && (
              <div className="space-y-1.5">
                <label className="text-cyan-200 text-sm font-medium flex items-center gap-2">
                  <Wifi className="w-4 h-4" /> Room Code
                </label>
                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE"
                  maxLength={5}
                  className="bg-[#0c1e3a]/80 border-cyan-700/50 text-cyan-100 placeholder:text-cyan-500/50 text-center text-xl tracking-[0.3em] font-bold uppercase"
                  disabled={status === 'connecting' || status === 'connected'}
                />
              </div>
            )}

            {/* Connect / Create button */}
            {status === 'idle' || status === 'error' ? (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={isHost ? handleHost : handleJoin}
                  disabled={!playerName.trim() || (mode === 'join' && !roomCode.trim())}
                  className="w-full bg-gradient-to-r from-cyan-700 to-cyan-600 hover:from-cyan-600 hover:to-cyan-500 text-white font-bold py-5 border border-cyan-500/30"
                >
                  {isHost ? (
                    <> <Wifi className="w-4 h-4 mr-2" /> Create Room </>
                  ) : (
                    <> <Wifi className="w-4 h-4 mr-2" /> Connect </>
                  )}
                </Button>
              </motion.div>
            ) : status === 'connecting' ? (
              <div className="flex items-center justify-center gap-2 text-cyan-300 py-5">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{isHost ? 'Creating room...' : 'Connecting...'}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-green-400 py-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            )}

            {/* Error message */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 border border-red-800/30 rounded-lg px-3 py-2">
                    <WifiOff className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Host: Room info + share */}
            {isHost && status === 'connected' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-[#0c1e3a]/60 rounded-lg px-4 py-3 border border-cyan-700/30">
                  <span className="text-cyan-300 text-sm">Room Code:</span>
                  <span className="text-yellow-400 font-mono text-2xl tracking-[0.3em] font-bold flex-1 text-center">
                    {netRef.current?.getRoomId() ?? ''}
                  </span>
                </div>

                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="w-full border-cyan-700/50 text-cyan-200 hover:bg-[#0c1e3a]/50 hover:text-cyan-100"
                >
                  {copied ? (
                    <><Check className="w-4 h-4 mr-2" /> Link Copied!</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> Copy Invite Link</>
                  )}
                </Button>

                {/* Host settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-cyan-200 text-xs font-medium flex items-center gap-1">
                      <Swords className="w-3 h-3" /> Players
                    </label>
                    <Select
                      value={playerCount.toString()}
                      onValueChange={(v) => setPlayerCount(Number(v))}
                      disabled={connectedCount > playerCount}
                    >
                      <SelectTrigger className="bg-[#0c1e3a]/80 border-cyan-700/50 text-cyan-100 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a1628] border-cyan-700/50">
                        {[3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={n.toString()} className="text-cyan-100">
                            {n} Players
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-cyan-200 text-xs font-medium flex items-center gap-1">
                      <Crown className="w-3 h-3" /> AI Level
                    </label>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as 'easy' | 'medium' | 'hard')}>
                      <SelectTrigger className="bg-[#0c1e3a]/80 border-cyan-700/50 text-cyan-100 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a1628] border-cyan-700/50">
                        <SelectItem value="easy" className="text-cyan-100">Easy</SelectItem>
                        <SelectItem value="medium" className="text-cyan-100">Medium</SelectItem>
                        <SelectItem value="hard" className="text-cyan-100">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3 rounded-lg bg-[#0c1e3a]/50 border border-cyan-800/30 p-3">
                  <div className="space-y-0.5">
                    <p className="text-cyan-200 text-xs font-medium">Strict Follow-Suit</p>
                    <p className="text-cyan-400/60 text-[10px] leading-snug">
                      Tridents &amp; Octo-Friends blocked when you hold the led suit.
                    </p>
                  </div>
                  <Switch
                    checked={strictFollow}
                    onCheckedChange={setStrictFollow}
                    className="shrink-0 mt-0.5"
                  />
                </div>
              </div>
            )}

            {/* Player lobby */}
            {status === 'connected' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-cyan-200 text-sm font-medium flex items-center gap-1">
                    <Users className="w-4 h-4" /> Players ({connectedCount}/{playerCount})
                  </label>
                  {isHost && connectedCount < playerCount && (
                    <span className="text-cyan-400/60 text-xs">Waiting for players...</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {lobbyPlayers.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0c1e3a]/50 border border-cyan-800/20"
                    >
                      <span className="text-xl">{p.avatar}</span>
                      <span className="text-cyan-100 text-sm font-medium flex-1">
                        {p.name}
                      </span>
                      {p.isHost && (
                        <Badge className="bg-yellow-600/50 text-yellow-200 text-[10px] px-1.5">
                          Host
                        </Badge>
                      )}
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                    </motion.div>
                  ))}

                  {/* Empty slots */}
                  {Array.from({ length: playerCount - connectedCount }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg border border-dashed border-cyan-800/30 opacity-40"
                    >
                      <span className="text-xl text-cyan-600">?</span>
                      <span className="text-cyan-500 text-sm">
                        {isHost ? 'Waiting...' : 'Empty slot'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start game button (host only) */}
            {isHost && canStart && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleStartGame}
                  className="w-full bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-white font-bold py-5 text-lg shadow-lg shadow-yellow-900/30 border border-yellow-400/30"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Game
                </Button>
              </motion.div>
            )}

            {/* Waiting for host (client) */}
            {isWaitingForHost && (
              <div className="flex items-center justify-center gap-2 text-cyan-300 text-sm py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Waiting for host to start the game...</span>
              </div>
            )}

            {/* How to play */}
            <Button
              variant="ghost"
              onClick={() => setShowRules(true)}
              className="w-full text-cyan-300 hover:text-cyan-100 hover:bg-[#0c1e3a]/40 text-sm"
            >
              How to Play
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <RulesDialog open={showRules} onOpenChange={setShowRules} />
    </div>
  );
}
