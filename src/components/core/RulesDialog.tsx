'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface RulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RulesDialog({ open, onOpenChange }: RulesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a1628]/95 border-cyan-800/50 text-cyan-100 max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-yellow-400 font-bold text-center">
            🔱 How to Play Deep Oracle 🔱
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-5 text-sm text-cyan-200/90">
            <section>
              <h3 className="text-base font-semibold text-yellow-300 mb-2">
                🃏 The Deck
              </h3>
              <p>
                60 cards total: 52 realm cards in 4 suits (The Reef🪸, The Trench⚓,
                The Surface🌊, The Kelp Forest🌿) with values 1-13, plus 4 Trident
                cards and 4 Octo-Friend cards.
              </p>
            </section>

            <Separator className="bg-cyan-800/30" />

            <section>
              <h3 className="text-base font-semibold text-yellow-300 mb-2">
                🎯 The Goal
              </h3>
              <p>
                Predict exactly how many tricks you&apos;ll win each round. Score
                points for accurate predictions, lose points for misses.
              </p>
            </section>

            <Separator className="bg-cyan-800/30" />

            <section>
              <h3 className="text-base font-semibold text-yellow-300 mb-2">
                🔄 Rounds
              </h3>
              <p>
                Round 1: 1 card each, Round 2: 2 cards each, and so on until all
                60 cards are dealt. With 4 players, there are 15 rounds.
              </p>
            </section>

            <Separator className="bg-cyan-800/30" />

            <section>
              <h3 className="text-base font-semibold text-yellow-300 mb-2">
                🏆 Trump Suit
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Realm card</strong> revealed → that suit becomes trump
                </li>
                <li>
                  <strong>Octo-Friend</strong> revealed → no trump this round
                </li>
                <li>
                  <strong>Trident</strong> revealed → the dealer chooses the trump
                  suit
                </li>
                <li>
                  <strong>Last round</strong> → no trump
                </li>
              </ul>
            </section>

            <Separator className="bg-cyan-800/30" />

            <section>
              <h3 className="text-base font-semibold text-yellow-300 mb-2">
                💰 Bidding
              </h3>
              <p>
                Starting left of the dealer, each player bids how many tricks they
                think they&apos;ll win (0 to N, where N = cards dealt). The total
                of all bids cannot equal the number of tricks available.
              </p>
            </section>

            <Separator className="bg-cyan-800/30" />

            <section>
              <h3 className="text-base font-semibold text-yellow-300 mb-2">
                ⚔️ Playing Tricks
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>You must follow the lead suit if possible</li>
                <li>Tridents and Octo-Friends can always be played</li>
                <li>
                  <strong>Lead Trident</strong> → anything goes, Trident wins
                </li>
                <li>
                  <strong>Lead Octo-Friend</strong> → null lead, next card sets the
                  suit
                </li>
              </ul>
            </section>

            <Separator className="bg-cyan-800/30" />

            <section>
              <h3 className="text-base font-semibold text-yellow-300 mb-2">
                📊 Trick Resolution
              </h3>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>First Trident played wins</li>
                <li>Else, highest trump card wins</li>
                <li>Else, highest card of the lead suit wins</li>
                <li>If all Octo-Friends → first Octo-Friend played wins</li>
              </ol>
            </section>

            <Separator className="bg-cyan-800/30" />

            <section>
              <h3 className="text-base font-semibold text-yellow-300 mb-2">
                🏅 Scoring
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Exact bid</strong>: 20 points + 10 per trick won
                </li>
                <li>
                  <strong>Missed bid</strong>: -10 points for each trick over or
                  under
                </li>
              </ul>
              <div className="mt-2 p-2 bg-[#0c1e3a]/50 rounded text-xs">
                Example: Bid 2, win 2 → +40 pts | Bid 2, win 3 → -10 pts
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
