// yatzyGame.js
// Coordinates players, rounds, turn flow. Minimal wiring

import DiceSet from "./dice.js";
import YatzyEngine, { CATEGORIES } from "./yatzyEngine.js";

/**
 * Represents a single player's state.
 */

export class PlayerState {
    constructor (name = "Player 1"){
        this.name = name;
        this.engine = new YatzyEngine(); // each player has their own score table
    }

      totalScore() { return this.engine.total(); }

}

/**
 * YatzyGame manages overall game lifecycle and turn control.
 */
export class YatzyGame {
  /**
   * @param {object} opts
   * @param {number} [opts.numPlayers=1]
   * @param {number} [opts.numRounds=13] // standard: each category once
   * @param {number} [opts.numDice=5]
   * @param {number} [opts.rollsPerTurn=3]
   */
  constructor({ numPlayers = 1, numRounds = 13, numDice = 5, rollsPerTurn = 3 } = {}) {
    this.players = Array.from({ length: numPlayers }, (_, i) => new PlayerState(`Player ${i + 1}`));
    this.currentPlayerIndex = 0;
    this.currentRound = 1;
    this.numRounds = numRounds;

    this.dice = new DiceSet(numDice);
    this.rollsPerTurn = rollsPerTurn;

    this.isGameOver = false;
  }

  /** Initialize new game. */
  startNewGame() {
    this.players.forEach(p => p.engine.resetScores());
    this.currentPlayerIndex = 0;
    this.currentRound = 1;
    this.isGameOver = false;
    this.dice.resetTurn();
  }

  /** Roll dice if roll limit not exceeded. Returns dice values. */
  roll() {
    if (this.dice.rollsThisTurn >= this.rollsPerTurn) return this.dice.values();
    return this.dice.rollAll();
  }

  /** Assign the selected category for the current player. */
  scoreSelection(category) {
    const player = this.players[this.currentPlayerIndex];
    const values = this.dice.values();
    const pts = player.engine.assignScore(category, values);
    return pts;
  }

  /** Ends the current player's turn and advances player/round. */
  endTurn() {
    // Reset turn state for next player or next round
    this.dice.resetTurn();

    // Advance to next player
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

    // Completed a full table rotation?
    if (this.currentPlayerIndex === 0) {
      this.currentRound++;
      if (this.currentRound > this.numRounds) {
        this.endGame();
      }
    }
  }

  /** Finalize game and determine winner (returns winner info). */
  endGame() {
    this.isGameOver = true;
    const withScores = this.players.map(p => ({ name: p.name, total: p.totalScore() }));
    withScores.sort((a, b) => b.total - a.total);
    this.winner = withScores[0] ?? null;
    return this.winner;
  }

  /** Convenience getters */
  get currentPlayer() { return this.players[this.currentPlayerIndex]; }
  get diceValues() { return this.dice.values(); }
  get categories() { return Object.values(CATEGORIES); }
}

export default YatzyGame;