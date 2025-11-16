// yatzyEngine.js
// Holds category lists, validates selections, and computes scores

export const CATEGORIES = {
  ONES: "Ones",
  TWOS: "Twos",
  THREES: "Threes",
  FOURS: "Fours",
  FIVES: "Fives",
  SIXES: "Sixes",
  THREE_KIND: "Three of a Kind",
  FOUR_KIND: "Four of a Kind",
  FULL_HOUSE: "Full House",
  SMALL_STRAIGHT: "Small Straight",
  LARGE_STRAIGHT: "Large Straight",
  CHANCE: "Chance",
  YATZY: "Yatzy",
};

export const FIXED_SCORES = {
  [CATEGORIES.FULL_HOUSE]: 25,
  [CATEGORIES.SMALL_STRAIGHT]: 30,
  [CATEGORIES.LARGE_STRAIGHT]: 40,
  [CATEGORIES.YATZY]: 50,
};

// Module helpers
function countsByFace(diceValues) {
  const counts = new Map();
  diceValues.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  return counts;
}
function sum(values) { return values.reduce((a, b) => a + b, 0); }

export class YatzyEngine {
  constructor() {
    // Score table tracks whether a category is used and the assigned score
    this.scoreTable = new Map(
      Object.values(CATEGORIES).map(cat => [cat, { used: false, score: 0 }])
    );
    this.upperBonusAwarded = false; // computed when upper subtotal ≥ 63
  }

  // Validates a selection
  isValidSelection(category, diceValues) {
    if (!this._isKnownCategory(category)) return false;
    const entry = this.scoreTable.get(category);
    if (entry?.used) return false;          // cannot reuse a category
    if (!Array.isArray(diceValues) || diceValues.length === 0) return false;
    return true;                             // valid for Lab 6 skeleton
  }

  // Returns score for a category (skeleton implementations are fine)
  calculateScore(category, diceValues) {
    if (!this._isKnownCategory(category)) return 0;
    const vals = diceValues ?? [];

    switch (category) {
      // Upper section
      case CATEGORIES.ONES:   return vals.filter(v => v === 1).length * 1;
      case CATEGORIES.TWOS:   return vals.filter(v => v === 2).length * 2;
      case CATEGORIES.THREES: return vals.filter(v => v === 3).length * 3;
      case CATEGORIES.FOURS:  return vals.filter(v => v === 4).length * 4;
      case CATEGORIES.FIVES:  return vals.filter(v => v === 5).length * 5;
      case CATEGORIES.SIXES:  return vals.filter(v => v === 6).length * 6;

      // Chance
      case CATEGORIES.CHANCE: return sum(vals);

      // Fixed-value categories (no strict verification for Lab 6)
      case CATEGORIES.FULL_HOUSE:
      case CATEGORIES.SMALL_STRAIGHT:
      case CATEGORIES.LARGE_STRAIGHT:
      case CATEGORIES.YATZY:
        return FIXED_SCORES[category];

      // Simple placeholders for 3/4-kind
      case CATEGORIES.THREE_KIND:
      case CATEGORIES.FOUR_KIND: {
        const counts = countsByFace(vals);
        const need = category === CATEGORIES.THREE_KIND ? 3 : 4;
        const ok = Array.from(counts.values()).some(c => c >= need);
        return ok ? sum(vals) : 0;
      }

      default:
        return 0;
    }
  }

  // Apply a score and mark category used
  assignScore(category, diceValues) {
    if (!this.isValidSelection(category, diceValues)) return 0;
    const score = this.calculateScore(category, diceValues);
    const entry = this.scoreTable.get(category);
    if (entry) {
      entry.used = true;
      entry.score = score;
    }
    this._updateUpperBonusIfNeeded();
    return score;
  }

  // Totals
  upperSubtotal() {
    const upper = [
      CATEGORIES.ONES, CATEGORIES.TWOS, CATEGORIES.THREES,
      CATEGORIES.FOURS, CATEGORIES.FIVES, CATEGORIES.SIXES,
    ];
    return upper.reduce((acc, cat) => acc + (this.scoreTable.get(cat)?.score ?? 0), 0);
  }

  upperBonus() { return this.upperBonusAwarded ? 35 : 0; }

  lowerSubtotal() {
    const lower = Object.values(CATEGORIES).filter(c =>
      ![CATEGORIES.ONES, CATEGORIES.TWOS, CATEGORIES.THREES,
        CATEGORIES.FOURS, CATEGORIES.FIVES, CATEGORIES.SIXES].includes(c)
    );
    return lower.reduce((acc, cat) => acc + (this.scoreTable.get(cat)?.score ?? 0), 0);
  }

  total() { return this.upperSubtotal() + this.upperBonus() + this.lowerSubtotal(); }

  resetScores() {
    this.scoreTable.forEach(v => { v.used = false; v.score = 0; });
    this.upperBonusAwarded = false;
  }

  // “Private” helpers (underscore style)
  _updateUpperBonusIfNeeded() {
    if (!this.upperBonusAwarded && this.upperSubtotal() >= 63) {
      this.upperBonusAwarded = true;
    }
  }
  _isKnownCategory(cat) { return Object.values(CATEGORIES).includes(cat); }
}

export default YatzyEngine;
