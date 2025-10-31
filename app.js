// app.js 
import YatzyGame from "./yatzyGame.js";
import { CATEGORIES } from "./yatzyEngine.js";

const game = new YatzyGame({ numPlayers: 1, numRounds: 13, rollsPerTurn: 3 });

// --- DOM references 
const diceEls  = Array.from(document.querySelectorAll(".dice-tray .die"));
const rollBtn  = document.querySelector(".controls .btn--primary");
const resetBtn = document.querySelector(".controls .btn--ghost");   
const scoreBtn = document.querySelector(".controls .btn--accent");

// Score rows
const rows     = Array.from(document.querySelectorAll(".scorecard tbody tr"));
const rowByCat = new Map();
rows.forEach(tr => {
  const cat = tr.children?.[0]?.textContent?.trim();
  if (cat) rowByCat.set(cat, tr);
});
const NON_SELECTABLE = new Set(["Upper Bonus", "Total"]);

// Enable buttons that mockup disabled
[rollBtn, resetBtn, scoreBtn].forEach(b => {
  if (!b) return;
  b.removeAttribute("disabled");
  b.removeAttribute("aria-disabled");
  b.style.cursor = "pointer";
});

if (resetBtn) resetBtn.textContent = "Clear Holds";

// Add a status line inside the controls (shows round/rolls/messages)
const controls = document.querySelector(".controls");
const statusEl = document.createElement("div");
statusEl.className = "hint";
controls?.appendChild(statusEl);

// --- Helpers
function setDieFace(el, value) {
  [...el.classList].forEach(c => { if (c.startsWith("face-")) el.classList.remove(c); });
  el.classList.add(`face-${value}`);
}

function refreshDice() {
  const values = game.diceValues;
  const held   = game.dice.heldFlags ? game.dice.heldFlags() : game.dice.dice.map(d => d.held);
  diceEls.forEach((el, i) => {
    const v = values[i] ?? 1;
    setDieFace(el, v);
    el.setAttribute("aria-pressed", held[i] ? "true" : "false");
    const badge = el.querySelector(".hold-toggle");
    if (badge) badge.textContent = held[i] ? "Held" : "Hold";
    el.setAttribute("aria-label", `Die showing ${v}${held[i] ? " (held)" : ""}`);
  });
}

function updateComputedCells() {
  // Upper Bonus
  const bonusRow = rowByCat.get("Upper Bonus");
  if (bonusRow) bonusRow.querySelector(".pts").textContent = String(game.currentPlayer.engine.upperBonus());
  // Total
  const totalRow = rowByCat.get("Total");
  if (totalRow) totalRow.querySelector(".pts").textContent = String(game.currentPlayer.engine.total());
}

function refreshScorecardFull() {
  const eng = game.currentPlayer.engine;
  Object.values(CATEGORIES).forEach(cat => {
    const tr = rowByCat.get(cat);
    if (!tr) return;
    const { used, score } = eng.scoreTable.get(cat);
    const cell = tr.querySelector(".pts");
    if (cell) cell.textContent = used ? String(score) : "—";
    tr.classList.toggle("used", used);
    tr.style.opacity = used ? "0.7" : "1";
    tr.style.pointerEvents = used ? "none" : "auto";
    tr.style.cursor = used ? "default" : "pointer";
  });
  updateComputedCells();
}

function updateRollButtonState() {
  const atLimit = game.dice.rollsThisTurn >= game.rollsPerTurn;
  rollBtn.disabled = atLimit;
  if (atLimit) rollBtn.setAttribute("aria-disabled", "true");
  else rollBtn.removeAttribute("aria-disabled");
}

function updateStatus(message = "") {
  const round = Math.min(game.currentRound, game.numRounds);
  const rolls = game.dice.rollsThisTurn;
  statusEl.textContent = `Round ${round}/${game.numRounds} · Rolls ${rolls}/${game.rollsPerTurn}` + (message ? ` — ${message}` : "");
}

function maybeShowGameOver() {
  if (!game.isGameOver) return;
  const w = game.winner ?? { name: game.currentPlayer.name, total: game.currentPlayer.totalScore() };
  alert(`Game Over!\nWinner: ${w.name}\nFinal Score: ${w.total}`);
}

// --- Interactions

// Click a die to toggle hold (always allowed)
diceEls.forEach((el, i) => {
  el.style.cursor = "pointer";
  el.dataset.index = String(i);
  el.addEventListener("click", () => {
    const d = game.dice.dice[i];
    d.toggleHold();
    refreshDice();
    updateStatus();
  });
});

// Roll (max 3 times per turn)
rollBtn?.addEventListener("click", () => {
  game.roll();
  refreshDice();
  updateRollButtonState();
  const atLimit = game.dice.rollsThisTurn >= game.rollsPerTurn;
  updateStatus(atLimit ? "Select a category to score." : "Click dice to hold and roll again.");
});

// Clear Holds (does NOT reset rolls)
resetBtn?.addEventListener("click", () => {
  game.dice.dice.forEach(d => (d.held = false));
  refreshDice();
  updateStatus("Holds cleared.");
});

// Click a scorecard row to score that category
function onScoreRowClick(e) {
  const tr = e.currentTarget;
  const cat = tr.children?.[0]?.textContent?.trim();
  if (!cat || NON_SELECTABLE.has(cat)) return;

  // Apply score for current dice
  const pts = game.scoreSelection(cat);
  // Paint row used
  const ptsCell = tr.querySelector(".pts");
  if (ptsCell) ptsCell.textContent = String(pts);
  tr.classList.add("used");
  tr.style.opacity = "0.7";
  tr.style.pointerEvents = "none";

  // End turn and advance round
  game.endTurn();
  refreshScorecardFull();

  if (game.isGameOver) {
    maybeShowGameOver();
    updateStatus("Game complete.");
    return;
  }

  // Prepare next turn state
  game.dice.resetTurn?.();           // clears holds & rollsThisTurn if your DiceSet has it
  game.dice.rollsThisTurn = 0;       
  game.dice.dice.forEach(d => (d.held = false));

  refreshDice();
  updateRollButtonState();
  updateStatus("New turn: click Roll to start.");
}


Object.values(CATEGORIES).forEach(cat => {
  const tr = rowByCat.get(cat);
  if (!tr) return;
  tr.addEventListener("click", onScoreRowClick);
});


scoreBtn?.addEventListener("click", () => {
  const choices = Object.values(CATEGORIES);
  const cat = prompt(`Score which category?\n\n${choices.join("\n")}`);
  if (!cat) return;
  const tr = rowByCat.get(cat.trim());
  if (tr && !tr.classList.contains("used")) onScoreRowClick({ currentTarget: tr });
  else alert("That category is already used or invalid.");
});

// Boot
game.startNewGame();
refreshDice();
refreshScorecardFull();
updateRollButtonState();
updateStatus("Click Roll to start your turn.");
