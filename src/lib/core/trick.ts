import { Card, Suit, Trick } from './types';

export function getLeadSuit(trick: Trick): Suit | null {
  if (trick.plays.length === 0) return null;

  const leadCard = trick.plays[0].card;

  if (leadCard.type === 'octo-friend') {
    // Find the first non-octo-friend card to determine lead suit
    for (const play of trick.plays) {
      if (play.card.type === 'realm') {
        return play.card.suit ?? null;
      }
    }
    return null; // All octo-friends
  }

  if (leadCard.type === 'trident') {
    // Trident lead: first real (non-Trident, non-Octo-Friend) card determines lead suit
    for (const play of trick.plays) {
      if (play.card.type === 'realm') {
        return play.card.suit ?? null;
      }
    }
    return null; // All Tridents/Octo-Friends
  }

  return leadCard.suit ?? null;
}

export function mustFollowSuit(trick: Trick, hand: Card[]): boolean {
  const leadSuit = getLeadSuit(trick);
  if (!leadSuit) return false; // No lead suit (trident/octo-friend lead)

  return hand.some((card) => card.type === 'realm' && card.suit === leadSuit);
}

export function isValidPlay(card: Card, trick: Trick, hand: Card[], strictFollow = false): boolean {
  if (trick.plays.length === 0) return true; // Lead can play anything

  const leadSuit = getLeadSuit(trick);
  const hasLeadSuit = !!leadSuit && hand.some((c) => c.type === 'realm' && c.suit === leadSuit);

  // Tridents and Octo-Friends are normally free; blocked by strictFollow when player holds the led suit
  if (card.type === 'trident' || card.type === 'octo-friend') {
    if (strictFollow && hasLeadSuit) return false;
    return true;
  }

  // No lead suit restriction
  if (!leadSuit) return true;

  if (hasLeadSuit) {
    return card.type === 'realm' && card.suit === leadSuit;
  }

  return true; // Can play anything if don't have lead suit
}

export function getValidCards(hand: Card[], trick: Trick, strictFollow = false): Card[] {
  if (trick.plays.length === 0) return hand;
  return hand.filter((card) => isValidPlay(card, trick, hand, strictFollow));
}

export function determineTrickWinner(trick: Trick, trumpSuit: Suit | null): string {
  // Filter out any plays with undefined cards (defensive guard against corrupt state)
  const plays = trick.plays.filter((p) => p.card != null);

  if (plays.length === 0) {
    return trick.leadPlayerId;
  }

  // Check for trident
  const tridentPlay = plays.find((p) => p.card.type === 'trident');
  if (tridentPlay) {
    return tridentPlay.playerId;
  }

  // Check if all octo-friends
  const allOctoFriends = plays.every((p) => p.card.type === 'octo-friend');
  if (allOctoFriends) {
    return plays[0].playerId; // First octo-friend wins
  }

  const leadSuit = getLeadSuit(trick);

  // Check for trump wins
  if (trumpSuit) {
    const trumpPlays = plays.filter(
      (p) => p.card.type === 'realm' && p.card.suit === trumpSuit
    );
    if (trumpPlays.length > 0) {
      const highestTrump = trumpPlays.reduce((best, play) =>
        (play.card.value ?? 0) > (best.card.value ?? 0) ? play : best
      );
      return highestTrump.playerId;
    }
  }

  // Lead suit wins
  if (leadSuit) {
    const leadPlays = plays.filter(
      (p) => p.card.type === 'realm' && p.card.suit === leadSuit
    );
    if (leadPlays.length > 0) {
      const highestLead = leadPlays.reduce((best, play) =>
        (play.card.value ?? 0) > (best.card.value ?? 0) ? play : best
      );
      return highestLead.playerId;
    }
  }

  // Fallback: first non-octo-friend play wins
  const nonOctoFriend = plays.find((p) => p.card.type === 'realm');
  if (nonOctoFriend) return nonOctoFriend.playerId;

  // All octo-friends: first one wins
  return plays[0].playerId;
}
