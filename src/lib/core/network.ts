import Peer, { DataConnection } from 'peerjs';
import { GameState, Suit, Player } from './types';

/* ─── Network message types ─── */
export type NetMsg =
  | { type: 'join'; peerId: string; playerName: string }
  | { type: 'lobby'; players: LobbyPlayer[]; hostId: string; roomId: string }
  | { type: 'startGame'; settings: { playerCount: number; difficulty: string } }
  | { type: 'state'; state: GameState; myId: string }
  | { type: 'bid'; peerId: string; bid: number }
  | { type: 'play'; peerId: string; cardId: string }
  | { type: 'trump'; peerId: string; suit: Suit }
  | { type: 'playerJoined'; player: LobbyPlayer }
  | { type: 'playerLeft'; peerId: string }
  | { type: 'error'; message: string }
  | { type: 'nameChange'; peerId: string; name: string };

export interface LobbyPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

type Callbacks = {
  onState: (state: GameState, myId: string) => void;
  onLobby: (players: LobbyPlayer[], hostId: string, roomId: string) => void;
  onGameStart: () => void;
  onError: (msg: string) => void;
  onPlayerLeft: (peerId: string) => void;
  onDisconnected: () => void;
};

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 5; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

const AVATARS = ['🧜', '🐙', '🦈', '🐋', '🦑', '🐠'];

export class GameNetwork {
  private peer: Peer | null = null;
  private connections = new Map<string, DataConnection>();
  private role: 'host' | 'client' | null = null;
  private roomId = '';
  private callbacks: Callbacks;
  private lobbyPlayers: LobbyPlayer[] = [];
  private myName = '';
  private myId = '';
  private cleanups: (() => void)[] = [];

  constructor(callbacks: Callbacks) {
    this.callbacks = callbacks;
  }

  getMyId() { return this.myId; }
  getRole() { return this.role; }
  getRoomId() { return this.roomId; }
  getLobbyPlayers() { return this.lobbyPlayers; }
  isConnected() { return this.peer && !this.peer.disconnected; }

  /* ══════════════════════════════════════════════
     HOST
     ══════════════════════════════════════════════ */
  async host(name: string): Promise<string> {
    this.myName = name;
    this.role = 'host';
    this.roomId = generateRoomId();
    this.myId = `oracle-${this.roomId}`;

    return new Promise((resolve, reject) => {
      this.peer = new Peer(this.myId, {
        debug: 0,
      });

      this.peer.on('open', () => {
        // Add host to lobby
        this.lobbyPlayers = [{
          id: this.myId,
          name,
          avatar: '👑',
          isHost: true,
        }];
        this.broadcastLobby();
        resolve(this.roomId);
      });

      this.peer.on('connection', (conn) => {
        this.addConnection(conn);
      });

      this.peer.on('error', (err) => {
        // If ID taken, regenerate
        if (err.type === 'unavailable-id') {
          this.roomId = generateRoomId();
          this.myId = `oracle-${this.roomId}`;
          this.peer?.destroy();
          this.host(name).then(resolve).catch(reject);
        } else {
          this.callbacks.onError(`Connection error: ${err.message}`);
        }
      });

      this.peer.on('disconnected', () => {
        this.callbacks.onDisconnected();
      });
    });
  }

