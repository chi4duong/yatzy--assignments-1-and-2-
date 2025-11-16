// server/app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { YatzyGame } from "./yatzyGame.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Parse JSON bodies
app.use(express.json());

// ----- Static front-end (client) -----
const clientDir = path.join(__dirname, "..", "client");
app.use(express.static(clientDir));

// Serve your yatzy.html at the root
app.get("/", (req, res) => {
  res.sendFile(path.join(clientDir, "yatzy.html"));
});

// ----- Single-player Yatzy game instance -----
let game = new YatzyGame({ numPlayers: 1, numRounds: 13, rollsPerTurn: 3 });

function buildState() {
  const player = game.currentPlayer;
  const engine = player.engine;

  const table = {};
  engine.scoreTable.forEach((v, k) => {
    table[k] = { used: v.used, score: v.score };
  });

  return {
    currentRound: game.currentRound,
    numRounds: game.numRounds,
    rollsThisTurn: game.dice.rollsThisTurn,
    rollsPerTurn: game.rollsPerTurn,
    isGameOver: game.isGameOver,
    currentPlayer: {
      name: player.name,
      total: player.totalScore(),
    },
    dice: {
      values: game.dice.values(),
      held: game.dice.dice.map(d => d.held),
    },
    scores: {
      table,
      upperSubtotal: engine.upperSubtotal(),
      upperBonus: engine.upperBonus(),
      lowerSubtotal: engine.lowerSubtotal(),
      total: engine.total(),
    },
    winner: game.isGameOver ? game.winner : null,
  };
}

// ----- API endpoints -----

// Get current game state
app.get("/api/state", (req, res) => {
  res.json(buildState());
});

// Start a new game
app.post("/api/game/new", (req, res) => {
  game.startNewGame();
  res.json(buildState());
});

// Roll dice
app.post("/api/dice/roll", (req, res) => {
  game.roll();
  res.json(buildState());
});

// Toggle hold on a die by index
app.post("/api/dice/hold/:index", (req, res) => {
  const i = Number(req.params.index);
  const die = game.dice.dice[i];
  if (Number.isInteger(i) && die) {
    die.toggleHold();
  }
  res.json(buildState());
});

// Clear all holds (but keep roll count)
app.post("/api/dice/clear-holds", (req, res) => {
  game.dice.dice.forEach(d => (d.held = false));
  res.json(buildState());
});

// Score a category and end the turn
app.post("/api/score", (req, res) => {
  const { category } = req.body || {};
  if (!category) {
    return res.status(400).json({ error: "category is required" });
  }

  const points = game.scoreSelection(category);
  game.endTurn();

  const state = buildState();
  state.lastScore = { category, points };

  res.json(state);
});

// ----- Start server -----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Yatzy server listening at http://localhost:${PORT}`);
});
