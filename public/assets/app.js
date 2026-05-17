const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function participantName() {
  const current = localStorage.getItem("dc256.participant");
  if (current) return current;
  const generated = `team-${Math.random().toString(16).slice(2, 8)}`;
  localStorage.setItem("dc256.participant", generated);
  return generated;
}

function setParticipant(value) {
  const clean = value.trim() || participantName();
  localStorage.setItem("dc256.participant", clean);
  return clean;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

function showResult(element, text, ok = true) {
  element.textContent = text;
  element.classList.remove("ok", "error");
  element.classList.add(ok ? "ok" : "error");
}

async function loadAccounts(select) {
  const data = await api("/api/accounts");
  if (select) {
    select.innerHTML = data.accounts.map((account) => (
      `<option value="${account.id}">${account.email} - ${account.department} - Tier ${account.tier}</option>`
    )).join("");
  }
  return data.accounts;
}

async function loadServices() {
  return api("/api/services");
}

async function loadState() {
  return api("/api/state");
}

function shortOwner(value) {
  if (!value) return "";
  return value.length > 16 ? `${value.slice(0, 16)}...` : value;
}

function renderLeaderboard(state) {
  const board = $("#leaderboard");
  if (!board) return;
  if (!state.leaderboard.length) {
    board.innerHTML = `<div class="board-empty">No flags submitted yet.</div>`;
    return;
  }
  board.innerHTML = state.leaderboard.map((entry, index) => `
    <div class="score-row">
      <span class="score-rank">#${index + 1}</span>
      <span class="score-name">${entry.participant}</span>
      <span class="score-solves">${entry.solves} nodes</span>
      <span class="score-points">${entry.points}</span>
    </div>
  `).join("");
}

function renderNetwork(state) {
  const root = $("#breachMap");
  if (!root) return;
  root.innerHTML = state.network.map((department) => `
    <section class="vlan panel">
      <header class="vlan-head">
        <div>
          <h3>${department.name} VLAN</h3>
          <p class="muted">${department.nodes.length} hosts</p>
        </div>
        <span class="pill">${department.key}</span>
      </header>
      <div class="vlan-mesh">
        ${department.nodes.map((node) => `
          <article class="host-node${node.solved ? " solved" : ""}">
            <span class="host-tier">T${node.tier}</span>
            <strong>${node.label}</strong>
            <small>${node.points} pts</small>
            <em>${node.solved ? shortOwner(node.owner) : "unclaimed"}</em>
          </article>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function renderState(state) {
  const solved = $("#solvedCount");
  const points = $("#totalPoints");
  const keys = $("#keysEarned");
  const final = $("#finalStatus");
  if (solved) solved.textContent = `${state.solvedCount}/${state.totalAccounts}`;
  if (points) points.textContent = String(state.totalPoints);
  if (keys) keys.textContent = `${state.keysEarned}/${state.keysRequired}`;
  if (final) {
    final.textContent = state.finalUnlocked ? state.finalFlag : "Locked";
    final.classList.toggle("ok", state.finalUnlocked);
  }

  const deptRoot = $("#departmentProgress");
  if (deptRoot) {
    deptRoot.innerHTML = state.departments.map((dept) => {
      const pct = Math.round((dept.solved / dept.total) * 100);
      return `<div class="panel dept">
        <h3>${dept.name} ${dept.keyEarned ? '<span class="pill">key earned</span>' : ""}</h3>
        <p class="muted">${dept.solved} of ${dept.total} nodes unlocked</p>
        <div class="progress"><span style="width:${pct}%; background:var(--accent)"></span></div>
      </div>`;
    }).join("");
  }

  renderLeaderboard(state);
  renderNetwork(state);
}

window.DC256 = {
  $,
  $$,
  api,
  loadAccounts,
  loadServices,
  loadState,
  renderState,
  showResult,
  participantName,
  setParticipant
};
