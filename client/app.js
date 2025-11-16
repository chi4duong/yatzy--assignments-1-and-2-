// client/app.js
// Client-only code: DOM + Fetch calls to the server

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

// Enable buttons
[rollBtn, resetBtn, scoreBtn].forEach(b => {
  if (!b) return;
  b.removeAttribute("disabled");
  b.removeAttribute("aria-disabled");
  b.style.cursor = "pointer";
});

if (resetBtn) resetBtn.textContent = "Clear Holds";

// Status element
const controls = document.querySelector(".controls");
const statusEl = document.createElement("div");
statusEl.className = "hint";
controls?.appendChild(statusEl);

// Client copy of server state
let state = null;

// ---- Fetch helper ----
async function api(url, options = {}) {
  const opts = { ...options };

  if (opts.body && typeof opts.body !== "string") {
    opts.body = JSON.stringify(opts.body);
    opts.headers = {
      ...(opts.headers || {}),
      "Content-Type": "application/json",
    };
  }

  const res = await fetch(url, opts);
  if (!res.ok) {
    const msg = await res.text();
    alert(`Server error ${res.status}: ${msg}`);
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

// ---- Render helpers ----
function setDieFace(el, value) {
  [...el.classList].forEach(c => { if (c.startsWith("face-")) el.classList.remove(c); });
  el.classList.add(`face-${value}`);
}

function refreshDice() {
  if (!state) return;
  const values = state.dice.values;
  const held   = state.dice.held;

  diceEls.forEach((el, i) => {
    const v = values[i] ?? 1;
    const isHeld = !!held[i];

    setDieFace(el, v);
    el.setAttribute("aria-pressed", isHeld ? "true" : "false");

    const badge = el.querySelector(".hold-toggle");
    if (badge) badge.textContent = isHeld ? "Held" : "Hold";

    el.setAttribute("aria-label", `Die showing ${v}${isHeld ? " (held)" : ""}`);
  });
}

function updateComputedCells() {
  if (!state) return;
  const bonusRow = rowByCat.get("Upper Bonus");
  if (bonusRow) bonusRow.querySelector(".pts").textContent = String(state.scores.upperBonus);

  const totalRow = rowByCat.get("Total");
  if (totalRow) totalRow.querySelector(".pts").textContent = String(state.scores.total);
}

function refreshScorecardFull() {
  if (!state) return;
  const table = state.scores.table;

  Object.entries(table).forEach(([cat, { used, score }]) => {
    const tr = rowByCat.get(cat);
    if (!tr) return;

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
  if (!state || !rollBtn) return;
  const atLimit = state.rollsThisTurn >= state.rollsPerTurn;
  rollBtn.disabled = atLimit;
  if (atLimit) rollBtn.setAttribute("aria-disabled", "true");
  else rollBtn.removeAttribute("aria-disabled");
}

function updateStatus(message = "") {
  if (!state) return;
  const round = Math.min(state.currentRound, state.numRounds);
  const rolls = state.rollsThisTurn;
  statusEl.textContent =
    `Round ${round}/${state.numRounds} · Rolls ${rolls}/${state.rollsPerTurn}` +
    (message ? ` — ${message}` : "");
}

function maybeShowGameOver() {
  if (!state || !state.isGameOver || !state.winner) return;
  alert(`Game Over!\nWinner: ${state.winner.name}\nFinal Score: ${state.winner.total}`);
}

function render(message = "") {
  refreshDice();
  refreshScorecardFull();
  updateRollButtonState();
  updateStatus(message);
  maybeShowGameOver();
}

// ---- Interactions ----

// Toggle hold by clicking a die
diceEls.forEach((el, i) => {
  el.style.cursor = "pointer";
  el.dataset.index = String(i);
  el.addEventListener("click", async () => {
    if (!state || state.isGameOver) return;
    state = await api(`/api/dice/hold/${i}`, { method: "POST" });
    render();
  });
});

// Roll dice
rollBtn?.addEventListener("click", async () => {
  if (!state || state.isGameOver) return;
  state = await api("/api/dice/roll", { method: "POST" });
  const atLimit = state.rollsThisTurn >= state.rollsPerTurn;
  render(atLimit ? "Select a category to score." : "Click dice to hold and roll again.");
});

// Clear holds
resetBtn?.addEventListener("click", async () => {
  if (!state || state.isGameOver) return;
  state = await api("/api/dice/clear-holds", { method: "POST" });
  render("Holds cleared.");
});

async function handleScoreCategory(cat) {
  if (!state || state.isGameOver) return;
  if (!cat || NON_SELECTABLE.has(cat)) return;

  const rowState = state.scores.table[cat];
  if (rowState?.used) return;

  state = await api("/api/score", {
    method: "POST",
    body: { category: cat },
  });

  const msg = state.isGameOver ? "Game complete." : "New turn: click Roll to start.";
  render(msg);
}

// Click on score rows
rows.forEach(tr => {
  const cat = tr.children?.[0]?.textContent?.trim();
  if (!cat || NON_SELECTABLE.has(cat)) return;
  tr.addEventListener("click", () => handleScoreCategory(cat));
});

// Score button: prompt for category
scoreBtn?.addEventListener("click", async () => {
  if (!state || state.isGameOver) return;
  const choices = Object.keys(state.scores.table || {});
  const cat = prompt(`Score which category?\n\n${choices.join("\n")}`);
  if (!cat) return;
  await handleScoreCategory(cat.trim());
});

// ---- Boot ----
(async function init() {
  try {
    // Start a new game on the server
    state = await api("/api/game/new", { method: "POST" });
    render("Click Roll to start your turn.");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to connect to Yatzy server.";
  }
})();
