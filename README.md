# 🔱 Deep Oracle

**Predict the Tides. Rule the Depths.**

Deep Oracle is an ocean-themed trick-taking card game that blends strategy, prediction, and dynamic gameplay. Whether you're playing solo against AI opponents or competing with friends online, every round brings new challenges and opportunities to outmaneuver your rivals.

---

## 🎮 Game Overview

Deep Oracle is a **prediction-based trick-taking game** where players must:
1. **Bid** how many tricks they think they'll win
2. **Play cards strategically** to fulfill their prediction
3. **Score points** by matching their bid exactly

The deeper you dive into strategy, the more you'll master the depths of Deep Oracle.

### Core Mechanic: The Prediction Challenge

Every round, players bid on the number of tricks they believe they'll win. The twist? You earn points **only** if your tricks won match your bid exactly. Overbid and win too many tricks—lose points. Underbid and miss opportunities—also lose points. This creates intense, strategic decision-making throughout the game.

---

## 🌊 Game Features

### Card Types
- **Realm Cards**: Standard numbered cards (1–13) in four ocean-themed suits
  - 🪸 **Reef** (coral red) — Represents the vibrant reef ecosystems
  - 🌊 **Trench** (deep teal) — The mysterious depths
  - ☀️ **Surface** (golden yellow) — The sunlit waters above
  - 🌿 **Kelp** (seafoam green) — The swaying kelp forests

- **Trident** 🔱 (Joker Card): Always wins tricks. Unbeatable—deploy strategically.
- **Octo-Friend** 🐙 (Blank Card): Always loses tricks. Use to dump cards without winning.

### Game Modes

#### Single Player
- Play against AI opponents at three difficulty levels:
  - **Easy**: Random, unpredictable AI play
  - **Medium**: Tactical bidding and card play
  - **Hard**: Aggressive strategy, perfect information usage
- Fully configurable: adjust player count and difficulty on the fly

#### Multiplayer (Online)
- Host a game and invite friends via peer-to-peer connection
- Join friend-hosted games with a room code
- Real-time synchronization with latency-resistant design
- Play with any mix of human and AI players

### Game Settings

- **Player Count**: 2–6 players (scales difficulty and round count)
- **Difficulty Levels**: Easy, Medium, Hard (for AI opponents)
- **Strict Follow-Suit Rule** (Optional): 
  - When enabled, Trident and Octo-Friend cards cannot be played if you hold the led suit
  - Creates a harder variant where strategic card retention matters more

### Dynamic Trump Mechanic

When the trump card is a **Trident** or **Octo-Friend** (not a traditional suit), a special mode activates:
- **Each trick**, the first **realm card** played in that trick sets the trump suit for that trick alone
- The trump suit resets after each trick
- This creates shifting alliances and prevents trump-hoarding strategies
- Trump is revealed **before bidding** begins, giving players full information

### Progressive Rounds

- Rounds scale by player count (typically 15 rounds total)
- Cards per player increase each round (Round 1: 1 card → Round 15: 13+ cards)
- Last round has no trump suit—pure suit competition

### Scoring System

**Basic Scoring**:
- Match your bid exactly: earn 10 + (tricks won) points
- Miss your bid: earn 0 points
- Example: Bid 3, win 3 tricks = 13 points. Bid 3, win 4 tricks = 0 points.

**Canadian Rule**:
- The last player to bid **cannot make a bid that causes the total of all bids to be a multiple of cards per player**
- Prevents coordinated gaming; ensures unpredictability
- Exception: Round 1 (single card) has no last-bidder restriction

---

## 🎯 How to Play

### Setup
1. Select **Singleplayer** or **Multiplayer**
2. Configure player count (2–6) and difficulty
3. Optionally enable **Strict Follow-Suit** for added challenge

### Each Round

1. **Trump Reveal**: The trump card is revealed. All players see it before bidding begins.
2. **Dealing**: Cards are dealt to each player (Round 1: 1 card each, up to 13+ by final round).
3. **Bidding Phase**: Starting with the player after the dealer, each player bids how many tricks they expect to win.
   - Bids must be between 0 and the number of cards in hand
   - Last bidder respects the Canadian rule
4. **Playing Phase**: 
   - Tricks are played out one at a time
   - The player after the dealer leads the first trick (can play any card)
   - Follow-suit if you have it; otherwise play any card
   - Highest card of the led suit wins; trump beats all suit cards; Trident beats everything; Octo-Friend loses everything
5. **Trick Resolution**: Winner of each trick leads the next
6. **Round Scoring**: Points awarded based on bid accuracy

### Winning

The player with the highest total score after all rounds wins. Consistency beats luck—master the prediction game.

---

## 🛠 Installation & Setup

### Prerequisites
- **Node.js** 18+ and **pnpm** package manager

### Clone & Install
```bash
git clone <repository>
cd DeepOracle
pnpm install
```

### Run Development Server
```bash
pnpm dev
```
Opens at `http://localhost:3000`

### Build for Production
```bash
pnpm build
pnpm start
```

---

## 🎨 Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion (animations)
- **State Management**: Zustand
- **Multiplayer**: PeerJS (peer-to-peer networking)
- **UI Components**: Shadcn UI

---

## 🧠 Strategy Tips

- **Bidding**: Count your Tridents and high cards; consider the trump suit
- **Leading**: Lead high cards you don't expect to beat; force others to play big
- **Following**: Play low cards when you're losing; throw high cards when you're already beaten
- **Octo-Friends**: Don't waste them early—save them to dump unwanted cards late
- **Dynamic Trump**: When trump shifts each trick, pay attention to which suits have been exhausted

---

## 🤝 Contributing

Found a bug? Have a feature idea? Issues and pull requests are welcome!

---

## 📜 License

This project is provided as-is for personal and educational use.

---

## 🌊 Credits

**Deep Oracle** was crafted as a love letter to strategic card games and ocean aesthetics. Every wave, every depth, every card tells a story.

**Predict the Tides. Rule the Depths.** 🔱