  /* ══════════════════════════════════════════════
     CLIENT
     ══════════════════════════════════════════════ */
  async join(roomId: string, name: string): Promise<void> {
    this.myName = name;
    this.role = 'client';
    this.roomId = roomId;

    return new Promise((resolve, reject) => {
      const tempId = `oracle-player-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      this.peer = new Peer(tempId, { debug: 0 });

      this.peer.on('open', () => {
        this.myId = this.peer!.id;
        const hostId = `oracle-${roomId}`;
        const conn = this.peer!.connect(hostId, { reliable: true });

        conn.on('open', () => {
          this.addConnection(conn);
          conn.send({ type: 'join', peerId: this.myId, playerName: name });
          resolve();
        });

        conn.on('error', (err) => {
          this.callbacks.onError(`Failed to connect: ${err.message}`);
          reject(err);
        });

        // Timeout
        setTimeout(() => {
          if (conn.open) return;
          this.callbacks.onError('Connection timed out. Check the room code.');
          reject(new Error('timeout'));
        }, 10000);
      });

      this.peer.on('error', (err) => {
        this.callbacks.onError(`Connection error: ${err.message}`);
        reject(err);
      });
    });
  }

  /* ══════════════════════════════════════════════
     MESSAGING
     ══════════════════════════════════════════════ */
  sendToHost(msg: NetMsg) {
    if (this.role !== 'client') return;
    for (const conn of this.connections.values()) {
      if (conn.open) conn.send(msg);
    }
  }

  broadcast(msg: NetMsg) {
    for (const conn of this.connections.values()) {
      if (conn.open) conn.send(msg);
    }
  }

  broadcastState(state: GameState) {
    // Send personalized state to each client (filter hand for that client)
    for (const [peerId, conn] of this.connections.entries()) {
      if (!conn.open) continue;
      conn.send({ type: 'state', state: this.filterStateForPlayer(state, peerId), myId: peerId });
    }
  }

  /* ══════════════════════════════════════════════
     CONNECTION MANAGEMENT
     ══════════════════════════════════════════════ */
  private addConnection(conn: DataConnection) {
    conn.on('open', () => {
      conn.on('data', (data) => this.handleMessage(conn, data as NetMsg));
      conn.on('close', () => this.handleDisconnect(conn.peer));
      conn.on('error', () => this.handleDisconnect(conn.peer));
    });
    this.connections.set(conn.peer, conn);
  }

  private handleDisconnect(peerId: string) {
    this.connections.delete(peerId);
    this.lobbyPlayers = this.lobbyPlayers.filter(p => p.id !== peerId);

    if (this.role === 'host') {
      this.broadcastLobby();
      this.broadcast({ type: 'playerLeft', peerId });
      this.callbacks.onPlayerLeft(peerId);
    } else {
      this.callbacks.onDisconnected();
    }
  }

  private handleMessage(conn: DataConnection, msg: NetMsg) {
    switch (msg.type) {
      case 'join': {
        if (this.role !== 'host') return;
        const avatar = AVATARS[this.lobbyPlayers.length % AVATARS.length];
        const player: LobbyPlayer = {
          id: msg.peerId,
          name: msg.playerName,
          avatar,
          isHost: false,
        };
        this.lobbyPlayers.push(player);
        this.broadcastLobby();
        this.broadcast({ type: 'playerJoined', player });
        break;
      }

      case 'lobby': {
        if (this.role !== 'client') return;
        this.lobbyPlayers = msg.players;
        this.callbacks.onLobby(msg.players, msg.hostId, msg.roomId);
        break;
      }

      case 'state': {
        if (this.role !== 'client') return;
        this.callbacks.onState(msg.state, msg.myId);
        break;
      }

      case 'startGame': {
        this.callbacks.onGameStart();
        break;
      }

      case 'bid':
      case 'play':
      case 'trump':
        // Host receives these from clients — handled by game store
        break;

      case 'playerJoined':
      case 'playerLeft':
        // Handled by lobby
        break;
    }
  }

  /* ══════════════════════════════════════════════
     HELPERS
     ══════════════════════════════════════════════ */
  private broadcastLobby() {
    if (this.role !== 'host') return;
    const msg: NetMsg = {
      type: 'lobby',
      players: this.lobbyPlayers,
      hostId: this.myId,
      roomId: this.roomId,
    };
    this.broadcast(msg);
    this.callbacks.onLobby(this.lobbyPlayers, this.myId, this.roomId);
  }

  private filterStateForPlayer(state: GameState, playerId: string): GameState {
    // Only show the player's own hand, hide everyone else's
    const filteredPlayers = state.players.map(p => {
      if (p.id === playerId) return p; // Full hand for this player
      return { ...p, hand: p.hand.map(() => ({
        id: `hidden-${p.id}`,
        type: 'realm' as const,
        display: '?',
      })) };
    });
    return { ...state, players: filteredPlayers };
  }

  /* ══════════════════════════════════════════════
     LINKS
     ══════════════════════════════════════════════ */
  getShareLink(): string {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
  }

  /* ══════════════════════════════════════════════
     CLEANUP
     ══════════════════════════════════════════════ */
  destroy() {
    for (const conn of this.connections.values()) {
      conn.close();
    }
    this.connections.clear();
    this.peer?.destroy();
    this.peer = null;
    this.role = null;
    this.lobbyPlayers = [];
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups = [];
  }
}
