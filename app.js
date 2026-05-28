(function () {
  "use strict";

  const STORAGE_KEY = "catan-scoring-engine.active-game.v1";
  const COLORS = [
    { id: "red", label: "Red", css: "#ba382f", ink: "#ffffff" },
    { id: "blue", label: "Blue", css: "#22669c", ink: "#ffffff" },
    { id: "white", label: "White", css: "#f1eee3", ink: "#34251b" },
    { id: "orange", label: "Orange", css: "#cf642a", ink: "#ffffff" },
    { id: "green", label: "Green", css: "#3f7653", ink: "#ffffff" },
    { id: "brown", label: "Brown", css: "#74503a", ink: "#ffffff" }
  ];
  const ICONS = ["Helmet", "Ship", "Castle", "Dragon", "Wagon", "Wheat", "Sheep", "Ore", "Brick", "Lumber"];
  const WONDERS = ["Library", "Theater", "Monument", "Great Bridge I", "Great Bridge II", "Cathedral", "Great Wall"];

  const CATEGORIES = {
    settlements: { label: "Settlements Built", group: "Base CATAN", type: "count", points: 1, base: true },
    cities: { label: "Cities Built", group: "Base CATAN", type: "count", points: 2, base: true },
    vpChits: { label: "VP Chits", group: "Base CATAN", type: "count", points: 1, base: true },
    developmentVp: { label: "Revealed Development Card VPs", group: "Base CATAN", type: "count", points: 1, base: true },
    longestRoad: { label: "Longest Road", group: "Base CATAN", type: "award", points: 2, base: true },
    largestArmy: { label: "Largest Army", group: "Base CATAN", type: "award", points: 2, base: true },
    deliveredGoods: { label: "Delivered Goods", group: "Traders & Barbarians", type: "count", points: 1 },
    harborMaster: { label: "Harbormaster", group: "Traders & Barbarians", type: "award", points: 2 },
    camelVp: { label: "Camel VPs", group: "Traders & Barbarians", type: "count", points: 1 },
    capturedBarbarians: { label: "Captured Barbarians", group: "Traders & Barbarians", type: "count", points: 1, divisor: 2 },
    wealthiestSettler: { label: "Wealthiest Settler", group: "Traders & Barbarians", type: "autoStatus", points: 1 },
    poorestSettler: { label: "Poor Settler", group: "Traders & Barbarians", type: "autoStatus", points: -2 },
    oldBoot: { label: "Old Boot", group: "Traders & Barbarians", type: "modifier", points: 0 },
    defenderVp: { label: "Defender of CATAN VPs", group: "Cities & Knights", type: "count", points: 1 },
    progressCardVp: { label: "Progress Card VPs", group: "Cities & Knights", type: "count", points: 1 },
    merchant: { label: "Merchant", group: "Cities & Knights", type: "award", points: 1 },
    metropolisYellow: { label: "Yellow Metropolis", group: "Cities & Knights", type: "metropolis", points: 2 },
    metropolisGreen: { label: "Green Metropolis", group: "Cities & Knights", type: "metropolis", points: 2 },
    metropolisBlue: { label: "Blue Metropolis", group: "Cities & Knights", type: "metropolis", points: 2 },
    conqueredDragons: { label: "Conquered Dragons", group: "Treasures, Dragons & Adventurers", type: "count", points: 1 },
    enchantedTreasures: { label: "Unflipped Treasure Tokens", group: "Treasures, Dragons & Adventurers", type: "threshold", points: 0 },
    wonder: { label: "Wonder of CATAN", group: "Seafarers", type: "wonder", points: 0 }
  };

  const RAW_FACTS = {
    knights: { label: "Played Knight Cards", suggests: "Largest Army" },
    harborPoints: { label: "Harbor Points", suggests: "Harbormaster" },
    coins: { label: "Coins", suggests: "Wealthiest / Poor Settler status" }
  };

  const COUNT_LOG_COPY = {
    settlements: { plus: "built a settlement", minus: "removed a settlement from the record" },
    cities: { plus: "built a city", minus: "removed a city from the record" },
    vpChits: { plus: "gained a victory point chit", minus: "returned a victory point chit" },
    developmentVp: { plus: "revealed a victory point development card", minus: "hid a victory point development card" },
    deliveredGoods: { plus: "delivered goods", minus: "removed a delivered-goods point" },
    camelVp: { plus: "earned a camel victory point", minus: "removed a camel victory point" },
    capturedBarbarians: { plus: "captured a barbarian", minus: "released a captured barbarian from the record" },
    defenderVp: { plus: "earned Defender of CATAN honors", minus: "removed a Defender of CATAN point" },
    progressCardVp: { plus: "scored a Progress Card victory point", minus: "removed a Progress Card victory point" },
    conqueredDragons: { plus: "conquered a dragon", minus: "removed a conquered dragon from the record" },
    enchantedTreasures: { plus: "claimed an unflipped treasure token", minus: "spent or flipped a treasure token" }
  };

  const FACT_LOG_COPY = {
    knights: { plus: "played a knight card", minus: "removed a played knight from the record" },
    harborPoints: { plus: "gained a harbor point", minus: "lost a harbor point" },
    coins: { plus: "gained a gold coin", minus: "spent a gold coin" }
  };

  const EXPANSIONS = [
    {
      id: "seafarers",
      label: "Seafarers",
      scenarios: [
        ["new-shores", "Heading for New Shores", []],
        ["four-islands", "The Four Islands", []],
        ["fog-islands", "The Fog Islands", []],
        ["through-desert", "Through the Desert", []],
        ["forgotten-tribe", "The Forgotten Tribe", ["vpChits"]],
        ["cloth-catan", "Cloth for CATAN", ["vpChits"]],
        ["pirate-islands", "The Pirate Islands", ["vpChits"]],
        ["wonders-catan", "The Wonders of CATAN", ["wonder"]],
        ["new-world", "New World", []]
      ]
    },
    {
      id: "cities-knights",
      label: "Cities & Knights",
      categories: ["defenderVp", "progressCardVp", "merchant", "metropolisYellow", "metropolisGreen", "metropolisBlue"],
      scenarios: [["cities-knights-core", "Cities & Knights scoring module", ["defenderVp", "progressCardVp", "merchant", "metropolisYellow", "metropolisGreen", "metropolisBlue"]]]
    },
    {
      id: "traders-barbarians",
      label: "Traders & Barbarians",
      scenarios: [
        ["friendly-robber", "Friendly Robber", []],
        ["event-cards", "CATAN Event Cards", []],
        ["harbormaster", "Harbormaster", ["harborMaster"]],
        ["fishermen", "The Fishermen of CATAN", ["oldBoot"]],
        ["rivers", "The Rivers of CATAN", ["wealthiestSettler", "poorestSettler"]],
        ["caravans", "The Caravans", ["camelVp"]],
        ["barbarian-attack", "Barbarian Attack", ["capturedBarbarians"]],
        ["traders-scenario", "Traders & Barbarians", ["deliveredGoods"]]
      ]
    },
    {
      id: "treasures-dragons",
      label: "Treasures, Dragons & Adventurers",
      scenarios: [
        ["treasure-islands", "The Treasure Islands", ["vpChits"]],
        ["departure-unknown", "Departure Into the Unknown", ["vpChits"]],
        ["greater-catan", "Greater CATAN", []],
        ["desert-dragons", "The Desert Dragons", ["conqueredDragons"]],
        ["great-canal", "The Great Canal", []],
        ["enchanted-land", "The Enchanted Land", ["conqueredDragons", "enchantedTreasures"]]
      ]
    }
  ];

  const METROPOLISES = {
    metropolisYellow: { color: "Yellow", temporary: "Bank", locked: "Great Exchange" },
    metropolisGreen: { color: "Green", temporary: "Theater", locked: "University" },
    metropolisBlue: { color: "Blue", temporary: "Cathedral", locked: "High Assembly" }
  };

  let screen = "welcome";
  let game = null;
  let setupDraft = createSetupDraft();
  let undoStack = [];
  let redoStack = [];
  let openPlayerId = null;
  let autosaveTimer = null;

  const app = document.getElementById("app");
  const headerActions = document.getElementById("headerActions");
  const saveIndicator = document.getElementById("saveIndicator");
  const importInput = document.getElementById("jsonImport");
  const modalRoot = document.getElementById("modalRoot");

  function createSetupDraft() {
    return {
      title: "",
      playerCount: 4,
      players: Array.from({ length: 6 }, (_, index) => ({
        name: `Player ${index + 1}`,
        color: COLORS[index].id,
        icon: ICONS[index]
      })),
      expansions: [],
      scenarios: [],
      optional: [],
      points: Object.fromEntries(Object.entries(CATEGORIES).map(([key, item]) => [key, item.points])),
      target: 10,
      requiresWonder: false,
      alternativeTarget: ""
    };
  }

  function id() {
    return `p-${Math.random().toString(36).slice(2, 10)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "game";
  }

  function timestampLabel(dateValue) {
    return new Date(dateValue).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  }

  function timeLabel(dateValue) {
    return new Date(dateValue).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function getStoredGame() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.getElementById("toastRoot").appendChild(toast);
    setTimeout(() => toast.remove(), 3600);
  }

  function activeCategoriesFromDraft(draft) {
    const active = new Set(Object.keys(CATEGORIES).filter((key) => CATEGORIES[key].base));
    draft.scenarios.forEach((scenarioId) => {
      EXPANSIONS.forEach((expansion) => {
        const selected = expansion.scenarios.find((scenario) => scenario[0] === scenarioId);
        if (selected) selected[2].forEach((key) => active.add(key));
      });
    });
    draft.optional.forEach((key) => active.add(key));
    return Array.from(active);
  }

  function render() {
    headerActions.classList.toggle("hidden", !game || screen !== "dashboard");
    if (screen === "welcome") renderWelcome();
    if (screen === "setup") renderSetup();
    if (screen === "dashboard") renderDashboard();
    updateHeaderButtons();
    renderModal();
  }

  function renderWelcome() {
    const stored = getStoredGame();
    app.innerHTML = `
      <section class="hero">
        <div class="hex-row" aria-hidden="true">
          <span class="decor-hex"></span><span class="decor-hex"></span><span class="decor-hex"></span>
        </div>
        <h2>Keep the score.<br>Explore the island.</h2>
        <p>Run a base game or a sprawling multi-expansion campaign with player scorecards, award suggestions, checkpoint saves, and victory verification.</p>
        <div class="action-row">
          <button class="primary" type="button" data-action="new-game">Start New Game</button>
          <button class="secondary" type="button" data-action="import-game">Import Saved Game</button>
        </div>
        ${stored ? `
          <div class="recover-card">
            <p><strong>Resume autosaved game:</strong> ${escapeHtml(stored.title)}<br><span class="muted">Saved ${escapeHtml(timestampLabel(stored.lastSavedAt || stored.updatedAt))}</span></p>
            <button class="primary small" type="button" data-action="resume-game">Resume Game</button>
          </div>` : ""}
      </section>`;
  }

  function renderSetup() {
    const active = activeCategoriesFromDraft(setupDraft);
    app.innerHTML = `
      <section class="setup">
        <div class="page-title">
          <div><h2>Start A New Game</h2><p>Configure your table, expansions, scenarios and custom victory requirements.</p></div>
          <button class="ghost small" type="button" data-action="back-home">Back</button>
        </div>
        <div class="setup-grid">
          <section class="setup-section">
            <h3>Game Details</h3>
            <div class="field-grid">
              <label class="field">Game session name
                <input id="setupTitle" value="${escapeHtml(setupDraft.title)}" placeholder="Family Mega Game Night" required>
              </label>
              <label class="field">Number of players
                <select id="setupPlayerCount" data-action="player-count">
                  ${[3, 4, 5, 6].map((value) => `<option ${setupDraft.playerCount === value ? "selected" : ""}>${value}</option>`).join("")}
                </select>
              </label>
            </div>
            <div class="players-setup">
              ${setupDraft.players.slice(0, setupDraft.playerCount).map((player, index) => `
                <div class="player-setup-row">
                  <span class="player-index">${index + 1}</span>
                  <input data-player-name="${index}" value="${escapeHtml(player.name)}" aria-label="Player ${index + 1} name">
                  <select data-player-color="${index}" aria-label="Player ${index + 1} color">
                    ${COLORS.map((color) => `<option value="${color.id}" ${player.color === color.id ? "selected" : ""}>${color.label}</option>`).join("")}
                  </select>
                  <select data-player-icon="${index}" aria-label="Player ${index + 1} icon">
                    ${ICONS.map((icon) => `<option ${player.icon === icon ? "selected" : ""}>${icon}</option>`).join("")}
                  </select>
                </div>`).join("")}
            </div>
          </section>
          <section class="setup-section">
            <h3>Expansions And Scenarios</h3>
            <div class="selection-grid">
              ${EXPANSIONS.map((expansion) => {
                const enabled = setupDraft.expansions.includes(expansion.id);
                return `<div class="check-card">
                  <label class="check-line"><input type="checkbox" data-expansion="${expansion.id}" ${enabled ? "checked" : ""}> ${escapeHtml(expansion.label)} <span class="muted">(Expansion)</span></label>
                  ${enabled ? `<div class="scenario-list">${expansion.scenarios.map((scenario) => `
                    <label><input type="checkbox" data-scenario="${scenario[0]}" ${setupDraft.scenarios.includes(scenario[0]) ? "checked" : ""}> ${escapeHtml(scenario[1])} <span class="muted">(Scenario / Variant)</span></label>`).join("")}</div>` : ""}
                </div>`;
              }).join("")}
            </div>
          </section>
          <section class="setup-section">
            <h3>Add Optional Scoring Category</h3>
            <p class="muted">Use scoring rows even when their standard scenario is not selected in your custom combination.</p>
            <div class="selection-grid">
              ${Object.entries(CATEGORIES).filter(([key]) => !CATEGORIES[key].base).map(([key, item]) => `
                <label class="check-card check-line"><input type="checkbox" data-optional="${key}" ${setupDraft.optional.includes(key) ? "checked" : ""}> ${escapeHtml(item.label)}</label>`).join("")}
            </div>
          </section>
          <section class="setup-section">
            <h3>Victory Conditions</h3>
            <div class="field-grid">
              <label class="field">Primary victory points required
                <input type="number" min="1" id="setupTarget" value="${setupDraft.target}">
              </label>
              <label class="field">Alternate points-only victory total
                <input type="number" min="1" id="setupAltTarget" placeholder="Optional" value="${escapeHtml(setupDraft.alternativeTarget)}">
              </label>
            </div>
            <label class="check-line" style="margin-top:12px;"><input id="setupRequiresWonder" type="checkbox" ${setupDraft.requiresWonder ? "checked" : ""}> Primary victory path requires a completed Wonder of CATAN</label>
          </section>
          <section class="setup-section">
            <h3>Enabled Score Values</h3>
            <p class="muted">Official-style defaults are supplied; adjust any value for your mega-game before or during play.</p>
            <table class="rule-table">
              <thead><tr><th>Category</th><th>Points</th><th>Notes</th></tr></thead>
              <tbody>
                ${active.map((key) => {
                  const item = CATEGORIES[key];
                  const note = item.type === "threshold" ? "3 tokens = 1 VP, 4+ tokens = 2 VP" : item.divisor ? `per ${item.divisor} recorded` : item.type === "modifier" ? "Adds 1 to required VP" : item.type === "wonder" ? "Victory requirement tracking" : item.type;
                  return `<tr><td>${escapeHtml(item.label)}</td><td>${item.type === "modifier" || item.type === "wonder" || item.type === "threshold" ? "-" : `<input type="number" step="0.5" data-point-value="${key}" value="${setupDraft.points[key]}">`}</td><td class="muted">${escapeHtml(note)}</td></tr>`;
                }).join("")}
              </tbody>
            </table>
          </section>
          <div class="action-row">
            <button class="primary" type="button" data-action="create-game">Begin Tracking Game</button>
          </div>
        </div>
      </section>`;
  }

  function collectSetupDraft() {
    const title = document.getElementById("setupTitle");
    if (!title) return;
    setupDraft.title = title.value.trim();
    document.querySelectorAll("[data-player-name]").forEach((nameInput) => {
      const index = Number(nameInput.dataset.playerName);
      const player = setupDraft.players[index];
      player.name = nameInput.value.trim() || `Player ${index + 1}`;
      player.color = document.querySelector(`[data-player-color="${index}"]`).value;
      player.icon = document.querySelector(`[data-player-icon="${index}"]`).value;
    });
    setupDraft.playerCount = Number(document.getElementById("setupPlayerCount").value);
    setupDraft.expansions = Array.from(document.querySelectorAll("[data-expansion]:checked")).map((element) => element.dataset.expansion);
    setupDraft.scenarios = Array.from(document.querySelectorAll("[data-scenario]:checked")).map((element) => element.dataset.scenario);
    setupDraft.optional = Array.from(document.querySelectorAll("[data-optional]:checked")).map((element) => element.dataset.optional);
    document.querySelectorAll("[data-point-value]").forEach((element) => {
      setupDraft.points[element.dataset.pointValue] = Number(element.value);
    });
    setupDraft.target = Math.max(1, Number(document.getElementById("setupTarget").value) || 10);
    setupDraft.alternativeTarget = document.getElementById("setupAltTarget").value;
    setupDraft.requiresWonder = document.getElementById("setupRequiresWonder").checked;
  }

  function buildNewGame() {
    collectSetupDraft();
    if (!setupDraft.title) {
      showToast("Please name this game session before beginning.");
      return;
    }
    const chosenColors = setupDraft.players.slice(0, setupDraft.playerCount).map((player) => player.color);
    if (new Set(chosenColors).size !== chosenColors.length) {
      showToast("Each player must have a unique standard color.");
      return;
    }
    const now = new Date().toISOString();
    const activeCategories = activeCategoriesFromDraft(setupDraft);
    game = {
      version: 1,
      title: setupDraft.title,
      createdAt: now,
      updatedAt: now,
      lastSavedAt: now,
      status: "active",
      winnerId: null,
      config: {
        expansions: clone(setupDraft.expansions),
        scenarios: clone(setupDraft.scenarios),
        optional: clone(setupDraft.optional),
        activeCategories,
        points: clone(setupDraft.points),
        target: setupDraft.target,
        requiresWonder: setupDraft.requiresWonder,
        alternativeTarget: setupDraft.alternativeTarget ? Number(setupDraft.alternativeTarget) : null
      },
      players: setupDraft.players.slice(0, setupDraft.playerCount).map((setupPlayer) => ({
        id: id(),
        name: setupPlayer.name,
        color: setupPlayer.color,
        icon: setupPlayer.icon,
        counts: Object.fromEntries(Object.keys(CATEGORIES).filter((key) => CATEGORIES[key].type === "count").map((key) => [key, 0])),
        facts: { knights: 0, harborPoints: 0, coins: 0 },
        routes: [],
        wonder: null
      })),
      awards: Object.fromEntries(Object.keys(CATEGORIES).filter((key) => ["award", "modifier"].includes(CATEGORIES[key].type)).map((key) => [key, null])),
      metropolises: Object.fromEntries(Object.keys(METROPOLISES).map((key) => [key, { ownerId: null, locked: false }])),
      sessions: [{ id: `session-${Date.now()}`, date: now.slice(0, 10), startedAt: now, endedAt: null, notes: "" }],
      history: [{ timestamp: now, description: `Game created: ${setupDraft.title}.` }]
    };
    undoStack = [];
    redoStack = [];
    screen = "dashboard";
    saveGame("Game autosaved.");
    startAutosave();
    render();
  }

  function active(key) {
    return game.config.activeCategories.includes(key);
  }

  function colorInfo(colorId) {
    return COLORS.find((color) => color.id === colorId) || COLORS[0];
  }

  function playerIconSvg(player) {
    const color = colorInfo(player.color);
    const icon = iconPath(player.icon);
    return `<svg class="player-symbol" viewBox="0 0 64 64" role="img" aria-label="${escapeHtml(color.label)} ${escapeHtml(player.icon)} icon">
      <title>${escapeHtml(color.label)} ${escapeHtml(player.icon)}</title>
      <g fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
    </svg>`;
  }

  function iconPath(iconName) {
    const icons = {
      Helmet: `
        <path d="M12 34c2-16 13-25 30-23 7 1 11 6 12 13" />
        <path d="M14 35h35c0 10-7 17-18 17H20c-4 0-7-3-7-7v-4" />
        <path d="M40 16c-3 7-4 15-2 25" />
        <path d="M49 28h9" />
        <path d="M22 34v13" />`,
      Ship: `
        <path d="M13 42h38l-6 10H20l-7-10Z" />
        <path d="M32 12v30" />
        <path d="M32 15l17 20H32V15Z" />
        <path d="M31 20L17 36h14V20Z" />`,
      Castle: `
        <path d="M15 52V23h9v-8h8v8h8v-8h9v37" />
        <path d="M12 52h40" />
        <path d="M25 52V39c0-5 14-5 14 0v13" />
        <path d="M20 31h6M38 31h6" />`,
      Dragon: `
        <path d="M14 46c8 6 22 4 30-5 5-6 5-15-2-20" />
        <path d="M42 21l9-7-2 12 9 3-11 4" />
        <path d="M25 43c-2-9 1-17 9-24" />
        <path d="M25 26L13 18l5 17" />
        <path d="M38 40l9 10" />`,
      Wagon: `
        <path d="M14 38h36l-4 12H18l-4-12Z" />
        <path d="M19 38V24h26v14" />
        <path d="M23 24l5-8h16l5 8" />
        <circle cx="23" cy="52" r="5" />
        <circle cx="43" cy="52" r="5" />`,
      Wheat: `
        <path d="M32 54V12" />
        <path d="M32 18c-9 1-12 7-13 13 8-1 12-6 13-13Z" />
        <path d="M32 28c9 1 12 7 13 13-8-1-12-6-13-13Z" />
        <path d="M32 38c-8 1-11 6-12 11 7-1 11-5 12-11Z" />`,
      Sheep: `
        <circle cx="23" cy="35" r="9" />
        <circle cx="34" cy="31" r="11" />
        <circle cx="44" cy="36" r="8" />
        <path d="M48 35l7 3-7 5" />
        <path d="M22 44v8M43 44v8" />
        <path d="M53 38h3" />`,
      Ore: `
        <path d="M17 45l8-27h20l8 27-12 8H29l-12-8Z" />
        <path d="M25 18l8 13 12-13" />
        <path d="M25 45l8-14 8 22" />`,
      Brick: `
        <path d="M12 22h40v24H12V22Z" />
        <path d="M12 34h40" />
        <path d="M25 22v12M39 34v12" />`,
      Lumber: `
        <path d="M21 49l22-34" />
        <path d="M30 52l22-34" />
        <path d="M15 42l22-34" />
        <path d="M20 48h18M26 39h18M32 30h18" />`
    };
    return icons[iconName] || icons.Helmet;
  }

  function playerById(playerId) {
    return game.players.find((player) => player.id === playerId);
  }

  function routeLength(route) {
    return route.segments.reduce((total, segment) => total + (segment.camel ? 2 : 1), 0);
  }

  function bestRoute(player) {
    return player.routes.reduce((best, route) => Math.max(best, routeLength(route)), 0);
  }

  function scoreBreakdown(player) {
    const parts = [];
    const riverStatus = riverCoinStatus();
    game.config.activeCategories.forEach((key) => {
      const definition = CATEGORIES[key];
      const value = game.config.points[key];
      if (definition.type === "count") {
        const count = player.counts[key] || 0;
        const scoredUnits = definition.divisor ? Math.floor(count / definition.divisor) : count;
        const points = scoredUnits * value;
        if (count || points) parts.push({ label: definition.label, detail: `${count} recorded`, points });
      }
      if (definition.type === "threshold" && key === "enchantedTreasures") {
        const count = player.counts[key] || 0;
        const points = enchantedTreasurePoints(count);
        if (count || points) parts.push({ label: definition.label, detail: `${count} unflipped`, points });
      }
      if (["award", "modifier"].includes(definition.type) && game.awards[key] === player.id && definition.type === "award") {
        parts.push({ label: definition.label, detail: "Current holder", points: value });
      }
      if (definition.type === "metropolis" && game.metropolises[key].ownerId === player.id) {
        const state = game.metropolises[key];
        parts.push({ label: definition.label, detail: state.locked ? METROPOLISES[key].locked : METROPOLISES[key].temporary, points: value });
      }
      if (definition.type === "autoStatus" && key === "wealthiestSettler" && riverStatus.wealthiestId === player.id) {
        parts.push({ label: definition.label, detail: `${player.facts.coins} coins, unique leader`, points: value });
      }
      if (definition.type === "autoStatus" && key === "poorestSettler" && riverStatus.poorestIds.includes(player.id)) {
        parts.push({ label: definition.label, detail: `${player.facts.coins} coins, tied for fewest`, points: value });
      }
    });
    return parts;
  }

  function riverCoinStatus() {
    if (!game || (!active("wealthiestSettler") && !active("poorestSettler"))) {
      return { wealthiestId: null, poorestIds: [] };
    }
    const values = game.players.map((player) => ({ player, coins: Number(player.facts.coins) || 0 }));
    const max = Math.max(...values.map((entry) => entry.coins));
    const min = Math.min(...values.map((entry) => entry.coins));
    if (max === min) return { wealthiestId: null, poorestIds: [] };
    const richest = values.filter((entry) => entry.coins === max);
    const poorest = values.filter((entry) => entry.coins === min);
    return {
      wealthiestId: active("wealthiestSettler") && richest.length === 1 ? richest[0].player.id : null,
      poorestIds: active("poorestSettler") ? poorest.map((entry) => entry.player.id) : []
    };
  }

  function riverBadges(player) {
    const status = riverCoinStatus();
    const badges = [];
    if (status.wealthiestId === player.id) badges.push({ label: "Wealthiest Settler", kind: "good", points: game.config.points.wealthiestSettler });
    if (status.poorestIds.includes(player.id)) badges.push({ label: "Poor Settler", kind: "bad", points: game.config.points.poorestSettler });
    return badges;
  }

  function scoreTotal(player) {
    return scoreBreakdown(player).reduce((total, part) => total + part.points, 0);
  }

  function enchantedTreasurePoints(count) {
    if (count >= 4) return 2;
    if (count >= 3) return 1;
    return 0;
  }

  function hasCompletedWonder(player) {
    return player.wonder && Number(player.wonder.level) >= 4;
  }

  function wonderRequirementLabel(player) {
    if (!player.wonder) return "completed wonder";
    return `${player.wonder.name} level ${player.wonder.level}`;
  }

  function requiredTotal(player, baseTarget) {
    return baseTarget + (active("oldBoot") && game.awards.oldBoot === player.id ? 1 : 0);
  }

  function victoryStatus(player) {
    const total = scoreTotal(player);
    const primaryThreshold = requiredTotal(player, game.config.target);
    if (total >= primaryThreshold && (!game.config.requiresWonder || hasCompletedWonder(player))) {
      return { qualifies: true, text: `${total} VP meets ${primaryThreshold} VP${game.config.requiresWonder ? " with a completed wonder" : ""}.` };
    }
    if (game.config.alternativeTarget) {
      const alternativeThreshold = requiredTotal(player, game.config.alternativeTarget);
      if (total >= alternativeThreshold) {
        return { qualifies: true, text: `${total} VP meets alternate ${alternativeThreshold} VP path.` };
      }
    }
    return { qualifies: false, text: "" };
  }

  function potentialWinners() {
    return game.players.map((player) => ({ player, result: victoryStatus(player) })).filter((entry) => entry.result.qualifies);
  }

  function commit(description, mutator) {
    const before = gameCore();
    mutator();
    const after = gameCore();
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    const entry = { timestamp: new Date().toISOString(), description };
    game.history.push(entry);
    undoStack.push({ before, after, description });
    redoStack = [];
    game.updatedAt = entry.timestamp;
    saveGame();
    render();
  }

  function gameCore() {
    const current = clone(game);
    delete current.history;
    delete current.lastSavedAt;
    delete current.updatedAt;
    return current;
  }

  function restoreCore(core) {
    const history = game.history;
    const updatedAt = new Date().toISOString();
    const saved = clone(core);
    saved.history = history;
    saved.updatedAt = updatedAt;
    saved.lastSavedAt = game.lastSavedAt;
    game = saved;
  }

  function undo() {
    const action = undoStack.pop();
    if (!action) return;
    redoStack.push(action);
    restoreCore(action.before);
    game.history.push({ timestamp: new Date().toISOString(), description: `Undo: ${action.description}` });
    saveGame();
    render();
  }

  function redo() {
    const action = redoStack.pop();
    if (!action) return;
    undoStack.push(action);
    restoreCore(action.after);
    game.history.push({ timestamp: new Date().toISOString(), description: `Redo: ${action.description}` });
    saveGame();
    render();
  }

  function saveGame(message) {
    if (!game) return;
    game.lastSavedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    updateHeaderButtons();
    if (message) showToast(message);
  }

  function startAutosave() {
    clearInterval(autosaveTimer);
    autosaveTimer = setInterval(() => {
      if (game && screen === "dashboard") {
        saveGame();
        showToast("Periodic autosave complete. Download a checkpoint when convenient.");
      }
    }, 30 * 60 * 1000);
  }

  function updateHeaderButtons() {
    if (!game) return;
    saveIndicator.textContent = `Autosaved ${timeLabel(game.lastSavedAt || game.updatedAt)}`;
    document.getElementById("undoBtn").disabled = !undoStack.length;
    document.getElementById("redoBtn").disabled = !redoStack.length;
  }

  function scenarioNames() {
    const lookup = {};
    EXPANSIONS.forEach((expansion) => expansion.scenarios.forEach((scenario) => {
      lookup[scenario[0]] = scenario[1];
    }));
    return game.config.scenarios.map((key) => lookup[key]).filter(Boolean);
  }

  function renderDashboard() {
    const winners = potentialWinners();
    const scoredRows = game.config.activeCategories.filter((key) => ["count", "threshold"].includes(CATEGORIES[key].type));
    const factRows = Object.entries(RAW_FACTS).filter(([key]) =>
      (key === "knights" && active("largestArmy")) ||
      (key === "harborPoints" && active("harborMaster")) ||
      (key === "coins" && (active("wealthiestSettler") || active("poorestSettler")))
    );
    app.innerHTML = `
      <section class="dashboard">
        <div class="dashboard-head">
          <div>
            <h2>${escapeHtml(game.title)}</h2>
            <div class="tag-row">${scenarioNames().map((name) => `<span class="tag">${escapeHtml(name)}</span>`).join("") || `<span class="tag">Base CATAN</span>`}</div>
          </div>
          <div class="action-row">
            <button class="ghost small" data-action="home" type="button">Home</button>
            <button class="secondary small" data-action="open-rules" type="button">Edit Rules</button>
            <button class="secondary small" data-action="open-sessions" type="button">Sessions</button>
          </div>
        </div>
        ${game.status !== "completed" ? winners.map((entry) => `
          <div class="winner-alert">
            <div><strong>Potential Winner: ${escapeHtml(entry.player.name)}</strong><span>${escapeHtml(entry.result.text)} Verify the physical board before confirming.</span></div>
            <div class="action-row">
              <button class="secondary small" aria-label="Review ${escapeHtml(entry.player.name)} scorecard" data-action="open-player" data-player="${entry.player.id}">Review Scorecard</button>
              <button class="primary small" aria-label="Confirm ${escapeHtml(entry.player.name)} as winner" data-action="confirm-winner" data-player="${entry.player.id}">Confirm Winner</button>
            </div>
          </div>`).join("") : ""}
        ${game.status === "completed" ? `<div class="winner-alert"><div><strong>Game Completed</strong><span>Confirmed winner: ${escapeHtml(playerById(game.winnerId)?.name || "Unknown")}. Scores remain editable.</span></div></div>` : ""}
        <div class="player-summary-grid">
          ${game.players.map((player) => {
            const color = colorInfo(player.color);
            const target = requiredTotal(player, game.config.target);
            const badges = riverBadges(player);
            return `<button type="button" class="player-card" style="--player-accent:${color.css};--player-ink:${color.ink}" data-action="open-player" data-player="${player.id}">
              <span class="player-card-top"><span class="player-hex">${playerIconSvg(player)}</span><span><h3>${escapeHtml(player.name)}</h3><span class="muted">${escapeHtml(color.label)} / ${escapeHtml(player.icon)}</span></span></span>
              <span class="score-total">${scoreTotal(player)} VP</span>
              <span class="score-target">Target ${target}${game.config.requiresWonder ? ` + ${escapeHtml(wonderRequirementLabel(player))}` : ""}${active("oldBoot") && game.awards.oldBoot === player.id ? " (Old Boot)" : ""}</span>
              ${badges.length ? `<span class="river-badges">${badges.map((badge) => `<span class="river-badge ${badge.kind}">${escapeHtml(badge.label)} ${badge.points > 0 ? "+" : ""}${badge.points} VP</span>`).join("")}</span>` : ""}
            </button>`;
          }).join("")}
        </div>
        <section class="panel">
          <div class="section-title"><h3>Scoring Table</h3><span class="muted">Use +/- or enter an exact count.</span></div>
          <div class="score-table-wrap">
            <table class="score-table">
              <thead><tr><th>Scoring Category</th>${game.players.map((player) => `<th>${escapeHtml(player.name)}</th>`).join("")}</tr></thead>
              <tbody>
                ${scoredRows.map((key) => renderCountRow(key)).join("")}
                ${factRows.length ? `<tr><th colspan="${game.players.length + 1}">Tracking Facts <span class="category-note">Used for suggested awards, not direct VP.</span></th></tr>` : ""}
                ${factRows.map(([key, definition]) => renderFactRow(key, definition)).join("")}
              </tbody>
            </table>
          </div>
        </section>
        <div class="dashboard-columns">
          <section class="panel">
            <div class="section-title"><h3>Awards And Titles</h3><span class="muted">Confirmed holders only</span></div>
            <div class="award-list">${renderAutoTitles()}${renderAwards()}${renderMetropolises()}</div>
            <div class="section-title" style="margin-top:16px;"><h3>Calculated Suggestions</h3></div>
            <div class="suggestion-list">${renderSuggestions()}</div>
          </section>
          <section class="panel">
            <div class="section-title"><h3>Activity Log</h3><button class="secondary small" data-action="open-sessions" type="button">Manage Sessions</button></div>
            <div class="history-list">
              ${game.history.slice().reverse().map((entry) => `<div class="history-entry"><time>${escapeHtml(timestampLabel(entry.timestamp))}</time>${escapeHtml(entry.description)}</div>`).join("")}
            </div>
          </section>
        </div>
      </section>`;
  }

  function renderCountRow(key) {
    const definition = CATEGORIES[key];
    const pointText = definition.type === "threshold" ? "3 = 1 VP, 4+ = 2 VP" : definition.divisor ? `${game.config.points[key]} VP per ${definition.divisor}` : `${game.config.points[key]} VP each`;
    return `<tr>
      <th>${escapeHtml(definition.label)}<span class="category-note">${escapeHtml(pointText)}</span></th>
      ${game.players.map((player) => `<td>${counterHtml("count", key, player.id, player.counts[key] || 0)}</td>`).join("")}
    </tr>`;
  }

  function renderFactRow(key, definition) {
    return `<tr>
      <th>${escapeHtml(definition.label)}<span class="category-note">Suggests ${escapeHtml(definition.suggests)}</span></th>
      ${game.players.map((player) => `<td>${counterHtml("fact", key, player.id, player.facts[key] || 0)}</td>`).join("")}
    </tr>`;
  }

  function counterHtml(kind, key, playerId, value) {
    const playerName = playerById(playerId)?.name || "Player";
    const label = kind === "fact" ? RAW_FACTS[key].label : CATEGORIES[key].label;
    return `<span class="counter">
      <button type="button" data-adjust="${kind}" data-key="${key}" data-player="${playerId}" data-amount="-1" aria-label="Decrease ${escapeHtml(playerName)} ${escapeHtml(label)}">-</button>
      <input type="number" min="0" value="${value}" data-set="${kind}" data-key="${key}" data-player="${playerId}" aria-label="${escapeHtml(playerName)} ${escapeHtml(label)} count">
      <button type="button" data-adjust="${kind}" data-key="${key}" data-player="${playerId}" data-amount="1" aria-label="Increase ${escapeHtml(playerName)} ${escapeHtml(label)}">+</button>
    </span>`;
  }

  function holderOptions(selectedId) {
    return `<option value="">Unassigned</option>${game.players.map((player) => `<option value="${player.id}" ${selectedId === player.id ? "selected" : ""}>${escapeHtml(player.name)}</option>`).join("")}`;
  }

  function renderAwards() {
    return game.config.activeCategories
      .filter((key) => ["award", "modifier"].includes(CATEGORIES[key].type))
      .map((key) => `<div class="award-row">
        <strong>${escapeHtml(CATEGORIES[key].label)}</strong>
        <select data-award="${key}" aria-label="${escapeHtml(CATEGORIES[key].label)} holder">${holderOptions(game.awards[key])}</select>
        <span class="award-state">${key === "oldBoot" ? "+1 required VP" : `${game.config.points[key]} VP`}</span>
      </div>`).join("");
  }

  function renderAutoTitles() {
    if (!active("wealthiestSettler")) return "";
    const status = riverCoinStatus();
    const holder = status.wealthiestId ? playerById(status.wealthiestId).name : "No unique wealthiest settler";
    return `<div class="award-row">
      <strong>Wealthiest Settler</strong>
      <span class="award-state">${escapeHtml(holder)}</span>
      <span class="award-state">${game.config.points.wealthiestSettler} VP, auto</span>
    </div>`;
  }

  function renderMetropolises() {
    return Object.entries(METROPOLISES)
      .filter(([key]) => active(key))
      .map(([key, labels]) => {
        const state = game.metropolises[key];
        return `<div class="award-row">
          <strong>${escapeHtml(labels.color)} Metropolis</strong>
          <select aria-label="${escapeHtml(labels.color)} Metropolis holder" data-metropolis="${key}" ${state.locked ? "disabled" : ""}>${holderOptions(state.ownerId)}</select>
          ${state.locked
            ? `<span class="award-state">Locked: ${escapeHtml(labels.locked)}</span>`
            : state.ownerId
              ? `<button class="secondary small" type="button" data-action="lock-metropolis" data-key="${key}">Lock ${escapeHtml(labels.locked)}</button>`
              : `<span class="award-state">${escapeHtml(labels.temporary)} then ${escapeHtml(labels.locked)}</span>`}
        </div>`;
      }).join("");
  }

  function uniqueLeader(values, minimum, chooseMinimum) {
    const eligible = values.filter((item) => chooseMinimum || item.value >= minimum);
    if (!eligible.length) return null;
    const selectedValue = chooseMinimum ? Math.min(...eligible.map((item) => item.value)) : Math.max(...eligible.map((item) => item.value));
    const leaders = eligible.filter((item) => item.value === selectedValue);
    return leaders.length === 1 ? leaders[0] : null;
  }

  function awardSuggestions() {
    const items = [];
    const suggest = (award, candidate, note) => {
      if (candidate && game.awards[award] !== candidate.player.id) items.push({ award, player: candidate.player, note });
    };
    if (active("longestRoad")) {
      const candidate = uniqueLeader(game.players.map((player) => ({ player, value: bestRoute(player) })), 5, false);
      suggest("longestRoad", candidate, candidate && `Longest recorded route: ${candidate.value}.`);
    }
    if (active("largestArmy")) {
      const candidate = uniqueLeader(game.players.map((player) => ({ player, value: player.facts.knights })), 3, false);
      suggest("largestArmy", candidate, candidate && `${candidate.value} played knight cards.`);
    }
    if (active("harborMaster")) {
      const candidate = uniqueLeader(game.players.map((player) => ({ player, value: player.facts.harborPoints })), 3, false);
      suggest("harborMaster", candidate, candidate && `${candidate.value} harbor points.`);
    }
    return items;
  }

  function renderSuggestions() {
    const suggestions = awardSuggestions();
    if (!suggestions.length) return `<p class="muted">No unconfirmed award changes currently suggested.</p>`;
    return suggestions.map((suggestion) => `<div class="suggestion">
      <p><strong>${escapeHtml(CATEGORIES[suggestion.award].label)}:</strong> assign to ${escapeHtml(suggestion.player.name)}. ${escapeHtml(suggestion.note)}</p>
      <button class="primary small" type="button" aria-label="Assign ${escapeHtml(CATEGORIES[suggestion.award].label)} to ${escapeHtml(suggestion.player.name)}" data-action="confirm-suggestion" data-key="${suggestion.award}" data-player="${suggestion.player.id}">Assign</button>
    </div>`).join("");
  }

  function renderModal() {
    if (!game || screen !== "dashboard") {
      modalRoot.innerHTML = "";
      return;
    }
    if (openPlayerId) {
      const player = playerById(openPlayerId);
      if (!player) {
        openPlayerId = null;
        modalRoot.innerHTML = "";
        return;
      }
      modalRoot.innerHTML = renderPlayerModal(player);
      return;
    }
    modalRoot.innerHTML = "";
  }

  function renderPlayerModal(player) {
    const parts = scoreBreakdown(player);
    const color = colorInfo(player.color);
    return `<div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(player.name)} scorecard">
        <div class="modal-head">
          <div class="brand">
            <span class="player-hex" style="--player-accent:${color.css};--player-ink:${color.ink}">${playerIconSvg(player)}</span>
            <div><h2>${escapeHtml(player.name)} Scorecard</h2><span class="muted">${scoreTotal(player)} VP counted / ${requiredTotal(player, game.config.target)} primary target</span></div>
          </div>
          <button class="ghost small" type="button" data-action="close-modal">Close</button>
        </div>
        <div class="scorecard-grid">
          <section class="panel">
            <div class="section-title"><h3>Verification Summary</h3></div>
            <table class="breakdown">
              ${parts.map((part) => `<tr><td>${escapeHtml(part.label)}<span class="category-note">${escapeHtml(part.detail)}</span></td><td>${part.points > 0 ? "+" : ""}${part.points}</td></tr>`).join("") || `<tr><td>No counted points recorded.</td><td>0</td></tr>`}
              <tr><td><strong>Total Counted VP</strong></td><td>${scoreTotal(player)}</td></tr>
            </table>
            <div class="section-title" style="margin-top:15px;"><h3>Tracking Facts</h3></div>
            <div class="fact-grid">
              ${Object.entries(RAW_FACTS).map(([key, definition]) => `<label class="field">${escapeHtml(definition.label)}${counterHtml("fact", key, player.id, player.facts[key])}</label>`).join("")}
            </div>
            ${active("wonder") ? renderWonderEditor(player) : ""}
          </section>
          <section class="panel">
            <div class="section-title"><h3>Contiguous Routes</h3><button type="button" class="secondary small" data-action="add-route" data-player="${player.id}" ${player.routes.length >= 5 ? "disabled" : ""}>Add Route</button></div>
            <p class="muted">Road or ship = 1 length. A segment tagged with a camel = 2 length. Assign Longest Road from the suggestion after reviewing the board.</p>
            ${player.routes.length ? player.routes.map((route, index) => renderRoute(player, route, index)).join("") : `<p class="muted">No routes recorded yet.</p>`}
          </section>
        </div>
      </section>
    </div>`;
  }

  function renderWonderEditor(player) {
    const usedWonders = new Set(game.players.filter((entry) => entry.id !== player.id && entry.wonder).map((entry) => entry.wonder.name));
    const current = player.wonder ? player.wonder.name : "";
    return `<div class="section-title" style="margin-top:15px;"><h3>Wonder Of CATAN</h3></div>
      <div class="wonder-grid">
        <label class="field">Claimed wonder
          <select data-wonder="${player.id}">
            <option value="">None</option>
            ${WONDERS.map((wonder) => `<option value="${wonder}" ${current === wonder ? "selected" : ""} ${usedWonders.has(wonder) ? "disabled" : ""}>${escapeHtml(wonder)}</option>`).join("")}
          </select>
        </label>
        <label class="field">Construction level
          <select data-wonder-level="${player.id}" ${player.wonder ? "" : "disabled"}>
            ${[1, 2, 3, 4].map((level) => `<option ${player.wonder && player.wonder.level === level ? "selected" : ""}>${level}</option>`).join("")}
          </select>
        </label>
      </div>`;
  }

  function renderRoute(player, route, index) {
    return `<div class="route-card">
      <div class="route-head">
        <strong>Route ${index + 1}: ${routeLength(route)} length</strong>
        <button class="ghost small" type="button" data-action="delete-route" data-player="${player.id}" data-route="${route.id}">Delete</button>
      </div>
      <div class="segment-list">
        ${route.segments.map((segment) => `<div class="segment ${segment.camel ? "camel" : ""}">
          ${escapeHtml(segment.type)}<br>${segment.camel ? "Camel +1" : "No camel"}
          <button type="button" data-action="toggle-camel" data-player="${player.id}" data-route="${route.id}" data-segment="${segment.id}">${segment.camel ? "Remove camel" : "Add camel"}</button>
          <button type="button" data-action="delete-segment" data-player="${player.id}" data-route="${route.id}" data-segment="${segment.id}">Remove</button>
        </div>`).join("") || `<span class="muted">Add road or ship segments below.</span>`}
      </div>
      <div class="route-controls">
        <button class="secondary small" type="button" data-action="add-segment" data-player="${player.id}" data-route="${route.id}" data-type="Road">Add Road</button>
        <button class="secondary small" type="button" data-action="add-segment" data-player="${player.id}" data-route="${route.id}" data-type="Ship">Add Ship</button>
      </div>
    </div>`;
  }

  function openRulesModal() {
    modalRoot.innerHTML = `<div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true">
        <div class="modal-head"><h2>Scoring Rules And Victory Paths</h2><button class="ghost small" type="button" data-action="close-modal">Close</button></div>
        <div class="field-grid">
          <label class="field">Primary victory points required<input id="editTarget" type="number" min="1" value="${game.config.target}"></label>
          <label class="field">Alternate points-only target<input id="editAltTarget" type="number" min="1" value="${game.config.alternativeTarget || ""}" placeholder="Optional"></label>
        </div>
        <label class="check-line" style="margin:15px 0;"><input id="editWonderRequired" type="checkbox" ${game.config.requiresWonder ? "checked" : ""}> Primary victory path requires completed Wonder of CATAN</label>
        <table class="rule-table">
          <thead><tr><th>Enabled Category</th><th>Points</th></tr></thead>
          <tbody>${game.config.activeCategories.filter((key) => !["modifier", "wonder", "threshold"].includes(CATEGORIES[key].type)).map((key) => `<tr><td>${escapeHtml(CATEGORIES[key].label)}</td><td><input data-edit-point="${key}" type="number" step="0.5" value="${game.config.points[key]}"></td></tr>`).join("")}</tbody>
        </table>
        <div class="modal-actions" style="margin-top:15px;"><button class="primary" type="button" data-action="save-rules">Save Rule Changes</button></div>
      </section>
    </div>`;
  }

  function openSessionsModal() {
    modalRoot.innerHTML = `<div class="modal-backdrop">
      <section class="modal" role="dialog" aria-modal="true">
        <div class="modal-head"><h2>Play Sessions</h2><button class="ghost small" type="button" data-action="close-modal">Close</button></div>
        <div class="session-list">
          ${game.sessions.map((session, index) => `<div class="session-row">
            <div><strong>Session ${index + 1}</strong><br><span class="muted">${escapeHtml(session.date)} / ${session.endedAt ? `${timeLabel(session.startedAt)} - ${timeLabel(session.endedAt)}` : `Started ${timeLabel(session.startedAt)} (active)`}</span></div>
            <input data-session-note="${session.id}" value="${escapeHtml(session.notes || "")}" placeholder="Notes for this sitting">
            ${session.endedAt ? "" : `<button class="secondary small" data-action="end-session" data-session="${session.id}">End Session</button>`}
          </div>`).join("")}
        </div>
        <div class="modal-actions" style="margin-top:15px;"><button class="primary small" type="button" data-action="new-session">Start New Session</button></div>
      </section>
    </div>`;
  }

  function assignAward(key, playerId) {
    const from = game.awards[key] ? playerById(game.awards[key])?.name : "Unassigned";
    const to = playerId ? playerById(playerId)?.name : "Unassigned";
    const label = CATEGORIES[key].label;
    const description = playerId
      ? `${to} claimed ${label}${from !== "Unassigned" ? ` from ${from}` : ""}.`
      : `${label} is now unassigned${from !== "Unassigned" ? ` after leaving ${from}` : ""}.`;
    commit(description, () => {
      game.awards[key] = playerId || null;
    });
  }

  function updateValue(kind, key, playerId, value) {
    const player = playerById(playerId);
    const safeValue = Math.max(0, Number(value) || 0);
    const oldValue = kind === "fact" ? player.facts[key] : player.counts[key];
    if (safeValue === oldValue) return;
    const label = kind === "fact" ? RAW_FACTS[key].label : CATEGORIES[key].label;
    commit(`${player.name} changed ${label} from ${oldValue} to ${safeValue}.`, () => {
      if (kind === "fact") player.facts[key] = safeValue;
      else player.counts[key] = safeValue;
    });
  }

  function updateValueByStep(kind, key, playerId, amount) {
    const player = playerById(playerId);
    const current = kind === "fact" ? player.facts[key] : player.counts[key];
    const next = Math.max(0, current + amount);
    if (next === current) return;
    const copy = kind === "fact" ? FACT_LOG_COPY[key] : COUNT_LOG_COPY[key];
    const phrase = amount > 0 ? copy?.plus : copy?.minus;
    const fallbackLabel = kind === "fact" ? RAW_FACTS[key].label : CATEGORIES[key].label;
    const description = phrase
      ? `${player.name} ${phrase}.`
      : `${player.name} ${amount > 0 ? "increased" : "decreased"} ${fallbackLabel}.`;
    commit(description, () => {
      if (kind === "fact") player.facts[key] = next;
      else player.counts[key] = next;
    });
  }

  function exportGame() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    const filename = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}_${slug(game.title)}.json`;
    const blob = new Blob([JSON.stringify(game, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    game.history.push({ timestamp: new Date().toISOString(), description: `Exported checkpoint: ${filename}.` });
    saveGame();
    render();
    showToast(`Downloaded ${filename}`);
  }

  function importGame(file) {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!imported.players || !imported.config || !Array.isArray(imported.history)) throw new Error("Invalid save");
        game = imported;
        game.history.push({ timestamp: new Date().toISOString(), description: "Game imported from JSON checkpoint. Undo history begins fresh." });
        undoStack = [];
        redoStack = [];
        screen = "dashboard";
        saveGame("Imported game and saved it locally.");
        startAutosave();
        render();
      } catch (error) {
        showToast("That file is not a valid Catan Scoring Engine save.");
      }
    });
    reader.readAsText(file);
  }

  function handleClick(event) {
    const target = event.target.closest("button");
    if (!target) return;
    const action = target.dataset.action;
    if (action === "new-game") {
      setupDraft = createSetupDraft();
      screen = "setup";
      render();
    }
    if (action === "import-game") importInput.click();
    if (action === "resume-game") {
      game = getStoredGame();
      undoStack = [];
      redoStack = [];
      screen = "dashboard";
      startAutosave();
      render();
    }
    if (action === "back-home") {
      screen = "welcome";
      render();
    }
    if (action === "home") {
      openPlayerId = null;
      screen = "welcome";
      render();
    }
    if (action === "create-game") buildNewGame();
    if (action === "open-player") {
      openPlayerId = target.dataset.player;
      renderModal();
    }
    if (action === "close-modal") {
      openPlayerId = null;
      modalRoot.innerHTML = "";
    }
    if (target.dataset.adjust) {
      updateValueByStep(target.dataset.adjust, target.dataset.key, target.dataset.player, Number(target.dataset.amount));
    }
    if (action === "confirm-suggestion") assignAward(target.dataset.key, target.dataset.player);
    if (action === "lock-metropolis") {
      const key = target.dataset.key;
      const state = game.metropolises[key];
      const owner = playerById(state.ownerId);
      commit(`${owner.name} secured the ${METROPOLISES[key].locked} metropolis.`, () => {
        state.locked = true;
      });
    }
    if (action === "add-route") {
      const player = playerById(target.dataset.player);
      if (player.routes.length >= 5) return;
      commit(`${player.name} started mapping a new route.`, () => {
        player.routes.push({ id: `route-${Date.now()}`, segments: [] });
      });
    }
    if (action === "delete-route") {
      const player = playerById(target.dataset.player);
      const routeIndex = player.routes.findIndex((route) => route.id === target.dataset.route);
      commit(`${player.name} removed Route ${routeIndex + 1} from the tracker.`, () => {
        player.routes.splice(routeIndex, 1);
      });
    }
    if (action === "add-segment") {
      const player = playerById(target.dataset.player);
      const route = player.routes.find((entry) => entry.id === target.dataset.route);
      commit(`${player.name} extended a route with a ${target.dataset.type.toLowerCase()}.`, () => {
        route.segments.push({ id: `segment-${Date.now()}-${Math.random()}`, type: target.dataset.type, camel: false });
      });
    }
    if (action === "toggle-camel") {
      const player = playerById(target.dataset.player);
      const route = player.routes.find((entry) => entry.id === target.dataset.route);
      const segment = route.segments.find((entry) => entry.id === target.dataset.segment);
      const added = !segment.camel;
      commit(`${player.name} ${added ? "marked a camel beside" : "removed the camel mark from"} a ${segment.type.toLowerCase()} segment.`, () => {
        segment.camel = added;
      });
    }
    if (action === "delete-segment") {
      const player = playerById(target.dataset.player);
      const route = player.routes.find((entry) => entry.id === target.dataset.route);
      const segment = route.segments.find((entry) => entry.id === target.dataset.segment);
      commit(`${player.name} trimmed a ${segment.type.toLowerCase()} from a route.`, () => {
        route.segments = route.segments.filter((entry) => entry.id !== segment.id);
      });
    }
    if (action === "confirm-winner") {
      const winner = playerById(target.dataset.player);
      commit(`${winner.name} confirmed as winner. Game marked complete.`, () => {
        game.status = "completed";
        game.winnerId = winner.id;
      });
    }
    if (action === "open-rules") openRulesModal();
    if (action === "save-rules") {
      const targetValue = Math.max(1, Number(document.getElementById("editTarget").value) || game.config.target);
      const alternative = document.getElementById("editAltTarget").value;
      const requiresWonder = document.getElementById("editWonderRequired").checked;
      const updates = {};
      modalRoot.querySelectorAll("[data-edit-point]").forEach((input) => updates[input.dataset.editPoint] = Number(input.value));
      commit("Scoring rules or victory paths were updated.", () => {
        game.config.target = targetValue;
        game.config.alternativeTarget = alternative ? Number(alternative) : null;
        game.config.requiresWonder = requiresWonder;
        Object.assign(game.config.points, updates);
      });
      modalRoot.innerHTML = "";
    }
    if (action === "open-sessions") openSessionsModal();
    if (action === "end-session") {
      const session = game.sessions.find((entry) => entry.id === target.dataset.session);
      commit("Current play session ended.", () => {
        session.endedAt = new Date().toISOString();
      });
      openSessionsModal();
    }
    if (action === "new-session") {
      const activeSession = game.sessions.find((session) => !session.endedAt);
      if (activeSession) {
        showToast("End the active session before beginning another.");
        return;
      }
      const now = new Date().toISOString();
      commit("New play session started.", () => {
        game.sessions.push({ id: `session-${Date.now()}`, date: now.slice(0, 10), startedAt: now, endedAt: null, notes: "" });
      });
      openSessionsModal();
    }
  }

  function handleChange(event) {
    const target = event.target;
    if (screen === "setup" && (target.matches("[data-expansion]") || target.id === "setupPlayerCount")) {
      collectSetupDraft();
      if (target.matches("[data-expansion]") && !target.checked) {
        const expansion = EXPANSIONS.find((item) => item.id === target.dataset.expansion);
        setupDraft.scenarios = setupDraft.scenarios.filter((scenario) => !expansion.scenarios.some((entry) => entry[0] === scenario));
      }
      render();
      return;
    }
    if (screen === "setup" && target.matches("[data-scenario], [data-optional]")) {
      collectSetupDraft();
      render();
      return;
    }
    if (target.dataset.set) {
      updateValue(target.dataset.set, target.dataset.key, target.dataset.player, target.value);
    }
    if (target.dataset.award) assignAward(target.dataset.award, target.value);
    if (target.dataset.metropolis) {
      const key = target.dataset.metropolis;
      const prior = game.metropolises[key].ownerId ? playerById(game.metropolises[key].ownerId).name : "Unassigned";
      const next = target.value ? playerById(target.value).name : "Unassigned";
      commit(next === "Unassigned"
        ? `${METROPOLISES[key].color} Metropolis returned to the board.`
        : `${next} reached ${METROPOLISES[key].temporary} and took the ${METROPOLISES[key].color} Metropolis${prior !== "Unassigned" ? ` from ${prior}` : ""}.`, () => {
        game.metropolises[key].ownerId = target.value || null;
      });
    }
    if (target.dataset.wonder) {
      const player = playerById(target.dataset.wonder);
      const next = target.value;
      commit(`${player.name} ${next ? `claimed ${next} as their Wonder of CATAN` : "released their Wonder of CATAN claim"}.`, () => {
        player.wonder = next ? { name: next, level: 1 } : null;
      });
    }
    if (target.dataset.wonderLevel) {
      const player = playerById(target.dataset.wonderLevel);
      const nextLevel = Number(target.value);
      commit(`${player.name} advanced ${player.wonder.name} to level ${nextLevel}.`, () => {
        player.wonder.level = nextLevel;
      });
    }
    if (target.dataset.sessionNote) {
      const session = game.sessions.find((entry) => entry.id === target.dataset.sessionNote);
      const note = target.value.trim();
      commit("Session notes updated.", () => {
        session.notes = note;
      });
      openSessionsModal();
    }
  }

  app.addEventListener("click", handleClick);
  app.addEventListener("change", handleChange);
  modalRoot.addEventListener("click", handleClick);
  modalRoot.addEventListener("change", handleChange);
  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("redoBtn").addEventListener("click", redo);
  document.getElementById("exportBtn").addEventListener("click", exportGame);
  importInput.addEventListener("change", () => {
    if (importInput.files[0]) importGame(importInput.files[0]);
    importInput.value = "";
  });

  render();
}());
